import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Search, Mic, Volume2, Loader2, MapPin, X } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";
import { useSettings } from "@/context/SettingsContext";
import { useAuth } from "@/context/AuthContext";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const SearchMode = ({ onBack, isActive }) => {
  const { settings, narrate } = useSettings();
  const { getToken } = useAuth();
  
  const [isStreaming, setIsStreaming] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [foundObject, setFoundObject] = useState(null);
  const [objectLocation, setObjectLocation] = useState(null); // left, center, right, top, bottom
  const [objectDistance, setObjectDistance] = useState(null); // close, medium, far
  const [searchAttempts, setSearchAttempts] = useState(0);
  const [directionGuidance, setDirectionGuidance] = useState("");
  const [recentSearches, setRecentSearches] = useState([]);
  const [statusMessage, setStatusMessage] = useState("Digite o que você procura");
  
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const searchIntervalRef = useRef(null);
  const hasPermissionRef = useRef(false);

  const announceStatus = (message) => {
    setStatusMessage(message);
    narrate(message);
  };

  // Start camera when component becomes active
  useEffect(() => {
    if (isActive && !hasPermissionRef.current) {
      startWebcam();
      hasPermissionRef.current = true;
    }
  }, [isActive]);

  const startWebcam = async () => {
    try {
      announceStatus("Ativando câmera para busca. Aguarde.");
      
      const constraints = {
        video: {
          facingMode: "environment",
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
        announceStatus("Câmera pronta. Digite ou fale o que você procura.");
        toast.success("Câmera ativada!");
      }
    } catch (error) {
      console.error("Webcam error:", error);
      setIsStreaming(false);
      hasPermissionRef.current = false;
      
      let errorMessage = "Erro ao acessar câmera: ";
      if (error.name === 'NotAllowedError') {
        errorMessage = "Permissão de câmera negada. Por favor, permita o acesso.";
      } else if (error.name === 'NotFoundError') {
        errorMessage = "Nenhuma câmera encontrada no dispositivo.";
      }
      
      announceStatus(errorMessage);
      toast.error(errorMessage, { duration: 6000 });
    }
  };

  const startVoiceSearch = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.lang = 'pt-BR';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
        announceStatus("Escutando. Diga o que você procura.");
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setSearchQuery(transcript);
        announceStatus(`Procurando por: ${transcript}`);
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
        toast.error("Erro ao reconhecer voz. Tente novamente.");
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } else {
      toast.error("Reconhecimento de voz não disponível neste navegador.");
      narrate("Reconhecimento de voz não disponível. Use o campo de texto.");
    }
  };

  const startSearch = async () => {
    if (!searchQuery.trim()) {
      announceStatus("Por favor, digite ou fale o que você procura.");
      toast.error("Digite o que você procura!");
      return;
    }

    setIsSearching(true);
    setSearchAttempts(0);
    setDirectionGuidance("Movimente a câmera lentamente em todas as direções.");
    announceStatus(`Iniciando busca por: ${searchQuery}. Movimente a câmera lentamente para procurar.`);
    
    // Add to recent searches
    if (!recentSearches.includes(searchQuery)) {
      setRecentSearches(prev => [searchQuery, ...prev.slice(0, 4)]);
    }

    // Start continuous search
    searchIntervalRef.current = setInterval(() => {
      searchForObject();
    }, 2000); // Search every 2 seconds
  };

  const stopSearch = () => {
    if (searchIntervalRef.current) {
      clearInterval(searchIntervalRef.current);
      searchIntervalRef.current = null;
    }
    setIsSearching(false);
    setFoundObject(null);
    setObjectLocation(null);
    setObjectDistance(null);
    setSearchAttempts(0);
    setDirectionGuidance("");
    announceStatus("Busca interrompida.");
  };

  const searchForObject = async () => {
    if (!videoRef.current || !isStreaming) return;

    try {
      setSearchAttempts(prev => prev + 1);
      
      // Capture frame
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      
      if (canvas.width === 0 || canvas.height === 0) return;
      
      const ctx = canvas.getContext('2d');
      ctx.drawImage(videoRef.current, 0, 0);
      const imageData = canvas.toDataURL('image/jpeg', 0.7);

      const authToken = await getToken();
      const response = await axios.post(
        `${API}/detect/analyze-frame`,
        {
          image_data: imageData,
          detection_type: "cloud",
          source: "search",
          search_query: searchQuery
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          }
        }
      );

      if (response.data && response.data.description) {
        const description = response.data.description;
        
        // Check if object was found using the new format from backend
        if (description.includes("OBJETO ENCONTRADO")) {
          setFoundObject(searchQuery);
          
          // Extract detailed location and distance from description
          const descLower = description.toLowerCase();
          
          // Determine location
          let location = "centro";
          let horizontalPos = "";
          let verticalPos = "";
          
          if (descLower.includes("esquerda")) horizontalPos = "esquerda";
          if (descLower.includes("direita")) horizontalPos = "direita";
          if (descLower.includes("superior") || descLower.includes("cima") || descLower.includes("alto")) verticalPos = "superior";
          if (descLower.includes("inferior") || descLower.includes("baixo")) verticalPos = "inferior";
          
          if (horizontalPos && verticalPos) {
            location = `${horizontalPos} ${verticalPos}`;
          } else if (horizontalPos) {
            location = horizontalPos;
          } else if (verticalPos) {
            location = verticalPos;
          }
          
          setObjectLocation(location);
          
          // Determine distance
          let distance = "próximo";
          if (descLower.includes("distante") || descLower.includes("longe") || descLower.includes("fundo")) {
            distance = "distante";
          } else if (descLower.includes("perto") || descLower.includes("próximo") || descLower.includes("frente")) {
            distance = "próximo";
          } else if (descLower.includes("médio") || descLower.includes("meio")) {
            distance = "média distância";
          }
          
          setObjectDistance(distance);
          
          // Stop search and announce with detailed info
          stopSearch();
          
          const locationAnnounce = `${searchQuery} encontrado! Posição: ${location}. Distância: ${distance}.`;
          announceStatus(locationAnnounce);
          toast.success(`✓ ${searchQuery} encontrado em: ${location}!`, { duration: 5000 });
          
          // Play directional success sound
          playDirectionalSound(location);
          
        } else {
          // Object not found, provide guidance
          const attempts = searchAttempts + 1;
          
          if (attempts === 3) {
            setDirectionGuidance("Tente virar a câmera para a esquerda.");
            playGuidanceBeep("left");
          } else if (attempts === 6) {
            setDirectionGuidance("Tente virar a câmera para a direita.");
            playGuidanceBeep("right");
          } else if (attempts === 9) {
            setDirectionGuidance("Tente apontar para cima.");
            playGuidanceBeep("up");
          } else if (attempts === 12) {
            setDirectionGuidance("Tente apontar para baixo.");
            playGuidanceBeep("down");
          } else if (attempts === 15) {
            setDirectionGuidance("Procurando... Continue movimentando a câmera.");
          }
        }
      }
    } catch (error) {
      console.error("Search error:", error);
    }
  };

  const playSuccessSound = () => {
    // Create a simple beep sound
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
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
          <Search className="w-6 h-6 inline mr-2" />
          Buscar Objetos
        </h2>
        <div className="w-24"></div>
      </div>

      {/* Camera Feed */}
      <div className="relative w-full h-[50vh] bg-black">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
          aria-label="Visualização da câmera"
        />

        {/* Object Found Indicator */}
        {foundObject && objectLocation && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="bg-green-500/90 text-white p-8 rounded-3xl text-center animate-pulse">
              <Search className="w-16 h-16 mx-auto mb-4" />
              <p className="text-2xl font-bold">{foundObject}</p>
              <p className="text-lg mt-2">Encontrado!</p>
              <p className="text-md mt-1">{objectLocation}</p>
            </div>
          </div>
        )}

        {/* Status Overlay */}
        {statusMessage && (
          <div className="absolute top-4 left-4 right-4">
            <div className={`p-4 rounded-xl backdrop-blur-xl ${
              settings.highContrast ? 'bg-black/90 border-2 border-white' : 'bg-blue-950/80 border border-blue-500/30'
            }`}
            role="status"
            aria-live="polite">
              <div className="flex items-center gap-3">
                {isSearching ? (
                  <Loader2 className="w-6 h-6 text-amber-500 animate-spin" aria-hidden="true" />
                ) : (
                  <Volume2 className="w-6 h-6 text-green-500" aria-hidden="true" />
                )}
                <p className={`text-sm font-medium ${settings.highContrast ? 'text-white' : 'text-white'}`}>
                  {statusMessage}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Search Controls */}
      <div className="p-6 space-y-4">
        {/* Search Input */}
        <div className="flex gap-2">
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && startSearch()}
            placeholder="Digite o que você procura..."
            disabled={isSearching}
            className={`flex-1 text-lg ${
              settings.highContrast
                ? 'bg-white text-black border-2 border-white'
                : 'bg-slate-800 text-white border-blue-500/30'
            }`}
            aria-label="Campo de busca"
          />
          <Button
            onClick={startVoiceSearch}
            disabled={isSearching || isListening}
            size="lg"
            className={settings.highContrast ? 'bg-white text-black' : 'bg-blue-600'}
            aria-label="Busca por voz"
          >
            <Mic className={`w-6 h-6 ${isListening ? 'animate-pulse text-red-500' : ''}`} />
          </Button>
        </div>

        {/* Search/Stop Button */}
        {!isSearching ? (
          <Button
            onClick={startSearch}
            disabled={!isStreaming || !searchQuery.trim()}
            size="lg"
            className={`w-full py-8 text-xl font-bold rounded-2xl ${
              settings.highContrast
                ? 'bg-white text-black hover:bg-gray-200'
                : 'bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 text-white'
            }`}
          >
            <Search className="w-8 h-8 mr-3" />
            Iniciar Busca
          </Button>
        ) : (
          <Button
            onClick={stopSearch}
            size="lg"
            className="w-full py-8 text-xl font-bold rounded-2xl bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white"
          >
            <X className="w-8 h-8 mr-3" />
            Parar Busca
          </Button>
        )}

        {/* Recent Searches */}
        {recentSearches.length > 0 && !isSearching && (
          <div className={`p-4 rounded-xl ${
            settings.highContrast
              ? 'bg-gray-900 border-2 border-white'
              : 'bg-blue-900/30 backdrop-blur-xl border border-blue-500/30'
          }`}>
            <h3 className={`text-sm font-bold mb-2 ${settings.highContrast ? 'text-white' : 'text-white'}`}>
              Buscas Recentes:
            </h3>
            <div className="flex flex-wrap gap-2">
              {recentSearches.map((search, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setSearchQuery(search);
                    announceStatus(`Selecionado: ${search}`);
                  }}
                  className={`px-3 py-1 rounded-lg text-sm ${
                    settings.highContrast
                      ? 'bg-white text-black'
                      : 'bg-blue-700 text-white hover:bg-blue-600'
                  }`}
                >
                  {search}
                </button>
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
            Como usar:
          </h3>
          <ul className={`text-xs space-y-1 ${settings.highContrast ? 'text-gray-400' : 'text-blue-200'}`}>
            <li>1. Digite ou fale o objeto que procura</li>
            <li>2. Clique em "Iniciar Busca"</li>
            <li>3. Movimente a câmera lentamente</li>
            <li>4. Ouça o alerta quando o objeto for encontrado</li>
            <li>5. O sistema indicará a localização do objeto</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SearchMode;
