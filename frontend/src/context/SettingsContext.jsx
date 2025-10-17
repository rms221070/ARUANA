import { createContext, useContext, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import ttsService from '../services/tts';

const SettingsContext = createContext();

export const SettingsProvider = ({ children }) => {
  const { i18n } = useTranslation();
  const [settings, setSettings] = useState({
    language: 'pt',
    voiceGender: 'female',
    voiceSpeed: 1.0,
    autoNarrate: true,
    highContrast: false,
    fontSize: 'medium'
  });

  useEffect(() => {
    // Load settings from localStorage
    const saved = localStorage.getItem('aruanaSettings');
    if (saved) {
      const parsed = JSON.parse(saved);
      setSettings(parsed);
      i18n.changeLanguage(parsed.language);
      ttsService.setVoice(parsed.voiceGender, parsed.language);
      ttsService.setRate(parsed.voiceSpeed);
      ttsService.setAutoNarrate(parsed.autoNarrate);
    } else {
      ttsService.setVoice('female', 'pt');
    }
  }, [i18n]);

  const updateSettings = (newSettings) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    localStorage.setItem('aruanaSettings', JSON.stringify(updated));

    if (newSettings.language) {
      i18n.changeLanguage(newSettings.language);
      ttsService.setVoice(updated.voiceGender, newSettings.language);
    }

    if (newSettings.voiceGender !== undefined) {
      ttsService.setVoice(newSettings.voiceGender, updated.language);
    }

    if (newSettings.voiceSpeed !== undefined) {
      ttsService.setRate(newSettings.voiceSpeed);
    }

    if (newSettings.autoNarrate !== undefined) {
      ttsService.setAutoNarrate(newSettings.autoNarrate);
    }
  };

  const narrate = (text) => {
    ttsService.speak(text);
  };

  // Enhanced interface narration
  const narrateInterface = (elementType, elementContent, additionalInfo = '') => {
    if (!settings.autoNarrate) return;
    
    let message = '';
    switch (elementType) {
      case 'button':
        message = `Botão: ${elementContent}${additionalInfo ? '. ' + additionalInfo : ''}`;
        break;
      case 'tab':
        message = `Aba selecionada: ${elementContent}${additionalInfo ? '. ' + additionalInfo : ''}`;
        break;
      case 'card':
        message = `Cartão: ${elementContent}${additionalInfo ? '. ' + additionalInfo : ''}`;
        break;
      case 'panel':
        message = `Painel: ${elementContent}${additionalInfo ? '. ' + additionalInfo : ''}`;
        break;
      case 'warning':
        message = `Aviso importante: ${elementContent}${additionalInfo ? '. ' + additionalInfo : ''}`;
        break;
      case 'notification':
        message = `Notificação: ${elementContent}${additionalInfo ? '. ' + additionalInfo : ''}`;
        break;
      case 'form':
        message = `Campo de formulário: ${elementContent}${additionalInfo ? '. ' + additionalInfo : ''}`;
        break;
      case 'result':
        message = `Resultado: ${elementContent}${additionalInfo ? '. ' + additionalInfo : ''}`;
        break;
      default:
        message = `${elementContent}${additionalInfo ? '. ' + additionalInfo : ''}`;
    }
    
    narrate(message);
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, narrate }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within SettingsProvider');
  }
  return context;
};