import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Camera, Square, Loader2, Cloud, Bell, Mic, MicOff, Volume2 } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";
import { useSettings } from "@/context/SettingsContext";
import { useAuth } from "@/context/AuthContext";
import EmotionAnalysis from "@/components/EmotionAnalysis";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const WebcamDetection = ({ onFullscreenChange, isFullscreen }) => {
  const { t } = useTranslation();
  const { settings, narrate } = useSettings();
  const { token, getToken } = useAuth();
  const [isStreaming, setIsStreaming] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastDetection, setLastDetection] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [isListeningAudio, setIsListeningAudio] = useState(false);
  const [audioAnalysis, setAudioAnalysis] = useState(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [detectionMode, setDetectionMode] = useState("normal"); // "normal" or "ocr"
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const audioStreamRef = useRef(null);

  useEffect(() => {
    // Narrate component when loaded
    narrate(t('webcam.title') + '. ' + t('webcam.accessibilityDescription'));
    
    return () => {
      stopWebcam();
    };
  }, []);

  // Function to get geolocation
  const getCurrentLocation = () => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        console.warn('Geolocation not supported');
        resolve(null);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const geoData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: new Date().toISOString()
          };
          console.log('Geolocation captured:', geoData);
          resolve(geoData);
        },
        (error) => {
          console.warn('Geolocation error:', error);
          resolve(null); // Don't fail if geolocation fails
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        }
      );
    });
  };

  const startAudioAnalysis = async () => {
    try {
      const audioStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 44100,
          channelCount: 1,
          autoGainControl: true,
          noiseSuppression: false,
          echoCancellation: false
        }
      });
      
      audioStreamRef.current = audioStream;
      
      // Create audio context and analyser
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      
      const source = audioContextRef.current.createMediaStreamSource(audioStream);
      source.connect(analyserRef.current);
      
      analyserRef.current.fftSize = 1024;
      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      setIsListeningAudio(true);
      
      // Analyze audio continuously
      const analyzeAudio = () => {
        if (!analyserRef.current || !isListeningAudio) return;
        
        analyserRef.current.getByteFrequencyData(dataArray);
        
        // Calculate average volume
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const average = sum / bufferLength;
        setAudioLevel(Math.round(average));
        
        // Analyze frequency patterns to detect sound types
        const lowFreq = dataArray.slice(0, 50).reduce((a, b) => a + b, 0) / 50;
        const midFreq = dataArray.slice(50, 200).reduce((a, b) => a + b, 0) / 150;
        const highFreq = dataArray.slice(200, 400).reduce((a, b) => a + b, 0) / 200;
        
        let soundType = "silêncio";
        if (average > 30) {
          if (midFreq > highFreq && midFreq > lowFreq) {
            soundType = "pessoas falando";
          } else if (lowFreq > midFreq && lowFreq > highFreq) {
            soundType = "ruído de veículos ou maquinário";
          } else if (highFreq > midFreq && average > 50) {
            soundType = "música ou sons agudos";
          } else if (average > 60) {
            soundType = "ambiente barulhento";
          } else {
            soundType = "ruído ambiente";
          }
        }
        
        setAudioAnalysis({
          level: average,
          type: soundType,
          lowFreq: Math.round(lowFreq),
          midFreq: Math.round(midFreq),
          highFreq: Math.round(highFreq)
        });
        
        if (isListeningAudio) {
          requestAnimationFrame(analyzeAudio);
        }
      };
      
      analyzeAudio();
      narrate(t('webcam.audioAnalysisStarted'));
      
    } catch (error) {
      console.error('Error accessing microphone:', error);
      toast.error(t('webcam.audioError') + ": " + error.message);
    }
  };

  const stopAudioAnalysis = () => {
    setIsListeningAudio(false);
    
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach(track => track.stop());
      audioStreamRef.current = null;
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    analyserRef.current = null;
    setAudioAnalysis(null);
    setAudioLevel(0);
  };

  const startWebcam = async () => {
    try {
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        const errorMsg = 'Seu navegador não suporta acesso à câmera. Por favor, use um navegador mais recente como Chrome, Firefox ou Edge.';
        toast.error(errorMsg, { duration: 10000 });
        narrate(errorMsg);
        return;
      }

      // Show instructions toast BEFORE requesting permission
      toast.info('📷 Vamos solicitar permissão para acessar sua câmera. Clique em "Permitir" quando o navegador perguntar.', {
        duration: 5000
      });
      narrate('Solicitando permissão para acessar a câmera. Clique em permitir quando o navegador perguntar.');

      
      // Enhanced mobile camera configuration with preference for rear camera
      const constraints = {
        video: {
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
          facingMode: { ideal: "environment" }, // Use rear camera on mobile by default
          frameRate: { ideal: 30, max: 60 }
        }
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsStreaming(true);
        setCapturedImage(null);
        setShowPreview(false);
        
        // Activate fullscreen mode
        if (onFullscreenChange) {
          onFullscreenChange(true);
        }
        
        // Start audio analysis automatically
        await startAudioAnalysis();
        
        toast.success('✅ Câmera iniciada com sucesso!');
        narrate('Câmera iniciada com sucesso');
      }
    } catch (error) {
      console.error('Camera error:', error);
      
      let errorMsg = '';
      let instructions = '';
      
      // Provide user-friendly error messages based on error type
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        errorMsg = '🚫 PERMISSÃO NEGADA - Como resolver:';
        instructions = `
📱 NO CELULAR:
1. Toque no ícone 🔒 ou ⓘ ao lado da URL
2. Toque em "Permissões do site"
3. Encontre "Câmera" e mude para "Permitir"
4. Recarregue esta página

💻 NO COMPUTADOR (Chrome):
1. Clique no ícone 🔒 ou da câmera 📷 na barra de endereços (antes da URL)
2. Clique em "Câmera"
3. Selecione "Permitir sempre"
4. Recarregue esta página (F5)

💻 NO FIREFOX:
1. Clique no ícone 🔒 ao lado da URL
2. Clique na seta > ao lado de "Bloqueado temporariamente"
3. Clique em "Limpar estas permissões"
4. Clique novamente no botão "Iniciar Câmera" abaixo
        `;
        
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        errorMsg = '📷 Nenhuma câmera encontrada';
        instructions = 'Verifique se há uma câmera conectada ao seu dispositivo e tente novamente.';
        
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        errorMsg = '🔒 Câmera em uso';
        instructions = 'A câmera está sendo usada por outro aplicativo. Feche outros apps que possam estar usando a câmera (Zoom, Skype, Teams, etc.) e tente novamente.';
        
      } else if (error.name === 'OverconstrainedError') {
        errorMsg = 'Tentando configuração alternativa...';
        toast.info(errorMsg);
        
        // Try with simpler constraints
        try {
          const simpleStream = await navigator.mediaDevices.getUserMedia({ video: true });
          if (videoRef.current) {
            videoRef.current.srcObject = simpleStream;
            streamRef.current = simpleStream;
            setIsStreaming(true);
            toast.success('✅ Câmera iniciada com configurações básicas');
            narrate('Câmera iniciada com configurações básicas');
            return;
          }
        } catch (retryError) {
          errorMsg = '❌ Não foi possível acessar a câmera';
          instructions = 'Sua câmera não suporta as configurações solicitadas. Tente usar um dispositivo diferente.';
        }
      } else if (error.name === 'NotSupportedError' || error.name === 'TypeError') {
        errorMsg = '⚠️ Navegador não suportado';
        instructions = 'Seu navegador não suporta acesso à câmera. Por favor, use Chrome, Firefox, Safari ou Edge atualizados.';
      } else {
        errorMsg = '❌ Erro ao acessar a câmera';
        instructions = error.message || 'Erro desconhecido. Tente recarregar a página.';
      }
      
      // Show error with instructions
      toast.error(
        <div className="space-y-2">
          <div className="font-bold text-lg">{errorMsg}</div>
          <div className="text-sm whitespace-pre-line">{instructions}</div>
        </div>,
        { 
          duration: 15000, // 15 seconds to read instructions
          style: {
            maxWidth: '600px'
          }
        }
      );
      narrate(errorMsg + '. ' + instructions.replace(/\n/g, '. '));
    }
  };

  const stopWebcam = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    // Stop audio analysis too
    stopAudioAnalysis();
    
    // Deactivate fullscreen mode
    if (onFullscreenChange) {
      onFullscreenChange(false);
    }
    
    setIsStreaming(false);
    narrate(t('webcam.cameraStopped'));
  };

  const captureAndAnalyze = async () => {
    if (!videoRef.current) return;

    setIsAnalyzing(true);
    narrate(t('webcam.capturingImage'));
    
    // Create canvas with better quality settings
    const canvas = document.createElement("canvas");
    const video = videoRef.current;
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext("2d");
    
    // Draw the current frame
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = canvas.toDataURL("image/jpeg", 0.9); // Higher quality
    
    // Show captured image preview
    setCapturedImage(imageData);
    setShowPreview(true);
    
    // Stop the camera stream to show the captured image clearly
    stopWebcam();
    
    narrate(t('webcam.imageCapturedd') + '. ' + t('webcam.analyzingImage'));

    try {
      // Get the current token
      const authToken = getToken();
      
      if (!authToken) {
        const errorMsg = 'Você precisa fazer login para usar esta funcionalidade';
        toast.error(errorMsg);
        narrate(errorMsg);
        setIsAnalyzing(false);
        return;
      }

      // Capture geolocation
      const geoLocation = await getCurrentLocation();
      if (geoLocation) {
        toast.success('📍 Localização capturada', { duration: 2000 });
      }

      // Choose endpoint based on mode
      const endpoint = detectionMode === "ocr" 
        ? `${API}/detect/read-text`
        : `${API}/detect/analyze-frame`;
      
      const detectionType = detectionMode === "ocr" ? "text_reading" : "cloud";
      
      narrate(detectionMode === "ocr" 
        ? "Iniciando leitura de texto..." 
        : "Analisando imagem...");

      const response = await axios.post(endpoint, {
        source: "webcam",
        detection_type: detectionType,
        image_data: imageData,
        geo_location: geoLocation  // Include geolocation
      }, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        timeout: 60000 // 60 seconds timeout
      });

      setLastDetection(response.data);
      
      // COMPLETE NARRATION - Read everything in full detail
      let completeNarration = t('webcam.analysisComplete') + '. ';
      
      // 1. Main description (detailed scene analysis)
      if (response.data.description) {
        completeNarration += t('webcam.detectionResults') + ': ' + response.data.description + '. ';
      }
      
      // 2. Emotion analysis narration
      if (response.data.emotion_analysis) {
        completeNarration += t('emotions.title') + ': ';
        const emotions = response.data.emotion_analysis;
        const emotionParts = [];
        
        if (emotions.sorrindo > 0) emotionParts.push(`${emotions.sorrindo} ${emotions.sorrindo === 1 ? t('emotions.person') : t('emotions.people')} ${t('emotions.smiling')}`);
        if (emotions.serio > 0) emotionParts.push(`${emotions.serio} ${emotions.serio === 1 ? t('emotions.person') : t('emotions.people')} ${t('emotions.serious')}`);
        if (emotions.triste > 0) emotionParts.push(`${emotions.triste} ${emotions.triste === 1 ? t('emotions.person') : t('emotions.people')} ${t('emotions.sad')}`);
        if (emotions.surpreso > 0) emotionParts.push(`${emotions.surpreso} ${emotions.surpreso === 1 ? t('emotions.person') : t('emotions.people')} ${t('emotions.surprised')}`);
        if (emotions.zangado > 0) emotionParts.push(`${emotions.zangado} ${emotions.zangado === 1 ? t('emotions.person') : t('emotions.people')} ${t('emotions.angry')}`);
        if (emotions.neutro > 0) emotionParts.push(`${emotions.neutro} ${emotions.neutro === 1 ? t('emotions.person') : t('emotions.people')} ${t('emotions.neutral')}`);
        
        if (emotionParts.length > 0) {
          completeNarration += emotionParts.join(', ') + '. ';
        } else {
          completeNarration += t('webcam.noEmotionsDetected') + '. ';
        }
      }
      
      // 3. Sentiment analysis narration
      if (response.data.sentiment_analysis) {
        completeNarration += t('sentiments.title') + ': ';
        const sentiments = response.data.sentiment_analysis;
        const sentimentParts = [];
        
        if (sentiments.positivo > 0) sentimentParts.push(`${sentiments.positivo} ${sentiments.positivo === 1 ? t('sentiments.person') : t('sentiments.people')} ${t('sentiments.positive')}`);
        if (sentiments.neutro > 0) sentimentParts.push(`${sentiments.neutro} ${sentiments.neutro === 1 ? t('sentiments.person') : t('sentiments.people')} ${t('sentiments.neutral')}`);
        if (sentiments.negativo > 0) sentimentParts.push(`${sentiments.negativo} ${sentiments.negativo === 1 ? t('sentiments.person') : t('sentiments.people')} ${t('sentiments.negative')}`);
        
        if (sentimentParts.length > 0) {
          completeNarration += sentimentParts.join(', ') + '. ';
        } else {
          completeNarration += t('webcam.noSentimentsDetected') + '. ';
        }
      }
      
      // 4. Alerts narration
      if (response.data.alerts_triggered && response.data.alerts_triggered.length > 0) {
        const alertMessage = `${t('toast.alertTriggered')} ${response.data.alerts_triggered.join(", ")} ${t('toast.detected')}`;
        completeNarration += alertMessage + '. ';
        toast.warning(alertMessage);
      }
      
      // Narrate the complete analysis
      narrate(completeNarration);
      
      if (!response.data.alerts_triggered || response.data.alerts_triggered.length === 0) {
        toast.success(t('toast.analyzeSuccess'));
      }
    } catch (error) {
      const errorMsg = t('toast.analyzeError') + ": " + error.message;
      toast.error(errorMsg);
      narrate(errorMsg);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    setShowPreview(false);
    setLastDetection(null);
    startWebcam();
    narrate(t('webcam.retakingPhoto'));
  };

  return (
    <div className="grid lg:grid-cols-2 gap-6" data-testid="webcam-detection-container">
      <Card className={`${settings.highContrast ? 'bg-gray-900 border-white border-2' : 'bg-white/90 backdrop-blur-sm border-indigo-200 shadow-xl'}`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className={`flex items-center gap-2 text-2xl ${settings.highContrast ? 'text-white' : 'text-slate-800'}`}>
              <Camera className={`w-6 h-6 ${settings.highContrast ? 'text-white' : 'text-indigo-600'}`} />
              {t('webcam.title')}
            </CardTitle>
            {/* Mode Toggle */}
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  setDetectionMode("normal");
                  narrate("Modo normal de detecção ativado");
                }}
                variant={detectionMode === "normal" ? "default" : "outline"}
                size="sm"
                className={detectionMode === "normal" ? "bg-indigo-600 hover:bg-indigo-700" : ""}
              >
                🔍 Normal
              </Button>
              <Button
                onClick={() => {
                  setDetectionMode("ocr");
                  narrate("Modo leitura de texto ativado para livros e quadros");
                }}
                variant={detectionMode === "ocr" ? "default" : "outline"}
                size="sm"
                className={detectionMode === "ocr" ? "bg-orange-600 hover:bg-orange-700" : ""}
              >
                📚 Ler Texto
              </Button>
            </div>
          </div>
          {/* Mode Description */}
          {detectionMode === "ocr" && (
            <p className={`text-sm mt-2 ${settings.highContrast ? 'text-gray-300' : 'text-slate-600'}`}>
              📖 Modo de leitura ativo: otimizado para capturar e ler textos de livros, quadros de aula, placas e documentos
            </p>
          )}
        </CardHeader>
        <CardContent className={isFullscreen ? "p-0 m-0" : "space-y-4"}>
          {/* Video/Image Container - Fullscreen Optimized */}
          <div 
            className={`relative w-full bg-slate-900 overflow-hidden shadow-2xl ${
              isFullscreen 
                ? 'fixed inset-0 z-50 rounded-none border-0' 
                : 'rounded-2xl border-4 border-blue-600'
            }`}
            style={{ 
              height: isFullscreen ? '100vh' : '600px',
              maxHeight: isFullscreen ? '100vh' : '70vh'
            }} 
            data-testid="video-container">
            {showPreview && capturedImage ? (
              <div className="relative w-full h-full">
                <img 
                  src={capturedImage} 
                  alt={t('webcam.capturedImage')}
                  className="w-full h-full object-cover"
                  data-testid="captured-image"
                />
                <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded text-xs font-semibold">
                  {t('webcam.captured')}
                </div>
              </div>
            ) : (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
                data-testid="webcam-video"
              />
            )}
          </div>

          {/* Audio Analysis Display */}
          {isListeningAudio && (
            <div className={`p-3 rounded-lg border ${settings.highContrast ? 'bg-gray-800 border-gray-600' : 'bg-green-50 border-green-200'}`}>
              <div className={`flex items-center gap-2 mb-2 ${settings.highContrast ? 'text-white' : 'text-green-800'}`}>
                <Mic className="w-4 h-4" />
                <span className="text-sm font-medium">{t('webcam.audioAnalysis')}</span>
                <div className={`flex items-center gap-1 ${audioLevel > 30 ? 'text-green-600' : 'text-gray-400'}`}>
                  <Volume2 className="w-3 h-3" />
                  <div className="flex gap-1">
                    {[1,2,3,4,5].map(i => (
                      <div 
                        key={i} 
                        className={`w-1 h-3 rounded ${
                          audioLevel > (i * 20) ? 'bg-green-500' : 'bg-gray-300'
                        }`} 
                      />
                    ))}
                  </div>
                </div>
              </div>
              {audioAnalysis && (
                <div className={`text-xs ${settings.highContrast ? 'text-gray-300' : 'text-green-700'}`}>
                  <p className="font-medium">{t('webcam.detectedSound')}: {audioAnalysis.type}</p>
                  <p>{t('webcam.volumeLevel')}: {Math.round(audioAnalysis.level)}%</p>
                </div>
              )}
            </div>
          )}

          {/* Controls - Floating in fullscreen */}
          <div className={`flex gap-3 flex-wrap ${
            isFullscreen 
              ? 'fixed bottom-8 left-1/2 transform -translate-x-1/2 z-[60] bg-black/80 backdrop-blur-xl px-6 py-4 rounded-2xl shadow-2xl border-2 border-white/20' 
              : ''
          }`}>
            {!isStreaming && !showPreview ? (
              <Button
                onClick={startWebcam}
                className="flex-1 min-w-[200px] bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-700 hover:to-teal-600 text-white"
                data-testid="start-webcam-btn"
              >
                <Camera className="w-4 h-4 mr-2" />
                {t('webcam.start')}
              </Button>
            ) : showPreview ? (
              <>
                <Button
                  onClick={retakePhoto}
                  variant="outline"
                  className="flex-1 min-w-[140px]"
                  data-testid="retake-btn"
                >
                  <Camera className="w-4 h-4 mr-2" />
                  {t('webcam.retake')}
                </Button>
                {!isAnalyzing && !lastDetection && (
                  <Button
                    onClick={() => captureAndAnalyze()}
                    disabled={isAnalyzing}
                    className="flex-1 min-w-[140px] bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white"
                    data-testid="analyze-captured-btn"
                  >
                    <Cloud className="w-4 h-4 mr-2" />
                    {t('webcam.analyzeCapture')}
                  </Button>
                )}
              </>
            ) : (
              <>
                <Button
                  onClick={stopWebcam}
                  variant="destructive"
                  className="flex-1 min-w-[100px]"
                  data-testid="stop-webcam-btn"
                >
                  <Square className="w-4 h-4 mr-2" />
                  {t('webcam.stop')}
                </Button>
                <Button
                  onClick={captureAndAnalyze}
                  disabled={isAnalyzing}
                  className="flex-1 min-w-[140px] bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white"
                  data-testid="capture-analyze-btn"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {t('webcam.analyzing')}
                    </>
                  ) : (
                    <>
                      <Camera className="w-4 h-4 mr-2" />
                      {t('webcam.capture')}
                    </>
                  )}
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className={`${settings.highContrast ? 'bg-gray-900 border-white border-2' : 'bg-white/90 backdrop-blur-sm border-indigo-200 shadow-xl'}`}>
        <CardHeader>
          <CardTitle className={`text-2xl ${settings.highContrast ? 'text-white' : 'text-slate-800'}`}>{t('webcam.results')}</CardTitle>
        </CardHeader>
        <CardContent>
          {lastDetection ? (
            <div className="space-y-4" data-testid="detection-results">
              <div>
                <h3 className={`font-semibold text-lg mb-2 ${settings.highContrast ? 'text-white' : 'text-slate-700'}`}>{t('webcam.description')}</h3>
                <p className={`leading-relaxed ${settings.highContrast ? 'text-gray-300' : 'text-slate-600'}`} data-testid="detection-description">
                  {lastDetection.description}
                </p>
              </div>

              {lastDetection.objects_detected && lastDetection.objects_detected.length > 0 && (
                <div>
                  <h3 className={`font-semibold text-lg mb-2 ${settings.highContrast ? 'text-white' : 'text-slate-700'}`}>{t('webcam.objectsDetected')}</h3>
                  <div className="space-y-2" data-testid="detected-objects-list">
                    {lastDetection.objects_detected.map((obj, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200"
                        data-testid={`detected-object-${idx}`}
                      >
                        <span className="font-medium text-slate-700">{obj.label}</span>
                        <span className="text-sm text-emerald-600 font-semibold">
                          {Math.round(obj.confidence * 100)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {lastDetection.alerts_triggered && lastDetection.alerts_triggered.length > 0 && (
                <div className={`p-4 rounded-lg border ${settings.highContrast ? 'bg-yellow-900 border-yellow-500' : 'bg-amber-50 border-amber-200'}`} data-testid="alerts-triggered">
                  <h3 className={`font-semibold mb-2 flex items-center gap-2 ${settings.highContrast ? 'text-yellow-200' : 'text-amber-800'}`}>
                    <Bell className="w-5 h-5" />
                    {t('webcam.alertsTriggered')}
                  </h3>
                  <p className={settings.highContrast ? 'text-yellow-100' : 'text-amber-700'}>{lastDetection.alerts_triggered.join(", ")}</p>
                </div>
              )}
            </div>
          ) : (
            <div className={`text-center py-12 ${settings.highContrast ? 'text-gray-400' : 'text-slate-400'}`} data-testid="no-detection-message">
              <Camera className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>{t('webcam.noDetection')}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Análise de Emoções e Sentimentos */}
      {lastDetection && (lastDetection.emotion_analysis || lastDetection.sentiment_analysis) && (
        <EmotionAnalysis 
          emotionData={lastDetection.emotion_analysis}
          sentimentData={lastDetection.sentiment_analysis}
        />
      )}
    </div>
  );
};

export default WebcamDetection;