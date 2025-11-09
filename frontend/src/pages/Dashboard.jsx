import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import ModeSelector from "@/components/ModeSelector";
import CameraView from "@/components/CameraView";
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
  const [currentView, setCurrentView] = useState('modes'); // 'modes', 'camera', 'history', 'reports', 'about', 'more'

  useEffect(() => {
    const welcomeMessage = `Bem-vindo ao ARUANÃ, Sistema de Visão Assistiva. Olá ${user?.name || 'usuário'}. Selecione Leitura para leitura em tempo real, Descrição para descrição contínua, ou MAIS para outras opções.`;
    narrate(welcomeMessage);
  }, []);

  const handleModeSelect = (mode) => {
    setSelectedMode(mode);
    setShowModeSelector(false);
    setCurrentView('camera');
  };

  const handleBackToModeSelector = () => {
    setShowModeSelector(true);
    setSelectedMode(null);
    setCurrentView('modes');
    narrate("Voltando ao menu principal");
  };

  const handleNavigation = (nav) => {
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

      {/* Other Views */}
      {currentView !== 'modes' && currentView !== 'camera' && (
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
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;