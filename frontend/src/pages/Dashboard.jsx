import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import ModeSelector from "@/components/ModeSelector";
import CameraView from "@/components/CameraView";
import { useSettings } from "@/context/SettingsContext";
import { useAuth } from "@/context/AuthContext";

const Dashboard = () => {
  const { t } = useTranslation();
  const { narrate, settings } = useSettings();
  const { user, logout } = useAuth();
  const [selectedMode, setSelectedMode] = useState(null);
  const [showModeSelector, setShowModeSelector] = useState(true);

  useEffect(() => {
    const welcomeMessage = `${t('app.title')}. ${t('app.subtitle')}. Bem-vindo ${user?.name || 'usuário'}`;
    narrate(welcomeMessage);
  }, []);

  const handleModeSelect = (mode) => {
    setSelectedMode(mode);
    setShowModeSelector(false);
  };

  const handleBackToModeSelector = () => {
    setShowModeSelector(true);
    setSelectedMode(null);
  };

  return (
    <div 
      className={`min-h-screen ${
        settings.highContrast 
          ? 'bg-black text-white' 
          : 'bg-gradient-to-br from-slate-900 via-blue-950 to-slate-800'
      }`}
    >
      {showModeSelector ? (
        <ModeSelector 
          onSelectMode={handleModeSelect}
          currentMode={selectedMode}
        />
      ) : (
        <CameraView 
          mode={selectedMode}
          onBack={handleBackToModeSelector}
        />
      )}
    </div>
  );
};

export default Dashboard;