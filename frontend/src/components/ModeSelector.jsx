import { useTranslation } from "react-i18next";
import { Camera, FileText, Eye, Apple, Users, Sparkles, Volume2, History, BarChart3, Info } from "lucide-react";
import { useSettings } from "@/context/SettingsContext";

const ModeSelector = ({ onSelectMode, currentMode, onNavigate }) => {
  const { t } = useTranslation();
  const { settings, narrate } = useSettings();

  const modes = [
    {
      id: "text-short",
      icon: FileText,
      title: "Texto Curto",
      description: "Leitura instantânea de texto",
      color: "from-blue-500 to-blue-700",
      shadow: "shadow-[0_10px_30px_rgba(59,130,246,0.5)]"
    },
    {
      id: "document",
      icon: Camera,
      title: "Documento",
      description: "Captura de página completa",
      color: "from-purple-500 to-purple-700",
      shadow: "shadow-[0_10px_30px_rgba(168,85,247,0.5)]"
    },
    {
      id: "scene",
      icon: Eye,
      title: "Cena",
      description: "Descrição detalhada do ambiente",
      color: "from-green-500 to-green-700",
      shadow: "shadow-[0_10px_30px_rgba(34,197,94,0.5)]"
    },
    {
      id: "food",
      icon: Apple,
      title: "Alimentos",
      description: "Análise nutricional",
      color: "from-orange-500 to-orange-700",
      shadow: "shadow-[0_10px_30px_rgba(249,115,22,0.5)]"
    },
    {
      id: "people",
      icon: Users,
      title: "Pessoas",
      description: "Detecção e emoções",
      color: "from-pink-500 to-pink-700",
      shadow: "shadow-[0_10px_30px_rgba(236,72,153,0.5)]"
    },
    {
      id: "selfie",
      icon: Camera,
      title: "Selfie",
      description: "Câmera frontal",
      color: "from-cyan-500 to-cyan-700",
      shadow: "shadow-[0_10px_30px_rgba(6,182,212,0.5)]"
    },
    {
      id: "general",
      icon: Sparkles,
      title: "Geral",
      description: "Detecção completa",
      color: "from-indigo-500 to-indigo-700",
      shadow: "shadow-[0_10px_30px_rgba(99,102,241,0.5)]"
    }
  ];

  const handleModeSelect = (mode) => {
    const message = `Modo selecionado: ${mode.title}. ${mode.description}`;
    narrate(message);
    onSelectMode(mode.id);
  };

  return (
    <div className={`min-h-screen ${
      settings.highContrast 
        ? 'bg-black' 
        : 'bg-gradient-to-br from-slate-900 via-blue-950 to-slate-800'
    } p-6`}>
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <div className={`p-4 rounded-2xl ${settings.highContrast ? 'bg-white' : 'bg-orange-500'}`}>
            <svg className={`w-12 h-12 ${settings.highContrast ? 'text-black' : 'text-white'}`} fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
            </svg>
          </div>
        </div>
        <h1 className={`text-4xl font-bold mb-2 ${settings.highContrast ? 'text-white' : 'text-white'}`}>
          ARUANÃ
        </h1>
        <p className={`text-lg ${settings.highContrast ? 'text-gray-400' : 'text-blue-200'}`}>
          Visão Assistiva
        </p>
        <p className={`mt-4 text-sm ${settings.highContrast ? 'text-gray-500' : 'text-blue-300/80'}`}>
          Selecione o modo de detecção
        </p>
      </div>

      {/* Mode Cards */}
      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {modes.map((mode) => {
          const Icon = mode.icon;
          const isActive = currentMode === mode.id;
          
          return (
            <button
              key={mode.id}
              onClick={() => handleModeSelect(mode)}
              onFocus={() => narrate(`${mode.title}. ${mode.description}`)}
              className={`group relative p-8 rounded-3xl transition-all duration-300 transform hover:scale-110 hover:-translate-y-2 active:scale-95 ${
                settings.highContrast
                  ? isActive
                    ? 'bg-white text-black border-4 border-white'
                    : 'bg-gray-900 text-white border-2 border-white hover:bg-gray-800'
                  : isActive
                    ? `bg-gradient-to-br ${mode.color} text-white ${mode.shadow} ring-4 ring-white/50`
                    : `bg-gradient-to-br ${mode.color} text-white ${mode.shadow} hover:shadow-2xl backdrop-blur-xl`
              } cursor-pointer`}
              style={!settings.highContrast ? {
                boxShadow: isActive 
                  ? '0 25px 50px -12px rgba(0, 0, 0, 0.5), inset 0 2px 4px rgba(255, 255, 255, 0.3)'
                  : '0 20px 40px -12px rgba(0, 0, 0, 0.4), inset 0 2px 4px rgba(255, 255, 255, 0.2)',
                transform: isActive ? 'translateY(-4px)' : 'translateY(0)'
              } : {}}
              aria-label={`${mode.title}: ${mode.description}`}
            >
              {/* Icon */}
              <div className="flex justify-center mb-4">
                <div className={`p-4 rounded-2xl ${
                  settings.highContrast
                    ? isActive ? 'bg-black' : 'bg-white'
                    : isActive ? 'bg-white/20' : 'bg-orange-500/20'
                }`}>
                  <Icon className={`w-12 h-12 ${
                    settings.highContrast
                      ? isActive ? 'text-white' : 'text-black'
                      : 'text-white'
                  }`} />
                </div>
              </div>

              {/* Title */}
              <h3 className="text-2xl font-bold mb-2 text-center">
                {mode.title}
              </h3>

              {/* Description */}
              <p className={`text-sm text-center ${
                settings.highContrast
                  ? isActive ? 'text-gray-800' : 'text-gray-400'
                  : isActive ? 'text-white/90' : 'text-blue-200/80'
              }`}>
                {mode.description}
              </p>

              {/* Active Indicator */}
              {isActive && (
                <div className="absolute top-3 right-3">
                  <div className={`w-4 h-4 rounded-full ${
                    settings.highContrast ? 'bg-black' : 'bg-white'
                  } animate-pulse`}></div>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Instructions */}
      <div className={`max-w-2xl mx-auto mt-12 p-6 rounded-2xl ${
        settings.highContrast
          ? 'bg-gray-900 border-2 border-white'
          : 'bg-blue-900/30 backdrop-blur-xl border border-blue-500/30'
      }`}>
        <h3 className={`text-lg font-bold mb-3 flex items-center gap-2 ${
          settings.highContrast ? 'text-white' : 'text-white'
        }`}>
          <Volume2 className="w-5 h-5" />
          Como usar
        </h3>
        <ul className={`space-y-2 text-sm ${
          settings.highContrast ? 'text-gray-400' : 'text-blue-200'
        }`}>
          <li>• Toque em um modo para iniciar a câmera</li>
          <li>• A câmera será ativada automaticamente</li>
          <li>• Posicione o objeto na frente da câmera</li>
          <li>• Ouça a descrição narrada em tempo real</li>
          <li>• Use os gestos de navegação para voltar</li>
        </ul>
      </div>
    </div>
  );
};

export default ModeSelector;
