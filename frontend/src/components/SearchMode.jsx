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
  // Authentication removed - no longer needed
  
  const [isStreaming, setIsStreaming] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [foundObject, setFoundObject] = useState(null);
  const [objectLocation, setObjectLocation] = useState(null); // left, center, right, top, bottom
  const [objectDistance, setObjectDistance] = useState(null); // distance in meters
  const [navigationInstructions, setNavigationInstructions] = useState(""); // step-by-step navigation
  const [searchAttempts, setSearchAttempts] = useState(0);
  const [directionGuidance, setDirectionGuidance] = useState("");
  const [recentSearches, setRecentSearches] = useState([]);
  const [statusMessage, setStatusMessage] = useState("Digite o que você procura");
  const [fullDescription, setFullDescription] = useState(""); // Full AI response
  const [showVoiceTutorial, setShowVoiceTutorial] = useState(false);
  const [isFirstTime, setIsFirstTime] = useState(true);
  
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const searchIntervalRef = useRef(null);
  const hasPermissionRef = useRef(false);
  const recognitionRef = useRef(null);

  const announceStatus = (message) => {
    setStatusMessage(message);
    narrate(message);
  };

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window) {
      recognitionRef.current = new window.webkitSpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'pt-BR';

      recognitionRef.current.onstart = () => {
        setIsListening(true);
        announceStatus("Ouvindo... Diga o nome do objeto que você procura.");
      };

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setSearchQuery(transcript);
        setIsListening(false);
        announceStatus(`Você disse: ${transcript}. Clique em Iniciar Busca para procurar.`);
        toast.success(`Reconhecido: ${transcript}`);
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        if (event.error === 'no-speech') {
          announceStatus("Não ouvi nada. Tente novamente.");
          toast.error("Nenhuma fala detectada");
        } else {
          announceStatus("Erro ao reconhecer voz. Tente novamente.");
          toast.error("Erro no reconhecimento de voz");
        }
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  // Automatic screen entry narration
  useEffect(() => {
    if (isActive) {
      const entryMessage = "Modo Buscar ativado. Localização de objetos específicos com distância e navegação. Digite o nome do objeto que procura ou use o botão de microfone para comando de voz. Depois clique em Iniciar Busca.";
      setTimeout(() => {
        announceStatus(entryMessage);
      }, 500);
    }
  }, [isActive]);

  // Start camera when component becomes active
  useEffect(() => {
    if (isActive && !hasPermissionRef.current) {
      startWebcam();
      hasPermissionRef.current = true;
      
      // Show voice tutorial on first time
      if (isFirstTime) {
        setTimeout(() => {
          setShowVoiceTutorial(true);
          announceStatus("Tutorial de voz disponível. Use o microfone para dizer o que procura, ou digite no campo de texto. Depois clique em Iniciar Busca. A câmera irá procurar o objeto e fornecer distância e instruções de navegação.");
          setIsFirstTime(false);
        }, 2500);
      }
    }
  }, [isActive, isFirstTime]);

  const startWebcam = async () => {
    try {
      announceStatus("Ativando câmera para busca. Aguarde.");
      
      // Try with ideal constraints first
      let constraints = {
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 }
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
          hasPermissionRef.current = true;
          announceStatus("Câmera pronta. Digite ou fale o que você procura.");
          toast.success("Câmera ativada!");
        }
      } catch (err) {
        // Fallback for desktop without facingMode
        console.log("Trying fallback constraints for desktop...");
        constraints = {
          video: {
            width: { ideal: 1280, min: 640 },
            height: { ideal: 720, min: 480 }
          },
          audio: false
        };
        
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setIsStreaming(true);
          hasPermissionRef.current = true;
          announceStatus("Câmera pronta. Digite ou fale o que você procura.");
          toast.success("Câmera ativada!");
        }
      }
    } catch (error) {
      console.error("Webcam error:", error);
      setIsStreaming(false);
      hasPermissionRef.current = false;
      
      let errorMessage = "Erro ao acessar câmera: ";
      if (error.name === 'NotAllowedError') {
        errorMessage = "PERMISSÃO NEGADA. Clique no ícone de cadeado/câmera na barra de endereço e permita o acesso à câmera.";
      } else if (error.name === 'NotFoundError') {
        errorMessage = "Nenhuma câmera encontrada. Verifique se há uma webcam conectada.";
      } else if (error.name === 'NotReadableError') {
        errorMessage = "Câmera em uso. Feche outros programas (Zoom, Teams, etc) e recarregue.";
      }
      
      announceStatus(errorMessage);
      toast.error(errorMessage, { duration: 6000 });
    }
  };

  const startVoiceSearch = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
        setShowVoiceTutorial(false);
      } catch (error) {
        console.error('Recognition start error:', error);
        // If already running, stop and restart
        if (error.message.includes('already started')) {
          recognitionRef.current.stop();
          setTimeout(() => {
            recognitionRef.current.start();
          }, 100);
        }
      }
    } else {
      toast.error("Reconhecimento de voz não disponível neste navegador.");
      announceStatus("Reconhecimento de voz não disponível. Por favor, digite o nome do objeto.");
    }
  };
  
  const showVoiceHelp = () => {
    setShowVoiceTutorial(true);
    announceStatus("Para usar o microfone: Clique no botão do microfone, aguarde o sinal sonoro, e diga claramente o nome do objeto que procura. Por exemplo: celular, chave, caneta, óculos. Depois clique em Iniciar Busca.");
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
    setSearchAttempts(0);
    setDirectionGuidance("");
    if (!foundObject) {
      announceStatus("Busca interrompida.");
    }
  };
  
  const resetSearch = () => {
    setFoundObject(null);
    setObjectLocation(null);
    setObjectDistance(null);
    setNavigationInstructions("");
    setFullDescription("");
    setSearchQuery("");
    announceStatus("Digite o que você procura.");
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

      // No authentication required (login removed)
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
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data && response.data.description) {
        const description = response.data.description;
        
        // Check if object was found using the new format from backend
        if (description.includes("OBJETO ENCONTRADO")) {
          setFoundObject(searchQuery);
          setFullDescription(description);
          
          // Extract detailed information using keywords
          const lines = description.split('\n');
          
          // Extract position
          const positionLine = lines.find(l => l.includes('POSIÇÃO:') || l.includes('Posição:'));
          if (positionLine) {
            const posMatch = positionLine.match(/POSIÇÃO:\s*(.+)/i);
            if (posMatch) {
              setObjectLocation(posMatch[1].trim());
            }
          }
          
          // Extract distance with meters
          const distanceLine = lines.find(l => l.includes('DISTÂNCIA:') || l.includes('Distância:'));
          if (distanceLine) {
            const distMatch = distanceLine.match(/DISTÂNCIA:\s*(.+)/i);
            if (distMatch) {
              setObjectDistance(distMatch[1].trim());
            }
          }
          
          // Extract navigation instructions
          const navLine = lines.find(l => l.includes('NAVEGAÇÃO:') || l.includes('Navegação:'));
          if (navLine) {
            const navMatch = navLine.match(/NAVEGAÇÃO:\s*(.+)/i);
            if (navMatch) {
              setNavigationInstructions(navMatch[1].trim());
            }
          }
          
          // Stop search and announce with detailed info
          stopSearch();
          
          const locationText = objectLocation || "posição detectada";
          const distanceText = objectDistance || "distância estimada";
          const navText = navigationInstructions || "objeto localizado";
          
          const announcement = `${searchQuery} encontrado! ${locationText}. ${distanceText}. ${navText}`;
          announceStatus(announcement);
          toast.success(`✓ ${searchQuery} encontrado!`, { duration: 5000 });
          
          // Play directional success sound
          if (objectLocation) {
            playDirectionalSound(objectLocation.toLowerCase());
          }
          
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

  const playDirectionalSound = (location) => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    // Create multiple oscillators for richer sound
    const createOscillator = (freq, startTime, duration, panValue = 0) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      const panner = audioContext.createStereoPanner();
      
      oscillator.connect(gainNode);
      gainNode.connect(panner);
      panner.connect(audioContext.destination);
      
      oscillator.frequency.value = freq;
      oscillator.type = 'sine';
      panner.pan.value = panValue; // -1 (left) to 1 (right)
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime + startTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + startTime + duration);
      
      oscillator.start(audioContext.currentTime + startTime);
      oscillator.stop(audioContext.currentTime + startTime + duration);
    };
    
    // Direction-based sound
    let panValue = 0;
    if (location.includes("esquerda")) panValue = -0.8;
    if (location.includes("direita")) panValue = 0.8;
    
    // Success melody with panning
    createOscillator(800, 0, 0.15, panValue);
    createOscillator(1000, 0.15, 0.15, panValue);
    createOscillator(1200, 0.3, 0.3, panValue);
  };

  const playGuidanceBeep = (direction) => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    const panner = audioContext.createStereoPanner();
    
    oscillator.connect(gainNode);
    gainNode.connect(panner);
    panner.connect(audioContext.destination);
    
    // Direction-specific beeps
    const directionMap = {
      'left': { freq: 600, pan: -0.9 },
      'right': { freq: 600, pan: 0.9 },
      'up': { freq: 800, pan: 0 },
      'down': { freq: 400, pan: 0 }
    };
    
    const config = directionMap[direction] || { freq: 500, pan: 0 };
    
    oscillator.frequency.value = config.freq;
    oscillator.type = 'square';
    panner.pan.value = config.pan;
    
    gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.2);
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

        {/* Direction Guidance Indicator */}
        {isSearching && directionGuidance && !foundObject && (
          <div className="absolute bottom-4 left-4 right-4">
            <div className={`p-4 rounded-xl backdrop-blur-xl animate-pulse ${
              settings.highContrast ? 'bg-yellow-500/90 border-2 border-white' : 'bg-amber-500/90 border border-amber-300'
            }`}>
              <p className="text-white text-center font-bold text-lg">
                💡 {directionGuidance}
              </p>
              <p className="text-white text-center text-sm mt-1">
                Tentativa {searchAttempts}
              </p>
            </div>
          </div>
        )}

        {/* Object Found Indicator */}
        {foundObject && objectLocation && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="bg-green-500/90 text-white p-8 rounded-3xl text-center animate-pulse shadow-2xl">
              <Search className="w-20 h-20 mx-auto mb-4" />
              <p className="text-3xl font-bold">{foundObject}</p>
              <p className="text-2xl mt-2">✓ Encontrado!</p>
              <p className="text-xl mt-2">📍 {objectLocation}</p>
              {objectDistance && (
                <p className="text-lg mt-1 opacity-90">↔️ {objectDistance}</p>
              )}
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
        {/* Voice Tutorial Banner */}
        {showVoiceTutorial && (
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 rounded-xl text-white animate-pulse">
            <div className="flex items-start gap-3">
              <Mic className="w-6 h-6 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <p className="font-bold mb-2">Como usar o microfone:</p>
                <ol className="text-sm space-y-1 list-decimal list-inside">
                  <li>Clique no botão do microfone (🎤)</li>
                  <li>Aguarde o sinal sonoro</li>
                  <li>Diga claramente: "celular", "chave", "óculos", etc.</li>
                  <li>Clique em "Iniciar Busca"</li>
                </ol>
              </div>
              <button
                onClick={() => setShowVoiceTutorial(false)}
                className="p-1 hover:bg-white/20 rounded"
                aria-label="Fechar tutorial"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

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
            onClick={showVoiceHelp}
            disabled={isSearching}
            size="lg"
            variant="outline"
            className={settings.highContrast ? 'bg-gray-800 text-white border-white' : 'bg-slate-700 text-white border-blue-500/30'}
            aria-label="Como usar o microfone"
          >
            <Volume2 className="w-5 h-5" />
          </Button>
          <Button
            onClick={startVoiceSearch}
            disabled={isSearching || isListening}
            size="lg"
            className={`${
              isListening 
                ? 'bg-red-600 animate-pulse' 
                : settings.highContrast ? 'bg-white text-black' : 'bg-blue-600'
            }`}
            aria-label={isListening ? "Ouvindo..." : "Busca por voz"}
          >
            <Mic className={`w-6 h-6 ${isListening ? 'text-white' : ''}`} />
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

        {/* Detailed Results - Distance & Navigation */}
        {foundObject && (objectDistance || navigationInstructions) && (
          <div className={`p-6 rounded-2xl ${
            settings.highContrast
              ? 'bg-gray-900 border-2 border-white'
              : 'bg-gradient-to-br from-green-900/50 to-emerald-900/50 backdrop-blur-xl border border-green-500/30'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-lg font-bold ${settings.highContrast ? 'text-white' : 'text-white'} flex items-center gap-2`}>
                <MapPin className="w-6 h-6 text-green-400" />
                Objeto Localizado
              </h3>
              <Button
                onClick={resetSearch}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700"
                aria-label="Nova busca"
              >
                Nova Busca
              </Button>
            </div>

            {/* Object Name */}
            <div className="mb-4 pb-4 border-b border-white/20">
              <p className={`text-2xl font-bold ${settings.highContrast ? 'text-white' : 'text-green-300'}`}>
                ✓ {foundObject}
              </p>
            </div>

            {/* Position */}
            {objectLocation && (
              <div className="mb-4">
                <p className={`text-sm font-semibold mb-1 ${settings.highContrast ? 'text-gray-400' : 'text-green-200'}`}>
                  📍 POSIÇÃO:
                </p>
                <p className={`text-lg ${settings.highContrast ? 'text-white' : 'text-white'}`}>
                  {objectLocation}
                </p>
              </div>
            )}

            {/* Distance */}
            {objectDistance && (
              <div className="mb-4 bg-blue-900/30 p-4 rounded-xl">
                <p className={`text-sm font-semibold mb-1 ${settings.highContrast ? 'text-gray-400' : 'text-blue-200'}`}>
                  📏 DISTÂNCIA ESTIMADA:
                </p>
                <p className={`text-xl font-bold ${settings.highContrast ? 'text-white' : 'text-blue-100'}`}>
                  {objectDistance}
                </p>
              </div>
            )}

            {/* Navigation Instructions */}
            {navigationInstructions && (
              <div className="bg-amber-900/30 p-4 rounded-xl">
                <p className={`text-sm font-semibold mb-2 ${settings.highContrast ? 'text-gray-400' : 'text-amber-200'} flex items-center gap-2`}>
                  🧭 NAVEGAÇÃO:
                </p>
                <p className={`text-base leading-relaxed ${settings.highContrast ? 'text-white' : 'text-amber-50'}`}>
                  {navigationInstructions}
                </p>
                <Button
                  onClick={() => narrate(navigationInstructions)}
                  size="sm"
                  className="mt-3 bg-amber-600 hover:bg-amber-700"
                  aria-label="Repetir instruções"
                >
                  <Volume2 className="w-4 h-4 mr-2" />
                  Repetir Instruções
                </Button>
              </div>
            )}

            {/* Full Description (collapsible) */}
            {fullDescription && (
              <details className="mt-4">
                <summary className={`cursor-pointer text-sm font-semibold ${settings.highContrast ? 'text-gray-400' : 'text-green-200'} hover:text-white`}>
                  Ver Descrição Completa ▼
                </summary>
                <p className={`mt-2 text-xs ${settings.highContrast ? 'text-gray-300' : 'text-white/80'} whitespace-pre-wrap`}>
                  {fullDescription}
                </p>
              </details>
            )}
          </div>
        )}

        {/* Recent Searches */}
        {recentSearches.length > 0 && !isSearching && !foundObject && (
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
            🎯 Instruções Detalhadas:
          </h3>
          <ul className={`text-xs space-y-2 ${settings.highContrast ? 'text-gray-400' : 'text-blue-200'}`}>
            <li className="flex items-start gap-2">
              <span className="font-bold text-amber-400">1.</span>
              <span><strong>Digite ou use voz:</strong> Clique no 🎤 para falar, ou digite no campo (ex: "celular", "chave", "controle remoto")</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-amber-400">2.</span>
              <span><strong>Iniciar busca:</strong> Clique no botão "Iniciar Busca" para começar</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-amber-400">3.</span>
              <span><strong>Movimente a câmera:</strong> Gire lentamente 360° em 3-4 segundos. Se não encontrar, mova para outro cômodo</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-amber-400">4.</span>
              <span><strong>Alerta encontrado:</strong> O sistema narra quando encontra e exibe localização visual</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-amber-400">5.</span>
              <span><strong>Navegação precisa:</strong> Receba posição (grid 7x3), distância em metros e comandos passo a passo</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-amber-400">6.</span>
              <span><strong>Siga instruções:</strong> Ouça: "Vire X graus, caminhe Y metros (Z passos)"</span>
            </li>
          </ul>
          
          <div className="mt-4 p-3 bg-indigo-900/30 rounded-lg">
            <p className="text-xs font-bold text-indigo-300 mb-1">💡 Dicas Avançadas:</p>
            <ul className="text-xs space-y-1 text-indigo-200">
              <li>• Objetos pequenos: Aproxime a câmera (30-50cm)</li>
              <li>• Ambientes escuros: Acenda luzes para melhor detecção</li>
              <li>• Objetos transparentes/reflexivos: Mude o ângulo da luz</li>
              <li>• Busca rápida: Diga objetos comuns (chave, celular, carteira)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchMode;
