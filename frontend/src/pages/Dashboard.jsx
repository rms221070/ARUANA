import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import ModeSelector from "@/components/ModeSelector";
import CameraView from "@/components/CameraView";
import WebcamDetection from "@/components/WebcamDetection";
import UploadDetection from "@/components/UploadDetection";
import DetectionHistory from "@/components/DetectionHistory";
import AlertsManager from "@/components/AlertsManager";
import NutritionAnalysis from "@/components/NutritionAnalysis";
import Settings from "@/components/Settings";
import About from "@/components/About";
import AdminDashboard from "@/components/AdminDashboard";
import IntelligentReports from "@/components/IntelligentReports";
import ScientificCollaboration from "@/components/ScientificCollaboration";
import SystemManual from "@/components/SystemManual";
import TechnicalDocument from "@/components/TechnicalDocumentNew";
import { Camera, Upload, History, Bell, Apple, Settings as SettingsIcon, Info, Shield, BarChart3, Network, LogOut, User } from "lucide-react";
import { useSettings } from "@/context/SettingsContext";
import { useAuth } from "@/context/AuthContext";

const Dashboard = () => {
  const { t } = useTranslation();
  const { narrate, settings } = useSettings();
  const { user, logout, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState("webcam");
  const [isFullscreenMode, setIsFullscreenMode] = useState(false);
  const [selectedMode, setSelectedMode] = useState(null); // Track selected detection mode
  const [showModeSelector, setShowModeSelector] = useState(true); // Show mode selector by default

  useEffect(() => {
    // Detailed welcome message with navigation info
    const welcomeMessage = `${t('app.title')}. ${t('app.subtitle')}. ${t('navigation.welcome')}`;
    narrate(welcomeMessage);
  }, []);

  const handleTabChange = (value) => {
    setActiveTab(value);
    
    // Reset mode selector when changing to webcam tab
    if (value === "webcam") {
      setShowModeSelector(true);
      setSelectedMode(null);
    }
    
    const tabMessage = `${t('navigation.navigatingTo')} ${t(`navigation.${value}`)}. ${t(`navigation.${value}Description`)}`;
    narrate(tabMessage);
  };

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
      data-testid="dashboard-container" 
      className={`min-h-screen ${
        settings.highContrast 
          ? 'bg-black text-white' 
          : 'bg-gradient-to-br from-slate-900 via-blue-950 to-slate-800'
      }`}
    >
      {/* Sophisticated Scientific Header - Hidden in fullscreen mode */}
      {!isFullscreenMode && (
      <div className={`border-b ${
        settings.highContrast ? 'border-white bg-black' : 'border-orange-500/30 bg-gradient-to-r from-blue-950/95 via-slate-900/95 to-blue-950/95 backdrop-blur-xl'
      } sticky top-0 z-50 shadow-2xl`}>
        {/* Mobile: Ultra Compact Header */}
        <div className="md:hidden">
          <div className="container mx-auto px-2 py-1">
            <div className="flex items-center justify-between">
              {/* Minimal branding */}
              <div className="flex items-center gap-1">
                <div className={`p-0.5 rounded ${settings.highContrast ? 'bg-white' : 'bg-orange-500'}`}>
                  <svg className={`w-3 h-3 ${settings.highContrast ? 'text-black' : 'text-white'}`} fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                  </svg>
                </div>
                <span className={`text-[11px] font-bold ${settings.highContrast ? 'text-white' : 'text-white'}`}>
                  ARUANÃ
                </span>
              </div>
              
              {/* User actions - compact */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => window.location.href = '/profile'}
                  className={`p-1 rounded ${settings.highContrast ? 'bg-white/10' : 'bg-white/10'}`}
                >
                  {user?.profile_photo ? (
                    <img src={user.profile_photo} alt={user.name} className="w-4 h-4 rounded-full object-cover" />
                  ) : (
                    <User size={10} className="text-white" />
                  )}
                </button>
                <button
                  onClick={() => logout()}
                  className={`p-1 rounded ${settings.highContrast ? 'bg-white text-black' : 'bg-red-500 text-white'}`}
                >
                  <LogOut size={10} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Desktop: Normal Header */}
        <div className="hidden md:block">
          <div className="container mx-auto px-4 py-0.5">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                {/* User Info and Logout */}
                <div className="flex items-center justify-end gap-1.5 mb-0.5">
                  {/* User Profile Card with Photo */}
                  <button
                    onClick={() => window.location.href = '/profile'}
                    className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md cursor-pointer transition-all duration-300 hover:scale-105 ${
                      settings.highContrast 
                        ? 'bg-white/10 border border-white hover:bg-white/20' 
                        : 'bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20'
                    }`}
                  >
                    {user?.profile_photo ? (
                      <img
                        src={user.profile_photo}
                        alt={user.name}
                        className="w-5 h-5 rounded-full object-cover border border-orange-500"
                      />
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center">
                        <User size={12} className="text-white" />
                      </div>
                    )}
                    <div className="text-left">
                      <span className={`text-[10px] font-medium block ${
                        settings.highContrast ? 'text-white' : 'text-white'
                      }`}>
                        {user?.name}
                      </span>
                      {isAdmin() && (
                        <span className="text-[9px] text-orange-400 font-semibold">
                          Admin
                        </span>
                      )}
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      narrate('Saindo do sistema');
                      logout();
                    }}
                    className={`flex items-center gap-1 px-2 py-0.5 rounded-md transition-all duration-300 transform hover:scale-105 ${
                      settings.highContrast
                        ? 'bg-white text-black hover:bg-gray-200'
                        : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg'
                    }`}
                    onMouseEnter={() => narrate('Botão sair')}
                    style={!settings.highContrast ? {
                      boxShadow: '0 4px 15px -3px rgba(239, 68, 68, 0.4)'
                    } : {}}
                  >
                    <LogOut size={12} />
                    <span className="text-[10px] font-medium">Sair</span>
                  </button>
                </div>
                <div className="flex items-center gap-1.5 mb-0.5">
                  <div className={`p-0.5 rounded-md ${
                    settings.highContrast ? 'bg-white' : 'bg-gradient-to-br from-orange-500 to-orange-600'
                  } shadow-lg animate-pulse-slow`}>
                    <svg className={`w-4 h-4 ${settings.highContrast ? 'text-black' : 'text-white'}`} fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                    </svg>
                  </div>
                  <div>
                    <h1 className={`text-base md:text-lg font-bold ${
                      settings.highContrast 
                        ? 'text-white' 
                        : 'bg-gradient-to-r from-orange-400 via-white to-blue-400 bg-clip-text text-transparent'
                    } mb-0 tracking-tight leading-tight`}>
                      {t('app.title')}
                    </h1>
                    <h2 className={`text-[10px] md:text-xs font-semibold ${
                      settings.highContrast ? 'text-gray-300' : 'text-blue-200'
                    } mb-0 tracking-wide leading-tight`}>
                      Laboratório de Comunicação Celular (LCC)
                    </h2>
                    <div className={`text-[9px] ${
                      settings.highContrast ? 'text-gray-300' : 'text-blue-200/90'
                    } font-medium leading-tight`}>
                      <div>Aluno Pós-Doc: Ricardo Marciano dos Santos</div>
                      <div>Supervisor Pós-Doc: Luiz Anastacio Alves</div>
                    </div>
                  </div>
                </div>
                <div className={`flex items-center gap-1 text-[9px] ${
                  settings.highContrast ? 'text-gray-400' : 'text-indigo-300/80'
                }`}>
                  <div className="w-1 h-1 rounded-full bg-green-400 animate-pulse"></div>
                  <span className="font-light italic">{t('app.description')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      )}

      <div className={`${isFullscreenMode ? 'p-0 m-0 w-full' : 'container mx-auto px-4 py-8 max-w-7xl'}`}>
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full" data-testid="main-tabs">
          <TabsList className={`grid w-full grid-cols-6 mb-8 ${
            settings.highContrast 
              ? 'bg-gray-900 border-2 border-white' 
              : 'bg-gradient-to-r from-blue-950/90 via-slate-900/90 to-blue-950/90 backdrop-blur-md shadow-2xl border border-orange-500/30'
          }`}>
            <TabsTrigger 
              value="webcam" 
              className={`flex items-center gap-2 ${
                settings.highContrast ? '' : 'data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-600 data-[state=active]:to-orange-500 data-[state=active]:text-white'
              }`}
              data-testid="webcam-tab"
              aria-label={t('navigation.webcam')}
            >
              <Camera className="w-5 h-5" />
              <span className="hidden sm:inline">{t('navigation.webcam')}</span>
            </TabsTrigger>
            <TabsTrigger 
              value="upload" 
              className={`flex items-center gap-2 ${
                settings.highContrast ? '' : 'data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-600 data-[state=active]:to-orange-500 data-[state=active]:text-white'
              }`}
              data-testid="upload-tab"
              aria-label={t('navigation.upload')}
            >
              <Upload className="w-5 h-5" />
              <span className="hidden sm:inline">{t('navigation.upload')}</span>
            </TabsTrigger>
            <TabsTrigger 
              value="history" 
              className={`flex items-center gap-2 ${
                settings.highContrast ? '' : 'data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-600 data-[state=active]:to-orange-500 data-[state=active]:text-white'
              }`}
              data-testid="history-tab"
              aria-label={t('navigation.history')}
            >
              <History className="w-5 h-5" />
              <span className="hidden sm:inline">{t('navigation.history')}</span>
            </TabsTrigger>
            <TabsTrigger 
              value="nutrition" 
              className={`flex items-center gap-2 ${
                settings.highContrast ? '' : 'data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-600 data-[state=active]:to-orange-500 data-[state=active]:text-white'
              }`}
              data-testid="nutrition-tab"
              aria-label={t('nutrition.title')}
            >
              <Apple className="w-5 h-5" />
              <span className="hidden sm:inline">Nutrição</span>
            </TabsTrigger>
            <TabsTrigger 
              value="reports" 
              className={`flex items-center gap-2 ${
                settings.highContrast ? '' : 'data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-600 data-[state=active]:to-orange-500 data-[state=active]:text-white'
              }`}
              data-testid="reports-tab"
              aria-label="Relatórios"
            >
              <BarChart3 className="w-5 h-5" />
              <span className="hidden sm:inline">Relatórios</span>
            </TabsTrigger>
            {/* Collaboration moved to About section */}
            <TabsTrigger 
              value="about" 
              className={`flex items-center gap-2 ${
                settings.highContrast ? '' : 'data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-600 data-[state=active]:to-orange-500 data-[state=active]:text-white'
              }`}
              data-testid="about-tab"
              aria-label="Sobre"
            >
              <Info className="w-5 h-5" />
              <span className="hidden sm:inline">Sobre</span>
            </TabsTrigger>
            <TabsTrigger 
              value="settings" 
              className={`flex items-center gap-2 ${
                settings.highContrast ? '' : 'data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-600 data-[state=active]:to-orange-500 data-[state=active]:text-white'
              }`}
              data-testid="settings-tab"
              aria-label={t('navigation.settings')}
            >
              <SettingsIcon className="w-5 h-5" />
              <span className="hidden sm:inline">{t('navigation.settings')}</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="webcam" data-testid="webcam-content">
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
          </TabsContent>

          <TabsContent value="upload" data-testid="upload-content">
            <UploadDetection />
          </TabsContent>

          <TabsContent value="history" data-testid="history-content">
            <DetectionHistory />
          </TabsContent>

          <TabsContent value="nutrition" data-testid="nutrition-content">
            <NutritionAnalysis />
          </TabsContent>

          <TabsContent value="reports" data-testid="reports-content">
            <IntelligentReports />
          </TabsContent>

          {/* Collaboration moved to About section */}

          <TabsContent value="about" data-testid="about-content">
            <div className="space-y-6">
              <About />
              <TechnicalDocument />
              <SystemManual />
              <Card className={`${
                settings.highContrast ? 'bg-gray-900 border-white border-2' : 'bg-gradient-to-br from-indigo-950/90 to-purple-950/90 backdrop-blur-xl border-indigo-700/30'
              }`}>
                <CardHeader>
                  <CardTitle className={`flex items-center gap-2 ${settings.highContrast ? 'text-white' : 'text-cyan-300'}`}>
                    <Bell className="w-6 h-6" />
                    Alertas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <AlertsManager />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="settings" data-testid="settings-content">
            <div className="space-y-6">
              <Settings />
              <Card className={`${
                settings.highContrast ? 'bg-gray-900 border-white border-2' : 'bg-gradient-to-br from-indigo-950/90 to-purple-950/90 backdrop-blur-xl border-indigo-700/30'
              }`}>
                <CardHeader>
                  <CardTitle className={`flex items-center gap-2 ${settings.highContrast ? 'text-white' : 'text-cyan-300'}`}>
                    <Shield className="w-6 h-6" />
                    Dashboard Administrativo
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <AdminDashboard />
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;