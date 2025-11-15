class TTSService {
  constructor() {
    this.synth = window.speechSynthesis;
    this.voices = [];
    this.currentVoice = null;
    this.rate = 1.0;
    this.autoNarrate = true;
    
    // Load voices
    this.loadVoices();
    if (this.synth.onvoiceschanged !== undefined) {
      this.synth.onvoiceschanged = () => this.loadVoices();
    }
  }

  loadVoices() {
    this.voices = this.synth.getVoices();
  }

  getVoicesByLang(lang) {
    const langMap = {
      'pt': 'pt-BR',
      'en': 'en-US',
      'es': 'es-ES',
      'fr': 'fr-FR',
      'zh': 'zh-CN'
    };
    
    const targetLang = langMap[lang] || lang;
    return this.voices.filter(voice => 
      voice.lang.startsWith(targetLang) || voice.lang.startsWith(lang)
    );
  }

  getMaleVoice(lang) {
    const voices = this.getVoicesByLang(lang);
    
    // Prioritize Brazilian Portuguese male voices
    if (lang === 'pt' || lang === 'pt-BR') {
      // Look for specific Brazilian male voices
      const brMaleVoice = voices.find(v => 
        (v.lang === 'pt-BR' || v.lang.startsWith('pt-BR')) &&
        (v.name.includes('Google português do Brasil') || 
         v.name.includes('Luciana') === false &&
         v.name.includes('male') ||
         v.name.includes('Masculino') ||
         v.name.toLowerCase().includes('male'))
      );
      
      if (brMaleVoice) return brMaleVoice;
      
      // Fallback to any Brazilian Portuguese voice
      const brVoice = voices.find(v => v.lang === 'pt-BR' || v.lang.startsWith('pt-BR'));
      if (brVoice) return brVoice;
    }
    
    // General male voice selection
    return voices.find(v => v.name.toLowerCase().includes('male') && !v.name.toLowerCase().includes('female'))
      || voices.find(v => !v.name.toLowerCase().includes('female'))
      || voices[0];
  }

  getFemaleVoice(lang) {
    const voices = this.getVoicesByLang(lang);
    return voices.find(v => v.name.toLowerCase().includes('female'))
      || voices[voices.length - 1]
      || voices[0];
  }

  setVoice(gender, lang) {
    this.currentVoice = gender === 'male' 
      ? this.getMaleVoice(lang) 
      : this.getFemaleVoice(lang);
  }

  setRate(rate) {
    this.rate = rate;
  }

  setAutoNarrate(auto) {
    this.autoNarrate = auto;
  }

  speak(text, options = {}) {
    if (!text || !this.autoNarrate) return;

    // Stop any ongoing speech
    this.stop();

    const utterance = new SpeechSynthesisUtterance(text);
    
    if (this.currentVoice) {
      utterance.voice = this.currentVoice;
    }
    
    utterance.rate = options.rate || this.rate;
    utterance.pitch = options.pitch || 1.0;
    utterance.volume = options.volume || 1.0;

    if (options.onEnd) {
      utterance.onend = options.onEnd;
    }

    if (options.onError) {
      utterance.onerror = options.onError;
    }

    this.synth.speak(utterance);
  }

  stop() {
    this.synth.cancel();
  }

  pause() {
    this.synth.pause();
  }

  resume() {
    this.synth.resume();
  }

  isSpeaking() {
    return this.synth.speaking;
  }
}

export default new TTSService();