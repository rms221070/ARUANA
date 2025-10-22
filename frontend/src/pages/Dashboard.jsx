import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
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
import { Camera, Upload, History, Bell, Apple, Settings as SettingsIcon, Info, Shield, BarChart3, Network } from "lucide-react";
import { useSettings } from "@/context/SettingsContext";

const Dashboard = () => {
  const { t } = useTranslation();
  const { narrate, settings } = useSettings();
  const [activeTab, setActiveTab] = useState("webcam");

  useEffect(() => {
    // Detailed welcome message with navigation info
    const welcomeMessage = `${t('app.title')}. ${t('app.subtitle')}. ${t('navigation.welcome')}`;
    narrate(welcomeMessage);
  }, []);

  const handleTabChange = (value) => {
    setActiveTab(value);
    const tabMessage = `${t('navigation.navigatingTo')} ${t(`navigation.${value}`)}. ${t(`navigation.${value}Description`)}`;
    narrate(tabMessage);
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
      {/* Sophisticated Scientific Header */}
      <div className={`border-b ${
        settings.highContrast ? 'border-white bg-black' : 'border-orange-500/30 bg-gradient-to-r from-blue-950/95 via-slate-900/95 to-blue-950/95 backdrop-blur-xl'
      } sticky top-0 z-50 shadow-2xl`}>
        <div className="container mx-auto px-4 py-4">
          {/* Banner Image - Removed to improve visibility */}
          
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className={`p-2 rounded-xl ${
                  settings.highContrast ? 'bg-white' : 'bg-gradient-to-br from-orange-500 to-orange-600'
                } shadow-2xl animate-pulse-slow`}>
                  <svg className={`w-8 h-8 ${settings.highContrast ? 'text-black' : 'text-white'}`} fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                  </svg>
                </div>
                <div>
                  <h1 className={`text-3xl md:text-4xl font-bold ${
                    settings.highContrast 
                      ? 'text-white' 
                      : 'bg-gradient-to-r from-orange-400 via-white to-blue-400 bg-clip-text text-transparent'
                  } mb-1 tracking-tight`}>
                    {t('app.title')}
                  </h1>
                  <h2 className={`text-lg md:text-xl font-semibold ${
                    settings.highContrast ? 'text-gray-300' : 'text-blue-200'
                  } mb-2 tracking-wide`}>
                    Laboratório de Comunicação Celular (LCC)
                  </h2>
                  <div className={`text-xs md:text-sm mt-3 space-y-1 ${
                    settings.highContrast ? 'text-gray-300' : 'text-blue-200/90'
                  } font-medium`}>
                    <div>Aluno Pós-Doc: Ricardo Marciano dos Santos</div>
                    <div>Supervisor Pós-Doc: Luiz Anastacio Alves</div>
                  </div>
                  <p className={`text-sm md:text-base mt-3 ${
                    settings.highContrast ? 'text-gray-400' : 'text-orange-300/90'
                  } font-light italic tracking-wide`}>
                    "ARUANÃ": INTELIGÊNCIA ARTIFICIAL E VISÃO COMPUTACIONAL NA CONSTRUÇÃO DE EXPERIÊNCIAS INTERATIVAS
                  </p>
                </div>
              </div>
              <div className={`flex items-center gap-2 text-xs ${
                settings.highContrast ? 'text-gray-400' : 'text-indigo-300/80'
              }`}>
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                <span className="font-light italic">{t('app.description')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full" data-testid="main-tabs">
          <TabsList className={`grid w-full grid-cols-8 mb-8 ${
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
              value="alerts" 
              className={`flex items-center gap-2 ${
                settings.highContrast ? '' : 'data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-600 data-[state=active]:to-orange-500 data-[state=active]:text-white'
              }`}
              data-testid="alerts-tab"
              aria-label={t('navigation.alerts')}
            >
              <Bell className="w-5 h-5" />
              <span className="hidden sm:inline">{t('navigation.alerts')}</span>
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
            <TabsTrigger 
              value="collaboration" 
              className={`flex items-center gap-2 ${
                settings.highContrast ? '' : 'data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-600 data-[state=active]:to-orange-500 data-[state=active]:text-white'
              }`}
              data-testid="collaboration-tab"
              aria-label="Colaboração"
            >
              <Network className="w-5 h-5" />
              <span className="hidden sm:inline">Colaboração</span>
            </TabsTrigger>
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
            <WebcamDetection />
          </TabsContent>

          <TabsContent value="upload" data-testid="upload-content">
            <UploadDetection />
          </TabsContent>

          <TabsContent value="history" data-testid="history-content">
            <DetectionHistory />
          </TabsContent>

          <TabsContent value="alerts" data-testid="alerts-content">
            <AlertsManager />
          </TabsContent>

          <TabsContent value="reports" data-testid="reports-content">
            <IntelligentReports />
          </TabsContent>

          <TabsContent value="collaboration" data-testid="collaboration-content">
            <ScientificCollaboration />
          </TabsContent>

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