class TTSService {
  constructor() {
    this.synth = window.speechSynthesis;
    this.voices = [];
    this.currentVoice = null;
    this.rate = 1.0;
    this.autoNarrate = true;
    this.currentAccent = 'neutro'; // Sotaque atual
    
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
      'pt-BR': 'pt-BR', // Garantir mapeamento explícito
      'en': 'en-US',
      'es': 'es-ES',
      'fr': 'fr-FR',
      'zh': 'zh-CN'
    };
    
    const targetLang = langMap[lang] || 'pt-BR'; // Padrão pt-BR
    return this.voices.filter(voice => 
      voice.lang.startsWith(targetLang) || voice.lang.startsWith(lang)
    );
  }

  // Selecionar voz baseada no sotaque regional brasileiro
  getVoiceByAccent(lang, gender, accent) {
    const voices = this.getVoicesByLang(lang);
    
    // Mapeamento de sotaques para nomes de vozes
    // Nota: A disponibilidade depende do navegador e sistema operacional
    const accentMap = {
      'neutro': ['Google português do Brasil', 'Microsoft Maria', 'Luciana', 'pt-BR'],
      'sulista': ['Google português do Brasil', 'pt-BR'], // Sulista pode usar pitch/rate ajustado
      'carioca': ['Google português do Brasil', 'pt-BR'], // Carioca pode usar pitch/rate ajustado
      'nordestino': ['Google português do Brasil', 'pt-BR'] // Nordestino pode usar pitch/rate ajustado
    };
    
    const preferredNames = accentMap[accent] || accentMap['neutro'];
    
    // Tentar encontrar voz que corresponda ao sotaque preferido
    for (const prefName of preferredNames) {
      const voice = voices.find(v => 
        v.name.includes(prefName) && 
        v.lang.startsWith('pt-BR')
      );
      if (voice) return voice;
    }
    
    // Fallback: qualquer voz pt-BR
    return voices.find(v => v.lang === 'pt-BR' || v.lang.startsWith('pt-BR')) || voices[0];
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
    
    // Force pt-BR language
    utterance.lang = 'pt-BR';
    
    if (this.currentVoice) {
      utterance.voice = this.currentVoice;
    } else {
      // If no voice set, try to get Brazilian male voice
      const brMaleVoice = this.getMaleVoice('pt-BR');
      if (brMaleVoice) {
        utterance.voice = brMaleVoice;
      }
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