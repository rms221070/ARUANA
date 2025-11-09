import { useTranslation } from "react-i18next";
import { Camera, FileText, Eye, Apple, Users, Sparkles, Volume2, History, BarChart3, Info, BookOpen, MoreHorizontal } from "lucide-react";
import { useSettings } from "@/context/SettingsContext";

const ModeSelector = ({ onSelectMode, currentMode, onNavigate, showMoreMenu = false }) => {
  const { t } = useTranslation();
  const { settings, narrate } = useSettings();

  // Main menu modes - only 3 buttons
  const mainModes = [
    {
      id: "reading",
      icon: BookOpen,
      title: "Leitura",
      description: "Leitura em tempo real",
      color: "from-blue-500 to-blue-700",
      shadow: "shadow-[0_10px_30px_rgba(59,130,246,0.5)]"
    },
    {
      id: "description",
      icon: Eye,
      title: "Descrição",
      description: "Descrição contínua do ambiente",
      color: "from-green-500 to-green-700",
      shadow: "shadow-[0_10px_30px_rgba(34,197,94,0.5)]"
    },
    {
      id: "more",
      icon: MoreHorizontal,
      title: "MAIS",
      description: "Mais opções e funcionalidades",
      color: "from-purple-500 to-purple-700",
      shadow: "shadow-[0_10px_30px_rgba(168,85,247,0.5)]",
      isNavigation: true
    }
  ];

  // Submenu modes - shown when in "more" menu
  const subModes = [
    {
      id: "scene",
      icon: Eye,
      title: "Cena",
      description: "Descrição detalhada do ambiente",
      color: "from-green-500 to-green-700",
      shadow: "shadow-[0_10px_30px_rgba(34,197,94,0.5)]"
    },
    {
      id: "general",
      icon: Sparkles,
      title: "Geral",
      description: "Detecção completa",
      color: "from-indigo-500 to-indigo-700",
      shadow: "shadow-[0_10px_30px_rgba(99,102,241,0.5)]"
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
      id: "text-short",
      icon: FileText,
      title: "Texto Curto",
      description: "Leitura instantânea de texto",
      color: "from-blue-500 to-blue-700",
      shadow: "shadow-[0_10px_30px_rgba(59,130,246,0.5)]"
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
      id: "selfie",
      icon: Camera,
      title: "Selfie",
      description: "Câmera frontal",
      color: "from-cyan-500 to-cyan-700",
      shadow: "shadow-[0_10px_30px_rgba(6,182,212,0.5)]"
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
      id: "currency",
      icon: Camera,
      title: "Moedas",
      description: "Identificação de dinheiro",
      color: "from-yellow-500 to-yellow-700",
      shadow: "shadow-[0_10px_30px_rgba(234,179,8,0.5)]"
    }
  ];

  const modes = showMoreMenu ? subModes : mainModes;

  const handleModeSelect = (mode) => {
    // Check if it's a navigation button (like MAIS)
    if (mode.isNavigation) {
      const message = `${mode.title} selecionado. ${mode.description}`;
      narrate(message);
      if (onNavigate) onNavigate(mode.id);
      return;
    }
    
    const message = `Modo selecionado: ${mode.title}. ${mode.description}. Câmera será ativada automaticamente.`;
    narrate(message);
    onSelectMode(mode.id);
  };

  const handleNavigation = (nav) => {
    const navTitles = {
      history: "Histórico de Detecções",
      reports: "Relatórios Inteligentes",
      about: "Sobre o Sistema"
    };
    const message = `Navegando para ${navTitles[nav]}`;
    narrate(message);
    if (onNavigate) onNavigate(nav);
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
              onFocus={() => narrate(`${mode.title}. ${mode.description}. Pressione Enter para selecionar.`)}
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
              aria-label={`Modo ${mode.title}. ${mode.description}. Botão`}
              role="button"
              tabIndex={0}
              aria-pressed={isActive}
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
        }`}
        role="heading"
        aria-level="2">
          <Volume2 className="w-5 h-5" aria-hidden="true" />
          Como usar
        </h3>
        <ul className={`space-y-2 text-sm ${
          settings.highContrast ? 'text-gray-400' : 'text-blue-200'
        }`}
        role="list">
          <li role="listitem">• Toque em um modo para iniciar a detecção</li>
          <li role="listitem">• A câmera será ativada automaticamente</li>
          <li role="listitem">• Posicione o objeto na frente da câmera</li>
          <li role="listitem">• Ouça a descrição narrada em português</li>
          <li role="listitem">• Use o botão Voltar para retornar aos modos</li>
        </ul>
      </div>

      {/* Navigation Buttons */}
      <div className="max-w-4xl mx-auto mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={() => handleNavigation('history')}
          onFocus={() => narrate('Histórico de Detecções. Acesse suas análises anteriores.')}
          className={`p-6 rounded-2xl transition-all duration-300 transform hover:scale-105 active:scale-95 ${
            settings.highContrast
              ? 'bg-gray-800 text-white border-2 border-white hover:bg-gray-700'
              : 'bg-gradient-to-br from-cyan-600 to-cyan-800 text-white shadow-[0_10px_30px_rgba(8,145,178,0.5)] hover:shadow-2xl'
          }`}
          aria-label="Histórico de Detecções. Acesse suas análises anteriores"
          role="button"
          tabIndex={0}
        >
          <div className="flex flex-col items-center gap-3">
            <History className="w-12 h-12" aria-hidden="true" />
            <span className="text-lg font-bold">Histórico</span>
            <span className="text-sm opacity-90">Suas detecções</span>
          </div>
        </button>

        <button
          onClick={() => handleNavigation('reports')}
          onFocus={() => narrate('Relatórios Inteligentes. Visualize análises e estatísticas.')}
          className={`p-6 rounded-2xl transition-all duration-300 transform hover:scale-105 active:scale-95 ${
            settings.highContrast
              ? 'bg-gray-800 text-white border-2 border-white hover:bg-gray-700'
              : 'bg-gradient-to-br from-emerald-600 to-emerald-800 text-white shadow-[0_10px_30px_rgba(5,150,105,0.5)] hover:shadow-2xl'
          }`}
          aria-label="Relatórios Inteligentes. Visualize análises e estatísticas"
          role="button"
          tabIndex={0}
        >
          <div className="flex flex-col items-center gap-3">
            <BarChart3 className="w-12 h-12" aria-hidden="true" />
            <span className="text-lg font-bold">Relatórios</span>
            <span className="text-sm opacity-90">Análises e estatísticas</span>
          </div>
        </button>

        <button
          onClick={() => handleNavigation('about')}
          onFocus={() => narrate('Sobre o Sistema. Informações sobre o ARUANÃ e equipe.')}
          className={`p-6 rounded-2xl transition-all duration-300 transform hover:scale-105 active:scale-95 ${
            settings.highContrast
              ? 'bg-gray-800 text-white border-2 border-white hover:bg-gray-700'
              : 'bg-gradient-to-br from-violet-600 to-violet-800 text-white shadow-[0_10px_30px_rgba(124,58,237,0.5)] hover:shadow-2xl'
          }`}
          aria-label="Sobre o Sistema. Informações sobre o ARUANÃ e equipe"
          role="button"
          tabIndex={0}
        >
          <div className="flex flex-col items-center gap-3">
            <Info className="w-12 h-12" aria-hidden="true" />
            <span className="text-lg font-bold">Sobre</span>
            <span className="text-sm opacity-90">Informações do sistema</span>
          </div>
        </button>
      </div>
    </div>
  );
};

export default ModeSelector;
