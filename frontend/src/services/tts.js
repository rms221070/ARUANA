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

  getMaleVoice(lang, accent = 'neutro') {
    // Usar seleção por sotaque
    return this.getVoiceByAccent(lang, 'male', accent);
  }

  getFemaleVoice(lang, accent = 'neutro') {
    // Usar seleção por sotaque
    return this.getVoiceByAccent(lang, 'female', accent);
  }

  setVoice(gender, lang = 'pt-BR', accent = 'neutro') {
    // Forçar pt-BR se for apenas 'pt'
    if (lang === 'pt') {
      lang = 'pt-BR';
    }
    
    this.currentAccent = accent;
    this.currentVoice = gender === 'male' 
      ? this.getMaleVoice(lang, accent) 
      : this.getFemaleVoice(lang, accent);
  }

  // Obter parâmetros de pitch e rate baseados no sotaque
  getAccentParameters(accent) {
    const accentParams = {
      'neutro': { pitch: 1.0, rate: 1.0 },
      'sulista': { pitch: 0.95, rate: 0.95 }, // Fala mais pausada e grave
      'carioca': { pitch: 1.1, rate: 1.05 }, // Fala mais aguda e rápida
      'nordestino': { pitch: 1.05, rate: 1.1 } // Fala mais animada e rápida
    };
    
    return accentParams[accent] || accentParams['neutro'];
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
    
    // SEMPRE forçar pt-BR (Português do Brasil)
    utterance.lang = 'pt-BR';
    
    if (this.currentVoice) {
      utterance.voice = this.currentVoice;
    } else {
      // Se nenhuma voz definida, tentar obter voz brasileira feminina
      const brVoice = this.getFemaleVoice('pt-BR', this.currentAccent);
      if (brVoice) {
        utterance.voice = brVoice;
      }
    }
    
    // Aplicar parâmetros do sotaque regional
    const accentParams = this.getAccentParameters(this.currentAccent);
    
    utterance.rate = options.rate || (this.rate * accentParams.rate);
    utterance.pitch = options.pitch || accentParams.pitch;
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