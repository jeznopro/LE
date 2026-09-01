// Text-to-Speech service using Web Speech API

class TTSService {
  private voices: SpeechSynthesisVoice[] = [];
  private initialized = false;

  constructor() {
    this.initVoices();
  }

  private initVoices() {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    const updateVoices = () => {
      this.voices = window.speechSynthesis.getVoices();
      this.initialized = true;
    };

    updateVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
  }

  public speak(text: string, accent: 'en-US' | 'en-GB' | 'en-AU' = 'en-US', speed: number = 0.9) {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    window.speechSynthesis.cancel(); // Stop ongoing speech

    // Clean html or tags if any
    const cleanText = text.replace(/<[^>]*>?/gm, '').trim();
    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = accent;
    utterance.rate = Math.max(0.6, Math.min(1.4, speed));
    utterance.pitch = 1.05; // Slightly cute/clear tone

    // Try to find natural voice
    if (this.voices.length > 0) {
      const matchVoice = this.voices.find(v => v.lang === accent) || 
                         this.voices.find(v => v.lang.startsWith('en')) || 
                         this.voices[0];
      if (matchVoice) {
        utterance.voice = matchVoice;
      }
    }

    window.speechSynthesis.speak(utterance);
  }

  public getAvailableAccents(): { label: string; value: 'en-US' | 'en-GB' | 'en-AU' }[] {
    return [
      { label: '🇺🇸 Giọng Mỹ (US)', value: 'en-US' },
      { label: '🇬🇧 Giọng Anh (UK)', value: 'en-GB' },
      { label: '🇦🇺 Giọng Úc (AU)', value: 'en-AU' },
    ];
  }
}

export const ttsService = new TTSService();
