import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Camera, Loader2, Volume2, MapPin } from "lucide-react";
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
  const [currentLocation, setCurrentLocation] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
  const [statusMessage, setStatusMessage] = useState("Iniciando câmera...");
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const autoDetectTimerRef = useRef(null);

  // Cleanup on unmount
  useEffect(() => {
    announceStatus(`Modo ${getModeTitle()} selecionado. Toque no botão para ativar a câmera.`);
    
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

  const getCurrentLocation = () => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        console.warn('Geolocation not supported');
        resolve(null);
        return;
      }

      setIsLocating(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const geoData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: new Date().toISOString()
          };
          setCurrentLocation(geoData);
          setIsLocating(false);
          resolve(geoData);
        },
        (error) => {
          console.warn('Geolocation error:', error);
          setIsLocating(false);
          resolve(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        }
      );
    });
  };

  const startWebcam = async () => {
    try {
      announceStatus("Solicitando acesso à câmera...");
      
      const constraints = {
        video: {
          facingMode: "environment", // Prefer back camera
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
        announceStatus("Câmera pronta. Posicione o objeto na frente da câmera.");
        toast.success("Câmera ativada com sucesso!");
        
        // Get location in background
        getCurrentLocation();
      }
    } catch (error) {
      console.error("Webcam error:", error);
      let errorMessage = "Erro ao acessar câmera. ";
      
      if (error.name === 'NotAllowedError') {
        errorMessage = "Permissão de câmera negada. Clique no ícone de câmera na barra de endereço e permita o acesso.";
      } else if (error.name === 'NotFoundError') {
        errorMessage = "Nenhuma câmera encontrada no dispositivo.";
      } else if (error.name === 'NotReadableError') {
        errorMessage = "Câmera está sendo usada por outro aplicativo. Feche outros apps e tente novamente.";
      } else {
        errorMessage += error.message;
      }
      
      announceStatus(errorMessage);
      toast.error(errorMessage, { duration: 5000 });
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
      announceStatus("Capturando imagem. Mantenha a câmera estável...");

      // Capture frame from video
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(videoRef.current, 0, 0);
      const imageData = canvas.toDataURL('image/jpeg', 0.8);

      announceStatus("Analisando imagem com inteligência artificial...");

      // Get location
      const location = await getCurrentLocation();

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
          source: "webcam",
          ...(location && {
            latitude: location.latitude,
            longitude: location.longitude
          })
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
        announceStatus("Análise concluída. " + response.data.description);
      }

      toast.success("Detecção realizada com sucesso!");

    } catch (error) {
      console.error("Analysis error:", error);
      const errorMessage = error.response?.data?.detail || "Erro ao analisar imagem. Tente novamente.";
      announceStatus(errorMessage);
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
      "general": "Geral"
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
        <div className="absolute top-4 left-4 right-4">
          <div className={`p-4 rounded-xl backdrop-blur-xl ${
            settings.highContrast ? 'bg-black/90 border-2 border-white' : 'bg-blue-950/80 border border-blue-500/30'
          }`}>
            <div className="flex items-center gap-3">
              {isAnalyzing ? (
                <Loader2 className="w-6 h-6 text-orange-500 animate-spin" />
              ) : (
                <Volume2 className="w-6 h-6 text-orange-500" />
              )}
              <p className={`text-sm font-medium ${settings.highContrast ? 'text-white' : 'text-white'}`}>
                {statusMessage}
              </p>
            </div>
            
            {currentLocation && (
              <div className="flex items-center gap-2 mt-2 text-xs text-green-400">
                <MapPin className="w-4 h-4" />
                <span>Localização capturada</span>
              </div>
            )}
          </div>
        </div>

        {/* Camera Guidelines - visual guide for positioning */}
        {!isAnalyzing && (
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
