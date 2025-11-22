import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSettings } from "@/context/SettingsContext";
import { Settings as SettingsIcon, Volume2, Globe, Type } from "lucide-react";

const Settings = () => {
  const { t, i18n } = useTranslation();
  const { settings, updateSettings, narrate } = useSettings();

  const languages = [
    { code: 'pt-BR', name: 'Português (Brasil)', flag: '🇧🇷' },
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'zh', name: '中文', flag: '🇨🇳' }
  ];

  const accents = [
    { code: 'neutro', name: 'Neutro (Padrão)', description: 'Sotaque neutro brasileiro' },
    { code: 'sulista', name: 'Sulista', description: 'Sul: RS, SC, PR - Fala mais pausada' },
    { code: 'carioca', name: 'Carioca', description: 'Rio de Janeiro - Fala mais animada' },
    { code: 'nordestino', name: 'Nordestino', description: 'Nordeste - Fala mais rápida e expressiva' }
  ];

  const handleLanguageChange = (lang) => {
    updateSettings({ language: lang });
    narrate(`Idioma alterado para ${languages.find(l => l.code === lang)?.name}`);
  };

  const handleVoiceGenderChange = (gender) => {
    updateSettings({ voiceGender: gender });
    const genderText = gender === 'male' ? 'Masculina' : 'Feminina';
    narrate(`Voz alterada para ${genderText}`);
  };

  const handleAccentChange = (accent) => {
    updateSettings({ voiceAccent: accent });
    const accentName = accents.find(a => a.code === accent)?.name || 'Neutro';
    narrate(`Sotaque alterado para ${accentName}. ${accents.find(a => a.code === accent)?.description}`);
  };

  const handleSpeedChange = (value) => {
    updateSettings({ voiceSpeed: value[0] });
  };

  const handleAutoNarrateChange = (checked) => {
    updateSettings({ autoNarrate: checked });
    if (checked) {
      narrate(t('settings.autoNarrate'));
    }
  };

  const handleHighContrastChange = (checked) => {
    updateSettings({ highContrast: checked });
    narrate(t('settings.highContrast'));
  };

  return (
    <div className="max-w-4xl mx-auto" data-testid="settings-container">
      <Card className={`${settings.highContrast ? 'bg-gray-900 border-white border-2' : 'bg-white/90 backdrop-blur-sm border-indigo-200 shadow-xl'}`}>
        <CardHeader>
          <CardTitle className={`text-2xl flex items-center gap-2 ${settings.highContrast ? 'text-white' : 'text-slate-800'}`}>
            <SettingsIcon className={`w-6 h-6 ${settings.highContrast ? 'text-white' : 'text-indigo-600'}`} />
            {t('settings.title')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Language Selection */}
          <div className="space-y-3">
            <Label className={`text-lg flex items-center gap-2 ${settings.highContrast ? 'text-white' : 'text-slate-700'}`}>
              <Globe className="w-5 h-5" />
              {t('settings.language')}
            </Label>
            <Select value={settings.language} onValueChange={handleLanguageChange}>
              <SelectTrigger className={`w-full ${settings.highContrast ? 'bg-gray-800 text-white border-white' : ''}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {languages.map((lang) => (
                  <SelectItem key={lang.code} value={lang.code}>
                    {lang.flag} {lang.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Voice Gender */}
          <div className="space-y-3">
            <Label className={`text-lg flex items-center gap-2 ${settings.highContrast ? 'text-white' : 'text-slate-700'}`}>
              <Volume2 className="w-5 h-5" />
              Gênero da Voz
            </Label>
            <RadioGroup value={settings.voiceGender} onValueChange={handleVoiceGenderChange}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="male" id="male" />
                <Label htmlFor="male" className={`cursor-pointer ${settings.highContrast ? 'text-white' : ''}`}>
                  Masculina
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="female" id="female" />
                <Label htmlFor="female" className={`cursor-pointer ${settings.highContrast ? 'text-white' : ''}`}>
                  Feminina
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Regional Accent - NEW */}
          <div className="space-y-3">
            <Label className={`text-lg flex items-center gap-2 ${settings.highContrast ? 'text-white' : 'text-slate-700'}`}>
              <Volume2 className="w-5 h-5" />
              🗣️ Sotaque Regional Brasileiro
            </Label>
            <Select 
              value={settings.voiceAccent || 'neutro'} 
              onValueChange={handleAccentChange}
            >
              <SelectTrigger className={`w-full ${settings.highContrast ? 'bg-gray-800 text-white border-white' : ''}`}>
                <SelectValue placeholder="Selecione o sotaque" />
              </SelectTrigger>
              <SelectContent>
                {accents.map((accent) => (
                  <SelectItem key={accent.code} value={accent.code}>
                    <div className="flex flex-col">
                      <span className="font-semibold">{accent.name}</span>
                      <span className="text-xs text-gray-500">{accent.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className={`text-xs ${settings.highContrast ? 'text-gray-400' : 'text-gray-600'} mt-2`}>
              💡 O sotaque ajusta a velocidade e entonação da voz para simular diferentes regiões do Brasil
            </p>
          </div>

          {/* Voice Speed */}
          <div className="space-y-3">
            <Label className={`text-lg ${settings.highContrast ? 'text-white' : 'text-slate-700'}`}>
              {t('settings.voiceSpeed')}: {settings.voiceSpeed.toFixed(1)}x
            </Label>
            <Slider
              value={[settings.voiceSpeed]}
              onValueChange={handleSpeedChange}
              min={0.5}
              max={2.0}
              step={0.1}
              className="w-full"
            />
          </div>

          {/* Auto Narrate */}
          <div className={`flex items-center justify-between p-4 rounded-lg ${settings.highContrast ? 'bg-gray-800' : 'bg-slate-50'}`}>
            <Label htmlFor="auto-narrate" className={`text-lg cursor-pointer ${settings.highContrast ? 'text-white' : 'text-slate-700'}`}>
              {t('settings.autoNarrate')}
            </Label>
            <Switch
              id="auto-narrate"
              checked={settings.autoNarrate}
              onCheckedChange={handleAutoNarrateChange}
            />
          </div>

          {/* High Contrast */}
          <div className={`flex items-center justify-between p-4 rounded-lg ${settings.highContrast ? 'bg-gray-800' : 'bg-slate-50'}`}>
            <Label htmlFor="high-contrast" className={`text-lg cursor-pointer ${settings.highContrast ? 'text-white' : 'text-slate-700'}`}>
              {t('settings.highContrast')}
            </Label>
            <Switch
              id="high-contrast"
              checked={settings.highContrast}
              onCheckedChange={handleHighContrastChange}
            />
          </div>

          {/* Accessibility Notice */}
          <div className={`p-4 rounded-lg border ${settings.highContrast ? 'bg-gray-800 border-white' : 'bg-indigo-50 border-indigo-200'}`}>
            <p className={`text-sm ${settings.highContrast ? 'text-white' : 'text-indigo-900'}`}>
              ♿ {(settings.language === 'pt' || settings.language === 'pt-BR') && 'Este sistema foi projetado com foco em acessibilidade para usuários cegos, incluindo suporte para leitores de tela, navegação por teclado e sotaques regionais brasileiros.'}
              {settings.language === 'en' && 'This system was designed with a focus on accessibility, including support for screen readers and keyboard navigation.'}
              {settings.language === 'es' && 'Este sistema fue diseñado con un enfoque en accesibilidad, incluyendo soporte para lectores de pantalla y navegación por teclado.'}
              {settings.language === 'fr' && 'Ce système a été conçu en mettant l\'accent sur l\'accessibilité, y compris le support des lecteurs d\'écran et de la navigation au clavier.'}
              {settings.language === 'zh' && '该系统的设计注重可访问性，包括对屏幕阅读器和键盘导航的支持。'}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;
