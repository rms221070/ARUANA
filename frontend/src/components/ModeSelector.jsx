import { useTranslation } from "react-i18next";
import { Camera, FileText, Eye, Apple, Users, Sparkles, Volume2, History, BarChart3, Info, BookOpen, MoreHorizontal, Globe, Palette, Search, Grid3x3, Calculator, Heart } from "lucide-react";
import { useSettings } from "@/context/SettingsContext";
import { useState } from "react";

const ModeSelector = ({ onSelectMode, currentMode, onNavigate, showMoreMenu = false }) => {
  const { t, i18n } = useTranslation();
  const { settings, narrate } = useSettings();
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);

  // Main menu modes - 4 buttons now
  const mainModes = [
    {
      id: "description",
      icon: Eye,
      title: "Descrição",
      description: "Descrição completa do ambiente",
      color: "from-green-500 to-green-700",
      shadow: "shadow-[0_10px_30px_rgba(34,197,94,0.5)]"
    },
    {
      id: "search",
      icon: Search,
      title: "Buscar",
      description: "Localizar objetos específicos",
      color: "from-amber-500 to-amber-700",
      shadow: "shadow-[0_10px_30px_rgba(245,158,11,0.5)]"
    },
    {
      id: "assistant",
      icon: Heart,
      title: "Ajuda",
      description: "Converse sobre seus desafios",
      color: "from-pink-500 to-rose-700",
      shadow: "shadow-[0_10px_30px_rgba(236,72,153,0.5)]"
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
      id: "general",
      icon: Sparkles,
      title: "Geral",
      description: "Análise completa de ambiente e objetos",
      color: "from-indigo-500 to-indigo-700",
      shadow: "shadow-[0_10px_30px_rgba(99,102,241,0.5)]"
    },
    {
      id: "colors",
      icon: Palette,
      title: "Cores",
      description: "Identificação de cores",
      color: "from-rose-500 to-rose-700",
      shadow: "shadow-[0_10px_30px_rgba(244,63,94,0.5)]"
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
    },
    {
      id: "braille",
      icon: Grid3x3,
      title: "Braille",
      description: "Leitor de Braille Grade 1 e 2",
      color: "from-teal-500 to-teal-700",
      shadow: "shadow-[0_10px_30px_rgba(20,184,166,0.5)]"
    },
    {
      id: "mathphysics",
      icon: Calculator,
      title: "Mat & Física",
      description: "Leitura de fórmulas e equações",
      color: "from-purple-500 to-indigo-700",
      shadow: "shadow-[0_10px_30px_rgba(168,85,247,0.5)]"
    }
  ];

  const modes = showMoreMenu ? subModes : mainModes;

  // Available languages
  const languages = [
    { code: 'pt', name: 'Português', flag: '🇧🇷' },
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'zh', name: '中文', flag: '🇨🇳' }
  ];

  const getCurrentLanguage = () => {
    const currentLang = i18n.language || 'pt';
    return languages.find(lang => lang.code === currentLang) || languages[0];
  };

  const handleLanguageChange = (langCode) => {
    i18n.changeLanguage(langCode);
    const lang = languages.find(l => l.code === langCode);
    narrate(`Idioma alterado para ${lang.name}`);
    setShowLanguageMenu(false);
  };

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
        <div className="flex justify-center items-center gap-4 mb-4">
          <div className={`p-4 rounded-2xl ${settings.highContrast ? 'bg-white' : 'bg-orange-500'}`}>
            <svg className={`w-12 h-12 ${settings.highContrast ? 'text-black' : 'text-white'}`} fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
            </svg>
          </div>
          
          {/* Language Button - Only show in main menu */}
          {!showMoreMenu && (
            <button
              onClick={() => {
                setShowLanguageMenu(!showLanguageMenu);
                narrate(`Seletor de idioma. Idioma atual: ${getCurrentLanguage().name}`);
              }}
              className={`p-3 rounded-xl flex items-center gap-2 transition-all ${
                settings.highContrast
                  ? 'bg-white text-black border-2 border-black hover:bg-gray-200'
                  : 'bg-blue-900/50 text-white hover:bg-blue-800/60 backdrop-blur-xl border border-blue-500/30'
              }`}
              aria-label={`Idioma atual: ${getCurrentLanguage().name}. Clique para alterar`}
            >
              <Globe className="w-6 h-6" aria-hidden="true" />
              <span className="text-lg font-bold">{getCurrentLanguage().flag} {getCurrentLanguage().name}</span>
            </button>
          )}
        </div>
        
        <h1 className={`text-4xl font-bold mb-2 ${settings.highContrast ? 'text-white' : 'text-white'}`}>
          ARUANÃ
        </h1>
        <p className={`text-lg ${settings.highContrast ? 'text-gray-400' : 'text-blue-200'}`}>
          Visão Assistiva
        </p>
        <p className={`mt-4 text-sm ${settings.highContrast ? 'text-gray-500' : 'text-blue-300/80'}`}>
          {showMoreMenu ? 'Selecione um modo ou funcionalidade' : 'Selecione uma função principal'}
        </p>
      </div>

      {/* Language Selection Menu */}
      {showLanguageMenu && !showMoreMenu && (
        <div className="max-w-2xl mx-auto mb-8">
          <div className={`p-6 rounded-2xl ${
            settings.highContrast
              ? 'bg-gray-900 border-2 border-white'
              : 'bg-blue-900/80 backdrop-blur-xl border border-blue-500/30'
          }`}>
            <h3 className={`text-xl font-bold mb-4 ${settings.highContrast ? 'text-white' : 'text-white'}`}>
              Selecione o Idioma
            </h3>
            <div className="grid grid-cols-1 gap-3">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => handleLanguageChange(lang.code)}
                  onFocus={() => narrate(`${lang.name}`)}
                  className={`p-4 rounded-xl text-left transition-all ${
                    i18n.language === lang.code
                      ? settings.highContrast
                        ? 'bg-white text-black border-2 border-white'
                        : 'bg-orange-500 text-white'
                      : settings.highContrast
                        ? 'bg-gray-800 text-white border border-white hover:bg-gray-700'
                        : 'bg-blue-800/50 text-white hover:bg-blue-700/60'
                  }`}
                  aria-label={`Selecionar idioma ${lang.name}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{lang.flag}</span>
                    <span className="text-lg font-bold">{lang.name}</span>
                    {i18n.language === lang.code && (
                      <span className="ml-auto text-sm">(Atual)</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

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
          {!showMoreMenu ? (
            <>
              <li role="listitem">• <strong>Leitura</strong>: Ativa câmera e lê texto em tempo real</li>
              <li role="listitem">• <strong>Descrição</strong>: Ativa câmera e descreve ambiente continuamente</li>
              <li role="listitem">• <strong>MAIS</strong>: Acessa mais modos de detecção e configurações</li>
            </>
          ) : (
            <>
              <li role="listitem">• Toque em um modo para iniciar a detecção</li>
              <li role="listitem">• A câmera será ativada automaticamente</li>
              <li role="listitem">• Posicione o objeto na frente da câmera</li>
              <li role="listitem">• Ouça a descrição narrada em português</li>
              <li role="listitem">• Use o botão Voltar para retornar</li>
            </>
          )}
        </ul>
      </div>

      {/* Navigation Buttons - Only show in MORE submenu */}
      {showMoreMenu && (
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
      )}
    </div>
  );
};

export default ModeSelector;
