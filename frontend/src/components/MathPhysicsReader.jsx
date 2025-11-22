import { useState, useRef, useEffect } from "react";
import { ArrowLeft, Camera, Volume2, BookOpen, Calculator, Atom, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSettings } from "@/context/SettingsContext";
import { useAuth } from "@/context/AuthContext";
import axios from "axios";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const MathPhysicsReader = ({ onBack, isActive }) => {
  const { settings } = useSettings();
  // Authentication removed - no longer needed
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const [isStreaming, setIsStreaming] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [statusMessage, setStatusMessage] = useState("Ativando câmera para leitura matemática");
  const [analysisResult, setAnalysisResult] = useState(null);
  const [readingHistory, setReadingHistory] = useState([]);

  useEffect(() => {
    if (isActive) {
      startCamera();
    }

    return () => {
      stopCamera();
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
        announceStatus("Câmera ativada. Aponte para o documento matemático ou físico.");
        toast.success("Câmera ativada em alta resolução!");
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

  const captureFrame = () => {
    if (!videoRef.current || !canvasRef.current) return null;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    return canvas.toDataURL('image/jpeg', 0.9);
  };

  const analyzeMathPhysics = async () => {
    if (!isStreaming || isAnalyzing) return;

    try {
      setIsAnalyzing(true);
      announceStatus("Analisando conteúdo matemático e físico. Aguarde...");

      const imageData = captureFrame();
      if (!imageData) {
        toast.error("Erro ao capturar imagem");
        setIsAnalyzing(false);
        return;
      }

      // No authentication required (login removed)

      const response = await axios.post(
        `${API}/detect/math-physics`,
        {
          image_data: imageData,
          detection_type: "math_physics",
          source: "math_physics_reader"
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data && response.data.description) {
        setAnalysisResult(response.data.description);
        
        // Add to history
        const newEntry = {
          id: Date.now(),
          content: response.data.description.substring(0, 150) + "...",
          timestamp: new Date().toLocaleString('pt-BR')
        };
        setReadingHistory(prev => [newEntry, ...prev.slice(0, 9)]);
        
        announceStatus("Análise completa. Leitura e explicação disponíveis.");
        toast.success("Análise matemática concluída!");
      }

    } catch (error) {
      console.error("Math/Physics analysis error:", error);
      
      let errorMessage = "Erro ao analisar documento.";
      if (error.message.includes("Sessão expirada")) {
        errorMessage = error.message;
      } else if (error.response?.status === 401) {
        errorMessage = "Sessão expirada. Por favor, faça login novamente.";
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      }
      
      announceStatus(errorMessage);
      toast.error(errorMessage, { duration: 4000 });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const announceStatus = (message) => {
    setStatusMessage(message);
    if ('speechSynthesis' in window && settings.voiceEnabled) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(message);
      utterance.lang = 'pt-BR';
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  const readFullResult = () => {
    if (analysisResult && 'speechSynthesis' in window && settings.voiceEnabled) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(analysisResult);
      utterance.lang = 'pt-BR';
      utterance.rate = 0.9; // Slightly slower for complex content
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
      toast.success("Lendo análise completa...");
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
          <Calculator className="w-6 h-6" />
          Matemática & Física PhD
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
          aria-label="Visualização da câmera"
        />
        <canvas ref={canvasRef} className="hidden" />

        {/* Status Overlay */}
        {statusMessage && (
          <div className="absolute top-4 left-4 right-4">
            <div className={`p-4 rounded-xl backdrop-blur-xl flex items-center gap-3 ${
              settings.highContrast ? 'bg-black/90 border-2 border-white' : 'bg-blue-950/80 border border-blue-500/30'
            }`}>
              {isAnalyzing ? (
                <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
              ) : analysisResult ? (
                <CheckCircle className="w-6 h-6 text-green-500" />
              ) : (
                <Camera className="w-6 h-6 text-blue-500" />
              )}
              <p className="text-sm font-medium text-white flex-1">{statusMessage}</p>
            </div>
          </div>
        )}
      </div>

      {/* Controls and Results */}
      <div className="p-6 space-y-4">
        {/* Capture Button */}
        <Button
          onClick={analyzeMathPhysics}
          disabled={!isStreaming || isAnalyzing}
          size="lg"
          className="w-full py-8 text-xl font-bold rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white disabled:opacity-50"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="w-8 h-8 mr-3 animate-spin" />
              Analisando...
            </>
          ) : (
            <>
              <Calculator className="w-8 h-8 mr-3" />
              Capturar e Analisar
            </>
          )}
        </Button>

        {/* Analysis Result */}
        {analysisResult && (
          <div className={`p-6 rounded-2xl ${
            settings.highContrast
              ? 'bg-gray-900 border-2 border-white'
              : 'bg-gradient-to-br from-indigo-900/50 to-purple-900/50 backdrop-blur-xl border border-indigo-500/30'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Atom className="w-6 h-6 text-purple-400" />
                Análise Matemática/Física
              </h3>
              <Button
                onClick={readFullResult}
                size="sm"
                className="bg-purple-600 hover:bg-purple-700"
                aria-label="Ler análise completa"
              >
                <Volume2 className="w-4 h-4 mr-2" />
                Ler Tudo
              </Button>
            </div>

            <div className="bg-black/30 p-4 rounded-xl max-h-96 overflow-y-auto">
              <p className="text-white text-sm leading-relaxed whitespace-pre-wrap">
                {analysisResult}
              </p>
            </div>

            <div className="mt-4 flex gap-2">
              <Button
                onClick={() => {
                  navigator.clipboard.writeText(analysisResult);
                  toast.success("Copiado!");
                }}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700"
              >
                Copiar
              </Button>
              <Button
                onClick={() => {
                  const blob = new Blob([analysisResult], { type: 'text/plain' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `analise_matematica_${Date.now()}.txt`;
                  a.click();
                  URL.revokeObjectURL(url);
                  toast.success("Download iniciado!");
                }}
                size="sm"
                className="bg-green-600 hover:bg-green-700"
              >
                Baixar
              </Button>
            </div>
          </div>
        )}

        {/* Reading History */}
        {readingHistory.length > 0 && (
          <details className={`p-4 rounded-xl ${
            settings.highContrast
              ? 'bg-gray-900 border-2 border-white'
              : 'bg-slate-800/50 backdrop-blur-xl'
          }`}>
            <summary className="text-sm font-bold text-white cursor-pointer flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Histórico de Leituras ({readingHistory.length}) ▼
            </summary>
            <div className="mt-3 space-y-2 max-h-40 overflow-y-auto">
              {readingHistory.map(entry => (
                <div key={entry.id} className="p-2 rounded bg-indigo-900/30 text-xs">
                  <p className="text-white/70">{entry.timestamp}</p>
                  <p className="text-white mt-1">{entry.content}</p>
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
            <li>1. Aponte a câmera para o documento matemático ou físico</li>
            <li>2. Certifique-se de que fórmulas e equações estão visíveis</li>
            <li>3. Clique em "Capturar e Analisar"</li>
            <li>4. Ouça a explicação detalhada em nível PhD</li>
            <li>5. Use "Ler Tudo" para narração completa</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default MathPhysicsReader;
