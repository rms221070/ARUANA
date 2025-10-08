import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import WebcamDetection from "@/components/WebcamDetection";
import UploadDetection from "@/components/UploadDetection";
import DetectionHistory from "@/components/DetectionHistory";
import AlertsManager from "@/components/AlertsManager";
import Settings from "@/components/Settings";
import { Camera, Upload, History, Bell, Settings as SettingsIcon, Eye } from "lucide-react";
import { useSettings } from "@/context/SettingsContext";

const Dashboard = () => {
  const { t } = useTranslation();
  const { narrate, settings } = useSettings();
  const [activeTab, setActiveTab] = useState("webcam");

  useEffect(() => {
    // Narrate welcome message
    narrate(t('app.title') + '. ' + t('app.subtitle'));
  }, []);

  const handleTabChange = (value) => {
    setActiveTab(value);
    narrate(t(`navigation.${value}`));
  };

  return (
    <div 
      data-testid="dashboard-container" 
      className={`min-h-screen ${
        settings.highContrast 
          ? 'bg-black text-white' 
          : 'bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50'
      }`}
    >
      {/* Hero Header */}
      <div className={`border-b ${
        settings.highContrast ? 'border-white bg-black' : 'border-indigo-200 bg-white/80 backdrop-blur-md'
      } sticky top-0 z-50 shadow-lg`}>
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-2xl ${
                settings.highContrast ? 'bg-white' : 'bg-gradient-to-br from-indigo-600 to-purple-600'
              } shadow-xl`}>
                <Eye className={`w-8 h-8 ${settings.highContrast ? 'text-black' : 'text-white'}`} />
              </div>
              <div>
                <h1 className={`text-3xl md:text-4xl font-bold ${
                  settings.highContrast 
                    ? 'text-white' 
                    : 'bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent'
                } mb-1`}>
                  {t('app.title')}
                </h1>
                <p className={`text-sm md:text-base ${
                  settings.highContrast ? 'text-gray-300' : 'text-slate-600'
                }`}>
                  {t('app.subtitle')}
                </p>
              </div>
            </div>
          </div>
          <p className={`mt-3 text-sm ${
            settings.highContrast ? 'text-gray-400' : 'text-slate-500'
          } italic`}>
            {t('app.description')}
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full" data-testid="main-tabs">
          <TabsList className={`grid w-full grid-cols-5 mb-8 ${
            settings.highContrast 
              ? 'bg-gray-900 border-2 border-white' 
              : 'bg-white/90 backdrop-blur-sm shadow-xl border border-indigo-200'
          }`}>
            <TabsTrigger 
              value="webcam" 
              className="flex items-center gap-2"
              data-testid="webcam-tab"
              aria-label={t('navigation.webcam')}
            >
              <Camera className="w-5 h-5" />
              <span className="hidden sm:inline">{t('navigation.webcam')}</span>
            </TabsTrigger>
            <TabsTrigger 
              value="upload" 
              className="flex items-center gap-2" 
              data-testid="upload-tab"
              aria-label={t('navigation.upload')}
            >
              <Upload className="w-5 h-5" />
              <span className="hidden sm:inline">{t('navigation.upload')}</span>
            </TabsTrigger>
            <TabsTrigger 
              value="history" 
              className="flex items-center gap-2" 
              data-testid="history-tab"
              aria-label={t('navigation.history')}
            >
              <History className="w-5 h-5" />
              <span className="hidden sm:inline">{t('navigation.history')}</span>
            </TabsTrigger>
            <TabsTrigger 
              value="alerts" 
              className="flex items-center gap-2" 
              data-testid="alerts-tab"
              aria-label={t('navigation.alerts')}
            >
              <Bell className="w-5 h-5" />
              <span className="hidden sm:inline">{t('navigation.alerts')}</span>
            </TabsTrigger>
            <TabsTrigger 
              value="settings" 
              className="flex items-center gap-2" 
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

          <TabsContent value="settings" data-testid="settings-content">
            <Settings />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;