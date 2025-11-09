import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Camera, Loader2, Volume2 } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";
import { useSettings } from "@/context/SettingsContext";
import { useAuth } from "@/context/AuthContext";
import EmotionAnalysis from "@/components/EmotionAnalysis";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const CameraView = ({ mode, onBack }) => {
  const { t } = useTranslation();
  const { settings, narrate } = useSettings();
  const { getToken } = useAuth();
  const [isStreaming, setIsStreaming] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastDetection, setLastDetection] = useState(null);
  const [statusMessage, setStatusMessage] = useState("Iniciando câmera...");
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const autoDetectTimerRef = useRef(null);

  // Start camera automatically on mount
  useEffect(() => {
    startWebcam();
    
    return () => {
      stopWebcam();
    };
  }, []);

  // Auto-detect based on mode
  useEffect(() => {
    if (isStreaming && (mode === "text-short" || mode === "general")) {
      // Auto capture after 2 seconds for instant modes
      autoDetectTimerRef.current = setTimeout(() => {
        captureAndAnalyze();
      }, 2000);
    }
    
    return () => {
      if (autoDetectTimerRef.current) {
        clearTimeout(autoDetectTimerRef.current);
      }
    };
  }, [isStreaming, mode]);

  const announceStatus = (message) => {
    setStatusMessage(message);
    narrate(message);
  };

  const startWebcam = async () => {
    try {
      announceStatus("Aguarde. Ativando câmera.");
      
      // Determine facing mode based on selected mode
      const facingMode = mode === "selfie" ? "user" : "environment";
      
      const constraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsStreaming(true);
        const cameraType = facingMode === "user" ? "frontal" : "traseira";
        announceStatus(`Câmera ${cameraType} ativada. Posicione o objeto e pressione Capturar.`);
        toast.success(`Câmera ${cameraType} pronta!`, { duration: 2000 });
      }
    } catch (error) {
      console.error("Webcam error:", error);
      setIsStreaming(false);
      let errorMessage = "";
      
      if (error.name === 'NotAllowedError') {
        errorMessage = "IMPORTANTE: Você precisa permitir o acesso à câmera. Essa permissão é solicitada apenas UMA VEZ. Após permitir, a câmera ficará sempre disponível neste navegador. Por favor, clique em PERMITIR quando solicitado.";
      } else if (error.name === 'NotFoundError') {
        errorMessage = "Nenhuma câmera foi encontrada no seu dispositivo. Verifique se há uma câmera conectada.";
      } else if (error.name === 'NotReadableError') {
        errorMessage = "A câmera está sendo usada por outro aplicativo. Feche outros apps que estejam usando a câmera e recarregue esta página.";
      } else {
        errorMessage = "Erro ao acessar câmera: " + error.message;
      }
      
      announceStatus(errorMessage);
      toast.error(errorMessage, { duration: 8000 });
    }
  };

  const stopWebcam = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsStreaming(false);
  };

  const captureAndAnalyze = async () => {
    if (!videoRef.current || isAnalyzing) return;

    try {
      setIsAnalyzing(true);
      announceStatus("Capturando imagem. Por favor, aguarde.");

      // Capture frame from video
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(videoRef.current, 0, 0);
      const imageData = canvas.toDataURL('image/jpeg', 0.8);

      announceStatus("Analisando imagem com inteligência artificial. Aguarde o resultado.");

      // Determine detection type based on mode
      let endpoint = `${API}/detect/analyze-frame`;
      if (mode === "text-short" || mode === "document") {
        endpoint = `${API}/detect/read-text`;
      } else if (mode === "food") {
        endpoint = `${API}/detect/analyze-nutrition`;
      }

      const authToken = await getToken();
      const response = await axios.post(
        endpoint,
        {
          image_data: imageData,
          detection_type: "cloud",
          source: "webcam"
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          }
        }
      );

      setLastDetection(response.data);
      
      // Narrate result
      if (response.data.description) {
        announceStatus("Análise concluída. Resultado: " + response.data.description);
      }

      toast.success("Detecção realizada com sucesso!");

    } catch (error) {
      console.error("Analysis error:", error);
      const errorMessage = error.response?.data?.detail || "Erro ao analisar imagem. Tente novamente.";
      announceStatus("Erro na análise. " + errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getModeTitle = () => {
    const titles = {
      "text-short": "Texto Curto",
      "document": "Documento",
      "scene": "Cena",
      "food": "Alimentos",
      "people": "Pessoas",
      "general": "Geral",
      "selfie": "Selfie",
      "currency": "Moedas"
    };
    return titles[mode] || "Detecção";
  };

  return (
    <div className={`min-h-screen ${
      settings.highContrast ? 'bg-black' : 'bg-slate-900'
    }`}>
      {/* Header */}
      <div className={`p-4 flex items-center justify-between ${
        settings.highContrast ? 'bg-gray-900 border-b-2 border-white' : 'bg-blue-950/80 backdrop-blur-xl border-b border-blue-500/30'
      }`}>
        <Button
          onClick={onBack}
          variant="ghost"
          size="lg"
          className={settings.highContrast ? 'text-white' : 'text-white'}
          aria-label="Voltar"
        >
          <ArrowLeft className="w-6 h-6 mr-2" />
          Voltar
        </Button>
        <h2 className={`text-xl font-bold ${settings.highContrast ? 'text-white' : 'text-white'}`}>
          {getModeTitle()}
        </h2>
        <div className="w-24"></div>
      </div>

      {/* Camera Feed */}
      <div className="relative w-full h-[70vh] bg-black">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
          aria-label="Visualização da câmera"
        />

        {/* Status Overlay */}
        {statusMessage && (
          <div className="absolute top-4 left-4 right-4">
            <div className={`p-4 rounded-xl backdrop-blur-xl ${
              settings.highContrast ? 'bg-black/90 border-2 border-white' : 'bg-blue-950/80 border border-blue-500/30'
            }`}
            role="status"
            aria-live="polite"
            aria-atomic="true">
              <div className="flex items-center gap-3">
                {isAnalyzing ? (
                  <Loader2 className="w-6 h-6 text-orange-500 animate-spin" aria-hidden="true" />
                ) : isStreaming ? (
                  <Volume2 className="w-6 h-6 text-green-500 animate-pulse" aria-hidden="true" />
                ) : (
                  <Loader2 className="w-6 h-6 text-orange-500 animate-spin" aria-hidden="true" />
                )}
                <p className={`text-sm font-medium ${settings.highContrast ? 'text-white' : 'text-white'}`}>
                  {statusMessage}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Camera Guidelines - visual guide for positioning */}
        {isStreaming && !isAnalyzing && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-64 h-64 border-4 border-dashed border-white/50 rounded-2xl"></div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="p-6 space-y-4">
        <Button
          onClick={captureAndAnalyze}
          disabled={!isStreaming || isAnalyzing}
          size="lg"
          className={`w-full py-8 text-xl font-bold rounded-2xl ${
            settings.highContrast
              ? 'bg-white text-black hover:bg-gray-200'
              : 'bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white'
          }`}
          aria-label="Capturar e analisar"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="w-6 h-6 mr-3 animate-spin" />
              Analisando...
            </>
          ) : (
            <>
              <Camera className="w-6 h-6 mr-3" />
              Capturar e Analisar
            </>
          )}
        </Button>

        {/* Result Display */}
        {lastDetection && (
          <div className={`p-6 rounded-2xl ${
            settings.highContrast
              ? 'bg-gray-900 border-2 border-white'
              : 'bg-blue-900/30 backdrop-blur-xl border border-blue-500/30'
          }`}>
            <h3 className={`text-lg font-bold mb-3 ${settings.highContrast ? 'text-white' : 'text-white'}`}>
              Resultado da Análise
            </h3>
            <p className={`text-sm leading-relaxed ${settings.highContrast ? 'text-gray-300' : 'text-blue-100'}`}>
              {lastDetection.description}
            </p>

            {/* Emotion Analysis */}
            {lastDetection.emotion_analysis && (
              <div className="mt-4">
                <EmotionAnalysis 
                  emotionData={lastDetection.emotion_analysis}
                  sentimentData={lastDetection.sentiment_analysis}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CameraView;
