import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import ModeSelector from "@/components/ModeSelector";
import CameraView from "@/components/CameraView";
import SearchMode from "@/components/SearchMode";
import BrailleReader from "@/components/BrailleReader";
import MathPhysicsReader from "@/components/MathPhysicsReader";
import PersonalAssistant from "@/components/PersonalAssistant";
import DetectionHistory from "@/components/DetectionHistory";
import IntelligentReports from "@/components/IntelligentReports";
import About from "@/components/About";
import { useSettings } from "@/context/SettingsContext";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const Dashboard = () => {
  const { t } = useTranslation();
  const { narrate, settings } = useSettings();
  const { user } = useAuth();
  const [selectedMode, setSelectedMode] = useState(null);
  const [showModeSelector, setShowModeSelector] = useState(true);
  const [currentView, setCurrentView] = useState('modes'); // 'modes', 'camera', 'search', 'braille', 'mathphysics', 'assistant', 'history', 'reports', 'about', 'more'

  useEffect(() => {
    const welcomeMessage = `Bem-vindo ao ARUANÃ, Sistema de Visão Assistiva. Olá ${user?.name || 'usuário'}. Selecione Descrição para análise completa, Buscar para localizar objetos específicos, Ajuda para assistência pessoal, ou MAIS para funcionalidades adicionais.`;
    narrate(welcomeMessage);
  }, []);

  const handleModeSelect = (mode) => {
    const modeNames = {
      'search': 'Modo Buscar - Localizar objetos específicos',
      'braille': 'Leitor de Braille - Grade 1 e 2',
      'mathphysics': 'Leitor de Matemática e Física',
      'assistant': 'Ajuda - Assistente pessoal',
      'description': 'Modo Descrição - Análise completa do ambiente',
      'general': 'Modo Geral - Análise de objetos',
      'colors': 'Identificação de Cores',
      'document': 'Captura de Documento',
      'food': 'Análise de Alimentos',
      'selfie': 'Modo Selfie',
      'people': 'Detecção de Pessoas',
      'currency': 'Identificação de Moedas'
    };
    
    if (mode === 'search') {
      narrate(modeNames[mode] + '. Câmera será ativada. Use comandos de voz para buscar objetos.');
      setCurrentView('search');
      setShowModeSelector(false);
    } else if (mode === 'braille') {
      narrate(modeNames[mode] + '. Câmera será ativada em alta resolução. Centralize o texto Braille.');
      setCurrentView('braille');
      setShowModeSelector(false);
    } else if (mode === 'mathphysics') {
      narrate(modeNames[mode] + '. Câmera será ativada. Aponte para fórmulas matemáticas ou físicas.');
      setCurrentView('mathphysics');
      setShowModeSelector(false);
    } else if (mode === 'assistant') {
      narrate(modeNames[mode] + '. Interface de chat carregada. Comece a conversar sobre seus desafios.');
      setCurrentView('assistant');
      setShowModeSelector(false);
    } else {
      const modeName = modeNames[mode] || 'Modo de câmera';
      narrate(modeName + '. Câmera será ativada automaticamente.');
      setSelectedMode(mode);
      setShowModeSelector(false);
      setCurrentView('camera');
    }
  };

  const handleBackToModeSelector = () => {
    setShowModeSelector(true);
    setSelectedMode(null);
    setCurrentView('modes');
    narrate("Voltando ao menu principal. Use as setas do teclado para navegar entre os modos.");
  };

  const handleNavigation = (nav) => {
    const navMessages = {
      'more': 'Submenu MAIS aberto. 9 funcionalidades adicionais disponíveis.',
      'history': 'Histórico de Detecções. Acesse suas análises anteriores.',
      'reports': 'Relatórios Inteligentes. Visualize estatísticas e análises.',
      'about': 'Sobre o Sistema. Informações sobre o ARUANÃ e equipe.'
    };
    
    narrate(navMessages[nav] || 'Navegando...');
    
    if (nav === 'more') {
      setCurrentView('more');
      setShowModeSelector(false);
    } else {
      setCurrentView(nav);
      setShowModeSelector(false);
    }
  };

  return (
    <div 
      className={`min-h-screen ${
        settings.highContrast 
          ? 'bg-black text-white' 
          : 'bg-gradient-to-br from-slate-900 via-blue-950 to-slate-800'
      }`}
      role="main"
      aria-label="Aplicação ARUANÃ - Visão Assistiva"
    >
      {/* Mode Selector - always rendered but hidden when not active */}
      <div className={currentView === 'modes' ? 'block' : 'hidden'}>
        <ModeSelector 
          onSelectMode={handleModeSelect}
          currentMode={selectedMode}
          onNavigate={handleNavigation}
        />
      </div>

      {/* Camera View - always rendered but hidden when not active */}
      <div className={currentView === 'camera' ? 'block' : 'hidden'}>
        {selectedMode && (
          <CameraView 
            mode={selectedMode}
            onBack={handleBackToModeSelector}
            isActive={currentView === 'camera'}
          />
        )}
      </div>

      {/* Search Mode - always rendered but hidden when not active */}
      <div className={currentView === 'search' ? 'block' : 'hidden'}>
        <SearchMode 
          onBack={handleBackToModeSelector}
          isActive={currentView === 'search'}
        />
      </div>

      {/* Braille Reader - always rendered but hidden when not active */}
      <div className={currentView === 'braille' ? 'block' : 'hidden'}>
        <BrailleReader 
          onBack={handleBackToModeSelector}
          isActive={currentView === 'braille'}
        />
      </div>

      {/* Math & Physics Reader - always rendered but hidden when not active */}
      <div className={currentView === 'mathphysics' ? 'block' : 'hidden'}>
        <MathPhysicsReader 
          onBack={handleBackToModeSelector}
          isActive={currentView === 'mathphysics'}
        />
      </div>

      {/* Personal Assistant - always rendered but hidden when not active */}
      <div className={currentView === 'assistant' ? 'block' : 'hidden'}>
        <PersonalAssistant 
          onBack={handleBackToModeSelector}
          isActive={currentView === 'assistant'}
        />
      </div>

      {/* Other Views */}
      {currentView !== 'modes' && currentView !== 'camera' && currentView !== 'search' && currentView !== 'braille' && currentView !== 'mathphysics' && currentView !== 'assistant' && (
        <div className="min-h-screen p-6">
          {/* Back Button */}
          <div className="max-w-7xl mx-auto mb-6">
            <Button
              onClick={handleBackToModeSelector}
              size="lg"
              className={`${
                settings.highContrast
                  ? 'bg-white text-black hover:bg-gray-200'
                  : 'bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white'
              }`}
              aria-label="Voltar ao menu principal"
            >
              <ArrowLeft className="w-6 h-6 mr-2" aria-hidden="true" />
              Voltar
            </Button>
          </div>

          {/* Content */}
          <div className="max-w-7xl mx-auto">
            {currentView === 'history' && <DetectionHistory />}
            {currentView === 'reports' && <IntelligentReports />}
            {currentView === 'about' && <About />}
            {currentView === 'more' && (
              <ModeSelector 
                onSelectMode={handleModeSelect}
                currentMode={selectedMode}
                onNavigate={handleNavigation}
                showMoreMenu={true}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;