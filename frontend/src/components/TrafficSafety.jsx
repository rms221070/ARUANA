import { useState, useRef, useEffect } from "react";
import { ArrowLeft, Camera, Volume2, AlertTriangle, CheckCircle, Car, Navigation, StopCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSettings } from "@/context/SettingsContext";
import { useAuth } from "@/context/AuthContext";
import axios from "axios";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const TrafficSafety = ({ onBack, isActive }) => {
  const { settings } = useSettings();
  const { getToken } = useAuth();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const analysisIntervalRef = useRef(null);
  const audioContextRef = useRef(null);

  const [isStreaming, setIsStreaming] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [mode, setMode] = useState("navigation"); // "navigation" or "crossing"
  const [trafficStatus, setTrafficStatus] = useState("");
  const [dangerLevel, setDangerLevel] = useState("safe"); // "safe", "caution", "danger", "critical"
  const [detectedVehicles, setDetectedVehicles] = useState([]);
  const [trafficSigns, setTrafficSigns] = useState([]);
  const [crosswalkDetected, setCrosswalkDetected] = useState(false);
  const [trafficLightState, setTrafficLightState] = useState(null);
  const [alertHistory, setAlertHistory] = useState([]);
  const [isSafeToCross, setIsSafeToCross] = useState(null);

  useEffect(() => {
    if (isActive) {
      startCamera();
    }

    return () => {
      stopCamera();
      stopAnalysis();
    };
  }, [isActive]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          facingMode: "environment"
        }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsStreaming(true);
        announceStatus("Câmera ativada. Sistema de segurança no trânsito pronto.");
        toast.success("Câmera ativada para análise de trânsito!");
        
        // Start automatic analysis
        startContinuousAnalysis();
      }
    } catch (error) {
      console.error("Camera error:", error);
      announceStatus("Erro ao acessar câmera. Verifique as permissões.");
      toast.error("Erro ao acessar câmera");
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsStreaming(false);
  };

  const startContinuousAnalysis = () => {
    if (analysisIntervalRef.current) return;

    // Analyze every 2 seconds in navigation mode, 1.5 seconds in crossing mode
    const interval = mode === "crossing" ? 1500 : 2000;
    
    analysisIntervalRef.current = setInterval(() => {
      if (!isAnalyzing && isStreaming) {
        analyzeTraffic();
      }
    }, interval);
  };

  const stopAnalysis = () => {
    if (analysisIntervalRef.current) {
      clearInterval(analysisIntervalRef.current);
      analysisIntervalRef.current = null;
    }
  };

  const captureFrame = () => {
    if (!videoRef.current || !canvasRef.current) return null;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    return canvas.toDataURL('image/jpeg', 0.8);
  };

  const analyzeTraffic = async () => {
    if (!isStreaming || isAnalyzing) return;

    try {
      setIsAnalyzing(true);

      const imageData = captureFrame();
      if (!imageData) {
        setIsAnalyzing(false);
        return;
      }

      const token = getToken();
      if (!token) {
        throw new Error("Sessão expirada. Por favor, faça login novamente.");
      }

      const response = await axios.post(
        `${API}/detect/traffic-safety`,
        {
          image_data: imageData,
          detection_type: "traffic",
          source: "traffic_safety",
          mode: mode
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.data && response.data.description) {
        processTrafficAnalysis(response.data.description);
      }

    } catch (error) {
      console.error("Traffic analysis error:", error);
      
      if (error.response?.status === 401) {
        announceStatus("Sessão expirada. Por favor, faça login novamente.");
        toast.error("Sessão expirada");
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const processTrafficAnalysis = (description) => {
    const descLower = description.toLowerCase();

    // Extract danger level
    let newDangerLevel = "safe";
    if (descLower.includes("perigo crítico") || descLower.includes("não atravesse")) {
      newDangerLevel = "critical";
    } else if (descLower.includes("perigo") || descLower.includes("atenção máxima")) {
      newDangerLevel = "danger";
    } else if (descLower.includes("cuidado") || descLower.includes("atenção")) {
      newDangerLevel = "caution";
    }

    // Update danger level and play alert if increased
    if (newDangerLevel !== dangerLevel) {
      setDangerLevel(newDangerLevel);
      if (newDangerLevel === "critical" || newDangerLevel === "danger") {
        playAlertSound(newDangerLevel);
      }
    }

    // Extract vehicles
    const vehicleTypes = ["carro", "moto", "ônibus", "caminhão", "bicicleta", "patinete", "veículo"];
    const foundVehicles = [];
    vehicleTypes.forEach(type => {
      if (descLower.includes(type)) {
        foundVehicles.push(type);
      }
    });
    setDetectedVehicles(foundVehicles);

    // Extract traffic signs
    const signs = [];
    if (descLower.includes("pare") || descLower.includes("stop")) signs.push("PARE");
    if (descLower.includes("preferência")) signs.push("Dê a Preferência");
    if (descLower.includes("proibido")) signs.push("Proibido");
    if (descLower.includes("velocidade")) signs.push("Limite de Velocidade");
    setTrafficSigns(signs);

    // Check crosswalk
    const hasCrosswalk = descLower.includes("faixa") && descLower.includes("pedestre");
    setCrosswalkDetected(hasCrosswalk);

    // Check traffic light
    let lightState = null;
    if (descLower.includes("semáforo vermelho") || descLower.includes("sinal vermelho")) {
      lightState = "red";
    } else if (descLower.includes("semáforo verde") || descLower.includes("sinal verde")) {
      lightState = "green";
    } else if (descLower.includes("semáforo amarelo") || descLower.includes("sinal amarelo")) {
      lightState = "yellow";
    }
    setTrafficLightState(lightState);

    // Safety to cross
    const safeToCross = descLower.includes("seguro atravessar") || descLower.includes("pode atravessar");
    const notSafeToCross = descLower.includes("não atravesse") || descLower.includes("não é seguro");
    if (safeToCross) {
      setIsSafeToCross(true);
    } else if (notSafeToCross) {
      setIsSafeToCross(false);
    }

    // Update status and announce
    setTrafficStatus(description);
    
    // Announce important alerts
    if (newDangerLevel === "critical") {
      announceStatus(`ALERTA CRÍTICO! ${description}`);
    } else if (newDangerLevel === "danger") {
      announceStatus(`ATENÇÃO! ${description}`);
    } else if (mode === "crossing" && isSafeToCross !== null) {
      if (isSafeToCross) {
        announceStatus("Seguro para atravessar.");
      } else {
        announceStatus("Não atravesse. Aguarde.");
      }
    }

    // Add to history
    addToHistory(description, newDangerLevel);
  };

  const addToHistory = (message, level) => {
    const entry = {
      id: Date.now(),
      message: message.substring(0, 100),
      level: level,
      timestamp: new Date().toLocaleTimeString('pt-BR')
    };
    setAlertHistory(prev => [entry, ...prev.slice(0, 9)]);
  };

  const playAlertSound = (level) => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }

    const audioContext = audioContextRef.current;
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    if (level === "critical") {
      // Rapid beeping for critical danger
      oscillator.frequency.value = 1000;
      oscillator.type = 'square';
      
      for (let i = 0; i < 5; i++) {
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime + i * 0.2);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + i * 0.2 + 0.1);
      }
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 1);
    } else if (level === "danger") {
      // Warning beep
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    }
  };

  const announceStatus = (message) => {
    if ('speechSynthesis' in window && settings.voiceEnabled) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(message);
      utterance.lang = 'pt-BR';
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    stopAnalysis();
    
    if (newMode === "crossing") {
      announceStatus("Modo atravessia ativado. Aponte a câmera para a rua. O sistema verificará se é seguro atravessar.");
    } else {
      announceStatus("Modo navegação ativado. O sistema alertará sobre veículos e obstáculos próximos.");
    }
    
    toast.success(`Modo ${newMode === "crossing" ? "Atravessia" : "Navegação"} ativado`);
    startContinuousAnalysis();
  };

  const getDangerColor = () => {
    switch (dangerLevel) {
      case "critical": return "bg-red-600";
      case "danger": return "bg-orange-600";
      case "caution": return "bg-yellow-600";
      default: return "bg-green-600";
    }
  };

  const getDangerIcon = () => {
    switch (dangerLevel) {
      case "critical":
      case "danger":
        return <AlertTriangle className="w-6 h-6 animate-pulse" />;
      case "caution":
        return <StopCircle className="w-6 h-6" />;
      default:
        return <CheckCircle className="w-6 h-6" />;
    }
  };

  return (
    <div className={`min-h-screen ${settings.highContrast ? 'bg-black' : 'bg-slate-900'}`}>
      {/* Header */}
      <div className={`p-4 flex items-center justify-between ${
        settings.highContrast ? 'bg-gray-900 border-b-2 border-white' : 'bg-blue-950/80 backdrop-blur-xl border-b border-blue-500/30'
      }`}>
        <Button
          onClick={onBack}
          variant="ghost"
          size="lg"
          className="text-white"
          aria-label="Voltar"
        >
          <ArrowLeft className="w-6 h-6 mr-2" />
          Voltar
        </Button>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Car className="w-6 h-6" />
          Segurança no Trânsito
        </h2>
        <div className="w-24"></div>
      </div>

      {/* Camera Feed */}
      <div className="relative w-full h-[45vh] bg-black">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
          aria-label="Visualização da câmera para análise de trânsito"
        />
        <canvas ref={canvasRef} className="hidden" />

        {/* Danger Level Indicator */}
        <div className={`absolute top-4 left-4 right-4 ${getDangerColor()} text-white p-4 rounded-xl backdrop-blur-xl flex items-center gap-3`}>
          {getDangerIcon()}
          <div className="flex-1">
            <p className="font-bold text-lg">
              {dangerLevel === "critical" && "⚠️ PERIGO CRÍTICO"}
              {dangerLevel === "danger" && "🚨 ATENÇÃO"}
              {dangerLevel === "caution" && "⚡ CUIDADO"}
              {dangerLevel === "safe" && "✓ SEGURO"}
            </p>
            <p className="text-sm opacity-90">
              {mode === "crossing" ? "Modo: Atravessia" : "Modo: Navegação"}
            </p>
          </div>
          {isAnalyzing && <Loader2 className="w-6 h-6 animate-spin" />}
        </div>

        {/* Crossing Safety Indicator */}
        {mode === "crossing" && isSafeToCross !== null && (
          <div className={`absolute bottom-4 left-4 right-4 ${
            isSafeToCross ? 'bg-green-500' : 'bg-red-500'
          } text-white p-6 rounded-2xl text-center animate-pulse`}>
            <p className="text-3xl font-bold">
              {isSafeToCross ? "✓ PODE ATRAVESSAR" : "✋ NÃO ATRAVESSE"}
            </p>
          </div>
        )}

        {/* Traffic Light State */}
        {trafficLightState && (
          <div className="absolute top-20 right-4 bg-black/80 p-3 rounded-xl">
            <div className={`w-12 h-12 rounded-full ${
              trafficLightState === "red" ? "bg-red-500" :
              trafficLightState === "yellow" ? "bg-yellow-500" :
              "bg-green-500"
            } animate-pulse`}></div>
            <p className="text-white text-xs text-center mt-1">Semáforo</p>
          </div>
        )}
      </div>

      {/* Controls and Info */}
      <div className="p-6 space-y-4">
        {/* Mode Selector */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={() => switchMode("navigation")}
            size="lg"
            className={`py-6 ${
              mode === "navigation"
                ? "bg-blue-600 text-white"
                : "bg-slate-700 text-gray-300"
            }`}
          >
            <Navigation className="w-5 h-5 mr-2" />
            Navegação
          </Button>
          <Button
            onClick={() => switchMode("crossing")}
            size="lg"
            className={`py-6 ${
              mode === "crossing"
                ? "bg-blue-600 text-white"
                : "bg-slate-700 text-gray-300"
            }`}
          >
            <StopCircle className="w-5 h-5 mr-2" />
            Atravessia
          </Button>
        </div>

        {/* Current Status */}
        {trafficStatus && (
          <div className={`p-4 rounded-xl ${
            settings.highContrast
              ? 'bg-gray-900 border-2 border-white'
              : 'bg-blue-900/30 backdrop-blur-xl border border-blue-500/30'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-white">Status Atual:</h3>
              <Button
                onClick={() => announceStatus(trafficStatus)}
                size="sm"
                className="bg-green-600 hover:bg-green-700"
              >
                <Volume2 className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-sm text-white/90">{trafficStatus.substring(0, 200)}</p>
          </div>
        )}

        {/* Detected Elements */}
        <div className="grid grid-cols-2 gap-3">
          {/* Vehicles */}
          {detectedVehicles.length > 0 && (
            <div className="bg-orange-900/30 p-3 rounded-xl">
              <p className="text-xs font-bold text-orange-200 mb-1">🚗 Veículos:</p>
              <p className="text-sm text-white">{detectedVehicles.join(", ")}</p>
            </div>
          )}

          {/* Traffic Signs */}
          {trafficSigns.length > 0 && (
            <div className="bg-blue-900/30 p-3 rounded-xl">
              <p className="text-xs font-bold text-blue-200 mb-1">🚦 Sinais:</p>
              <p className="text-sm text-white">{trafficSigns.join(", ")}</p>
            </div>
          )}

          {/* Crosswalk */}
          {crosswalkDetected && (
            <div className="bg-green-900/30 p-3 rounded-xl">
              <p className="text-xs font-bold text-green-200 mb-1">🚶 Faixa:</p>
              <p className="text-sm text-white">Detectada</p>
            </div>
          )}
        </div>

        {/* Alert History */}
        {alertHistory.length > 0 && (
          <details className={`p-4 rounded-xl ${
            settings.highContrast
              ? 'bg-gray-900 border-2 border-white'
              : 'bg-slate-800/50 backdrop-blur-xl'
          }`}>
            <summary className="text-sm font-bold text-white cursor-pointer">
              Histórico de Alertas ({alertHistory.length}) ▼
            </summary>
            <div className="mt-3 space-y-2 max-h-40 overflow-y-auto">
              {alertHistory.map(alert => (
                <div key={alert.id} className={`p-2 rounded text-xs ${
                  alert.level === "critical" ? "bg-red-900/50" :
                  alert.level === "danger" ? "bg-orange-900/50" :
                  alert.level === "caution" ? "bg-yellow-900/50" :
                  "bg-green-900/50"
                }`}>
                  <p className="text-white/70">{alert.timestamp}</p>
                  <p className="text-white">{alert.message}</p>
                </div>
              ))}
            </div>
          </details>
        )}

        {/* Instructions */}
        <div className={`p-4 rounded-xl ${
          settings.highContrast
            ? 'bg-gray-900 border-2 border-white'
            : 'bg-blue-900/30 backdrop-blur-xl border border-blue-500/30'
        }`}>
          <h3 className="text-sm font-bold mb-2 text-white">Como usar:</h3>
          <ul className="text-xs space-y-1 text-blue-200">
            <li><strong>Navegação:</strong> Alertas contínuos sobre veículos e obstáculos</li>
            <li><strong>Atravessia:</strong> Verifica segurança para atravessar a rua</li>
            <li>• Sistema analisa automaticamente a cada 2 segundos</li>
            <li>• Alertas sonoros para perigos críticos</li>
            <li>• Detecção de faixas, semáforos e placas</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default TrafficSafety;
