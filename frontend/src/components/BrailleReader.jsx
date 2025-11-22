import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Camera, Loader2, Volume2, BookOpen, Grid3x3, CheckCircle, AlertCircle, Download, Copy } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";
import { useSettings } from "@/context/SettingsContext";
import { useAuth } from "@/context/AuthContext";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const BrailleReader = ({ onBack, isActive }) => {
  const { settings, narrate } = useSettings();
  // Authentication removed - no longer needed
  
  const [isStreaming, setIsStreaming] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [brailleText, setBrailleText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [imageQuality, setImageQuality] = useState(null); // good, medium, poor
  const [brailleHistory, setBrailleHistory] = useState([]);
  const [statusMessage, setStatusMessage] = useState("Ativando câmera para leitura de Braille");
  const [captureMode, setCaptureMode] = useState("single"); // single, continuous
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const hasPermissionRef = useRef(false);
  const continuousCaptureRef = useRef(null);

  const captureFrame = () => {
    if (!videoRef.current || !canvasRef.current) return null;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // ENHANCE: Apply contrast enhancement for better Braille detection
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    // Calculate average brightness
    let totalBrightness = 0;
    for (let i = 0; i < data.length; i += 4) {
      totalBrightness += (data[i] + data[i + 1] + data[i + 2]) / 3;
    }
    const avgBrightness = totalBrightness / (data.length / 4);
    
    // Apply adaptive contrast enhancement
    const contrastFactor = avgBrightness > 180 ? 2.0 : 1.5; // Higher contrast for bright images
    const factor = (259 * (contrastFactor * 255 + 255)) / (255 * (259 - contrastFactor * 255));
    
    for (let i = 0; i < data.length; i += 4) {
      data[i] = factor * (data[i] - 128) + 128;     // Red
      data[i + 1] = factor * (data[i + 1] - 128) + 128; // Green
      data[i + 2] = factor * (data[i + 2] - 128) + 128; // Blue
    }
    
    context.putImageData(imageData, 0, 0);

    return canvas.toDataURL('image/jpeg', 0.95);
  };

  const announceStatus = (message) => {
    setStatusMessage(message);
    narrate(message);
  };

  // Start camera when active
  useEffect(() => {
    if (isActive && !hasPermissionRef.current) {
      startWebcam();
      hasPermissionRef.current = true;
    }
  }, [isActive]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (continuousCaptureRef.current) {
        clearInterval(continuousCaptureRef.current);
      }
    };
  }, []);

  const startWebcam = async () => {
    try {
      announceStatus("Ativando câmera para leitura de Braille. Aguarde.");
      
      let constraints = {
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1920, min: 1280 }, // Higher resolution for Braille
          height: { ideal: 1080, min: 720 }
        },
        audio: false
      };

      try {
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setIsStreaming(true);
          announceStatus("Câmera pronta. Centralize o texto em Braille na tela. Use boa iluminação e mantenha a câmera estável.");
          toast.success("Câmera ativada em alta resolução para Braille!");
        }
      } catch (err) {
        // Fallback for desktop
        constraints = {
          video: {
            width: { ideal: 1920, min: 1280 },
            height: { ideal: 1080, min: 720 }
          },
          audio: false
        };
        
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setIsStreaming(true);
          announceStatus("Câmera pronta. Centralize o texto em Braille na tela.");
          toast.success("Câmera ativada!");
        }
      }
    } catch (error) {
      console.error("Webcam error:", error);
      setIsStreaming(false);
      
      let errorMessage = "Erro ao acessar câmera. ";
      if (error.name === 'NotAllowedError') {
        errorMessage = "Permissão de câmera negada. Clique no ícone de cadeado e permita o acesso.";
      }
      
      announceStatus(errorMessage);
      toast.error(errorMessage, { duration: 6000 });
    }
  };

  const analyzeImageQuality = (canvas) => {
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    // Calculate brightness and contrast
    let totalBrightness = 0;
    let pixelCount = 0;
    
    for (let i = 0; i < data.length; i += 4) {
      const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
      totalBrightness += brightness;
      pixelCount++;
    }
    
    const avgBrightness = totalBrightness / pixelCount;
    
    // Determine quality
    if (avgBrightness < 50) {
      return { quality: "poor", message: "Imagem muito escura. Aumente a iluminação." };
    } else if (avgBrightness > 220) {
      return { quality: "poor", message: "Imagem muito clara. Reduza a luz ou afaste de reflexos." };
    } else if (avgBrightness >= 100 && avgBrightness <= 180) {
      return { quality: "good", message: "Qualidade de imagem ótima para Braille." };
    } else {
      return { quality: "medium", message: "Qualidade aceitável. Ajuste a iluminação se possível." };
    }
  };

  const captureBraille = async () => {
    if (!videoRef.current || isAnalyzing) return;

    try {
      setIsAnalyzing(true);
      announceStatus("Capturando e analisando Braille. Mantenha a câmera estável.");

      // Check if camera is ready
      if (videoRef.current.videoWidth === 0 || videoRef.current.videoHeight === 0) {
        throw new Error("Câmera ainda não está pronta. Aguarde alguns segundos.");
      }
      
      // Capture frame with enhanced contrast processing
      const imageData = captureFrame();
      
      if (!imageData) {
        throw new Error("Erro ao capturar imagem da câmera.");
      }
      
      // Analyze image quality using the canvas
      const qualityCheck = analyzeImageQuality(canvasRef.current);
      setImageQuality(qualityCheck.quality);
      
      if (qualityCheck.quality === "poor") {
        announceStatus(qualityCheck.message);
        toast.warning(qualityCheck.message, { duration: 4000 });
      }

      announceStatus("Processando texto em Braille com IA especializada. Aguarde.");

      // No authentication required (login removed)

      const response = await axios.post(
        `${API}/detect/read-braille`,
        {
          image_data: imageData,
          detection_type: "cloud",
          source: "braille_reader"
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data) {
        const braille = response.data.braille_text || "";
        const translated = response.data.translated_text || response.data.description || "";
        
        setBrailleText(braille);
        setTranslatedText(translated);
        
        // Add to history
        const newEntry = {
          id: Date.now(),
          braille: braille,
          translated: translated,
          timestamp: new Date().toLocaleString('pt-BR')
        };
        setBrailleHistory(prev => [newEntry, ...prev.slice(0, 9)]);
        
        // Announce result
        if (translated) {
          announceStatus(`Braille lido com sucesso. Texto: ${translated}`);
          toast.success("Braille convertido com sucesso!", { duration: 3000 });
        } else {
          announceStatus("Nenhum Braille detectado. Ajuste a posição e iluminação.");
          toast.warning("Nenhum Braille detectado. Tente novamente.");
        }
      }

    } catch (error) {
      console.error("Braille analysis error:", error);
      
      let errorMessage = "Erro ao analisar Braille.";
      
      if (error.message.includes("Câmera ainda não está pronta")) {
        errorMessage = error.message;
      } else if (error.message.includes("Sessão expirada")) {
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

  const toggleContinuousMode = () => {
    if (captureMode === "single") {
      setCaptureMode("continuous");
      announceStatus("Modo contínuo ativado. Capturando automaticamente a cada 3 segundos.");
      
      continuousCaptureRef.current = setInterval(() => {
        if (!isAnalyzing) {
          captureBraille();
        }
      }, 3000);
    } else {
      setCaptureMode("single");
      announceStatus("Modo único ativado. Clique para capturar.");
      
      if (continuousCaptureRef.current) {
        clearInterval(continuousCaptureRef.current);
        continuousCaptureRef.current = null;
      }
    }
  };

  const downloadReading = (text, format = "txt") => {
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `braille_leitura_${Date.now()}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success("Arquivo baixado!");
    announceStatus("Leitura salva em arquivo.");
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
        <h2 className={`text-xl font-bold ${settings.highContrast ? 'text-white' : 'text-white'} flex items-center gap-2`}>
          <Grid3x3 className="w-6 h-6" />
          Leitor de Braille
        </h2>
        <Button
          onClick={toggleContinuousMode}
          variant="ghost"
          size="lg"
          className={captureMode === "continuous" ? 'bg-orange-500 text-white' : 'text-white'}
          aria-label="Alternar modo contínuo"
        >
          {captureMode === "continuous" ? "Contínuo" : "Único"}
        </Button>
      </div>

      {/* Camera Feed with Guidelines */}
      <div className="relative w-full h-[50vh] bg-black">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
          aria-label="Visualização da câmera"
        />
        {/* Hidden canvas for image processing */}
        <canvas
          ref={canvasRef}
          style={{ display: 'none' }}
          aria-hidden="true"
        />

        {/* Status and Quality Overlay */}
        {statusMessage && (
          <div className="absolute top-4 left-4 right-4">
            <div className={`p-4 rounded-xl backdrop-blur-xl ${
              settings.highContrast ? 'bg-black/90 border-2 border-white' : 'bg-blue-950/80 border border-blue-500/30'
            }`}
            role="status"
            aria-live="polite">
              <div className="flex items-center gap-3">
                {isAnalyzing ? (
                  <Loader2 className="w-6 h-6 text-orange-500 animate-spin" />
                ) : (
                  <Volume2 className="w-6 h-6 text-green-500 animate-pulse" />
                )}
                <p className="text-sm font-medium text-white flex-1">
                  {statusMessage}
                </p>
                {imageQuality && (
                  <div className="flex items-center gap-1">
                    {imageQuality === "good" ? (
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    ) : imageQuality === "medium" ? (
                      <AlertCircle className="w-5 h-5 text-yellow-400" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-400" />
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Controls and Results */}
      <div className="p-6 space-y-4 max-h-[45vh] overflow-y-auto">
        {/* Capture Button */}
        {captureMode === "single" && (
          <Button
            onClick={captureBraille}
            disabled={!isStreaming || isAnalyzing}
            size="lg"
            className={`w-full py-8 text-xl font-bold rounded-2xl ${
              settings.highContrast
                ? 'bg-white text-black hover:bg-gray-200'
                : 'bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white'
            }`}
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-8 h-8 mr-3 animate-spin" />
                Lendo Braille...
              </>
            ) : (
              <>
                <Camera className="w-8 h-8 mr-3" />
                Capturar e Ler Braille
              </>
            )}
          </Button>
        )}

        {/* Current Reading Result */}
        {translatedText && (
          <div className={`p-6 rounded-2xl ${
            settings.highContrast
              ? 'bg-gray-900 border-2 border-white'
              : 'bg-gradient-to-br from-blue-900/50 to-purple-900/50 backdrop-blur-xl border border-blue-500/30'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-lg font-bold ${settings.highContrast ? 'text-white' : 'text-white'} flex items-center gap-2`}>
                <BookOpen className="w-5 h-5" />
                Texto Lido:
              </h3>
              <div className="flex gap-2">
                <Button
                  onClick={() => downloadReading(translatedText)}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700"
                  aria-label="Baixar leitura"
                >
                  <Download className="w-4 h-4" />
                </Button>
                <Button
                  onClick={() => {
                    navigator.clipboard.writeText(translatedText);
                    toast.success("Copiado!");
                  }}
                  size="sm"
                  className="bg-purple-600 hover:bg-purple-700"
                  aria-label="Copiar texto"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <p className={`text-lg leading-relaxed ${settings.highContrast ? 'text-white' : 'text-blue-50'}`}>
              {translatedText}
            </p>
            {brailleText && (
              <p className="text-sm text-blue-300 mt-3 font-mono">
                Braille: {brailleText}
              </p>
            )}
          </div>
        )}

        {/* Reading History */}
        {brailleHistory.length > 0 && (
          <div className={`p-4 rounded-xl ${
            settings.highContrast
              ? 'bg-gray-900 border-2 border-white'
              : 'bg-blue-900/30 backdrop-blur-xl border border-blue-500/30'
          }`}>
            <h3 className={`text-md font-bold mb-3 ${settings.highContrast ? 'text-white' : 'text-white'}`}>
              Histórico de Leituras:
            </h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {brailleHistory.map((entry) => (
                <div
                  key={entry.id}
                  className={`p-3 rounded-lg cursor-pointer hover:bg-opacity-80 ${
                    settings.highContrast ? 'bg-gray-800' : 'bg-blue-800/50'
                  }`}
                  onClick={() => {
                    setTranslatedText(entry.translated);
                    setBrailleText(entry.braille);
                    narrate(`Leitura histórica: ${entry.translated}`);
                  }}
                >
                  <p className="text-sm text-white line-clamp-2">{entry.translated}</p>
                  <p className="text-xs text-blue-300 mt-1">{entry.timestamp}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className={`p-4 rounded-xl ${
          settings.highContrast
            ? 'bg-gray-900 border-2 border-white'
            : 'bg-blue-900/30 backdrop-blur-xl border border-blue-500/30'
        }`}>
          <h3 className={`text-sm font-bold mb-2 ${settings.highContrast ? 'text-white' : 'text-white'}`}>
            💡 Dicas para Melhor Leitura:
          </h3>
          <ul className={`text-xs space-y-1 ${settings.highContrast ? 'text-gray-400' : 'text-blue-200'}`}>
            <li>• Use iluminação uniforme e adequada</li>
            <li>• Mantenha a câmera paralela ao texto</li>
            <li>• Centralize o texto em Braille na tela</li>
            <li>• Evite sombras e reflexos</li>
            <li>• Mantenha a câmera estável durante a captura</li>
            <li>• Use modo contínuo para leitura de páginas</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default BrailleReader;
