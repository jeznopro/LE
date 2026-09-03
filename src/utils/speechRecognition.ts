// Advanced Speech Recognition & High-Precision Pronunciation Analysis Engine

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export interface CharacterMatch {
  char: string;
  matched: boolean;
}

export interface PronunciationEvaluation {
  score: number; // 0 to 100
  accuracy: 'perfect' | 'good' | 'retry';
  feedback: string;
  tip?: string;
  spokenText: string;
  targetText: string;
  charMatches: CharacterMatch[];
  audioBlobUrl?: string;
}

export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
}

// Levenshtein distance
function levenshteinDistance(s1: string, s2: string): number {
  const m = s1.length;
  const n = s2.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (s1[i - 1] === s2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }
  return dp[m][n];
}

// Generate character by character visual alignment
function generateCharacterAlignment(spoken: string, target: string): CharacterMatch[] {
  const cleanSpoken = spoken.toLowerCase().replace(/[^a-z0-9]/g, '');
  const cleanTarget = target.toLowerCase().replace(/[^a-z0-9]/g, '');

  const result: CharacterMatch[] = [];
  let sIdx = 0;

  for (let tIdx = 0; tIdx < cleanTarget.length; tIdx++) {
    const targetChar = cleanTarget[tIdx];
    if (sIdx < cleanSpoken.length && cleanSpoken[sIdx] === targetChar) {
      result.push({ char: targetChar, matched: true });
      sIdx++;
    } else if (cleanSpoken.includes(targetChar) && cleanSpoken.indexOf(targetChar) >= sIdx) {
      sIdx = cleanSpoken.indexOf(targetChar) + 1;
      result.push({ char: targetChar, matched: true });
    } else {
      result.push({ char: targetChar, matched: false });
    }
  }

  return result;
}

// Detect specific phonetic mistakes (e.g. missing ending sounds)
function analyzePhoneticTips(spoken: string, target: string): string | undefined {
  const s = spoken.toLowerCase().trim();
  const t = target.toLowerCase().trim();

  // Ending sound checks
  if (t.endsWith('s') && !s.endsWith('s')) {
    return 'Lưu ý: Bạn bị thiếu âm đuôi /s/ hoặc /z/ ở cuối từ.';
  }
  if (t.endsWith('ed') && !s.endsWith('ed') && !s.endsWith('t') && !s.endsWith('d')) {
    return 'Lưu ý: Cần bật rõ âm đuôi quá khứ /-ed/.';
  }
  if (t.endsWith('ing') && !s.endsWith('ing')) {
    return 'Lưu ý: Phát âm rõ đuôi /-ing/.';
  }
  if (t.endsWith('t') && !s.endsWith('t')) {
    return 'Lưu ý: Đừng quên bật âm chặn /t/ ở cuối từ.';
  }
  if (t.endsWith('d') && !s.endsWith('d')) {
    return 'Lưu ý: Cần bật rõ âm hữu thanh /d/ ở cuối từ.';
  }
  if (t.endsWith('k') && !s.endsWith('k') && !s.endsWith('c')) {
    return 'Lưu ý: Bật rõ âm bật /k/ ở cuối từ.';
  }
  if (t.endsWith('th') && !s.endsWith('th')) {
    return 'Lưu ý: Đặt đầu lưỡi giữa 2 hàm răng khi phát âm /θ/ hoặc /ð/.';
  }

  return undefined;
}

export function evaluatePronunciation(
  spoken: string,
  target: string,
  strictness: 'standard' | 'strict' | 'master' = 'strict',
  audioBlobUrl?: string
): PronunciationEvaluation {
  const cleanSpoken = spoken.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
  const cleanTarget = target.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();

  if (!cleanSpoken) {
    return {
      score: 0,
      accuracy: 'retry',
      feedback: 'Chưa nghe thấy giọng nói. Hãy bấm Micro và phát âm to, rõ ràng nhé!',
      spokenText: spoken,
      targetText: target,
      charMatches: target.split('').map((c) => ({ char: c, matched: false })),
      audioBlobUrl,
    };
  }

  const charMatches = generateCharacterAlignment(cleanSpoken, cleanTarget);
  const matchedCharsCount = charMatches.filter((m) => m.matched).length;
  const charRatio = matchedCharsCount / Math.max(cleanTarget.length, 1);

  // Exact Match
  if (cleanSpoken === cleanTarget) {
    return {
      score: 100,
      accuracy: 'perfect',
      feedback: '🎉 Phát âm CHUẨN XÁC 100% từng âm tiết như người bản xứ!',
      spokenText: spoken,
      targetText: target,
      charMatches: cleanTarget.split('').map((c) => ({ char: c, matched: true })),
      audioBlobUrl,
    };
  }

  // Calculate Precision Levenshtein Similarity
  const maxLen = Math.max(cleanSpoken.length, cleanTarget.length);
  const dist = levenshteinDistance(cleanSpoken, cleanTarget);
  const rawSimilarity = Math.max(0, 1 - dist / maxLen);
  
  // Weighted score based on character matching + distance
  let score = Math.round((rawSimilarity * 0.6 + charRatio * 0.4) * 100);

  const phoneticTip = analyzePhoneticTips(cleanSpoken, cleanTarget);

  // Thresholds based on Strictness
  const perfectThreshold = strictness === 'master' ? 95 : strictness === 'strict' ? 88 : 80;
  const goodThreshold = strictness === 'master' ? 80 : strictness === 'strict' ? 70 : 60;

  if (score >= perfectThreshold) {
    return {
      score,
      accuracy: 'perfect',
      feedback: '🌟 Rất tốt! Âm sắc chuẩn và tự nhiên.',
      tip: phoneticTip,
      spokenText: spoken,
      targetText: target,
      charMatches,
      audioBlobUrl,
    };
  } else if (score >= goodThreshold) {
    return {
      score,
      accuracy: 'good',
      feedback: '👏 Gần đúng! Cần chỉnh lại một vài âm tiết để chuẩn xác hơn.',
      tip: phoneticTip || 'Hãy nghe lại phát âm mẫu và chú ý khẩu hình miệng.',
      spokenText: spoken,
      targetText: target,
      charMatches,
      audioBlobUrl,
    };
  } else {
    return {
      score,
      accuracy: 'retry',
      feedback: '💡 Chưa chính xác. Hãy nghe lại âm mẫu chuẩn tốc độ chậm và thử lại!',
      tip: phoneticTip || 'Nghe kỹ từng âm tiết trước khi bấm nói lại.',
      spokenText: spoken,
      targetText: target,
      charMatches,
      audioBlobUrl,
    };
  }
}

class SpeechRecognitionManager {
  private recognition: any = null;
  private mediaRecorder: MediaRecorder | null = null;
  private mediaStream: MediaStream | null = null;
  private audioChunks: Blob[] = [];
  private isListening: boolean = false;
  private isContinuousMode: boolean = false;
  private accumulatedFinalText: string = '';
  private currentInterimText: string = '';
  private timerInterval: any = null;
  private maxDurationTimer: any = null;
  private secondsElapsed: number = 0;
  private maxDurationSeconds: number = 300; // 5 minutes default!

  private onInterimCallback: ((text: string) => void) | null = null;
  private onFinalCallback: ((text: string, audioUrl?: string) => void) | null = null;
  private onTickCallback: ((secondsLeft: number, secondsElapsed: number) => void) | null = null;
  private onErrorCallback: ((err: string) => void) | null = null;
  private onEndCallback: (() => void) | null = null;
  private currentLang: string = 'en-US';

  constructor() {
    if (isSpeechRecognitionSupported()) {
      const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;
      this.recognition = new SpeechRecognitionClass();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';
      this.recognition.maxAlternatives = 5;
    }
  }

  public async startListening(
    onInterim: (text: string) => void,
    onFinal: (text: string, audioUrl?: string) => void,
    onError: (error: string) => void,
    onEnd: () => void,
    lang: string = 'en-US',
    maxSeconds: number = 300, // 5 minutes!
    onTick?: (secondsLeft: number, secondsElapsed: number) => void
  ) {
    if (!this.recognition) {
      onError('Trình duyệt chưa hỗ trợ Web Speech Recognition. Hãy dùng Google Chrome hoặc Microsoft Edge.');
      return;
    }

    this.stopListening();
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = lang;
    this.currentLang = lang;
    this.isListening = true;
    this.isContinuousMode = true;
    this.audioChunks = [];
    this.accumulatedFinalText = '';
    this.currentInterimText = '';
    this.secondsElapsed = 0;
    this.maxDurationSeconds = maxSeconds;

    this.onInterimCallback = onInterim;
    this.onFinalCallback = onFinal;
    this.onTickCallback = onTick || null;
    this.onErrorCallback = onError;
    this.onEndCallback = onEnd;

    // Start Audio Recording for User Voice Playback
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        this.mediaRecorder = new MediaRecorder(this.mediaStream);
        this.mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) this.audioChunks.push(e.data);
        };
        this.mediaRecorder.start();
      } catch (e) {
        // Microphone stream optional for recorder
      }
    }

    // 1-second Tick Timer for 5-minute countdown
    this.timerInterval = setInterval(() => {
      this.secondsElapsed += 1;
      const secondsLeft = Math.max(0, this.maxDurationSeconds - this.secondsElapsed);
      if (this.onTickCallback) {
        this.onTickCallback(secondsLeft, this.secondsElapsed);
      }
      if (this.secondsElapsed >= this.maxDurationSeconds) {
        this.stopListening();
      }
    }, 1000);

    this.setupRecognitionEvents();

    try {
      this.recognition.start();
    } catch (e) {
      this.isListening = false;
      this.cleanupTimers();
      this.cleanupMedia();
      onError('Không thể bật Micro. Vui lòng bấm thử lại.');
    }
  }

  private setupRecognitionEvents() {
    if (!this.recognition) return;

    this.recognition.onresult = (event: any) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const item = event.results[i];
        if (item.isFinal) {
          const phrase = item[0].transcript.trim();
          if (phrase) {
            this.accumulatedFinalText = this.accumulatedFinalText
              ? `${this.accumulatedFinalText} ${phrase}`
              : phrase;
          }
        } else {
          interim += item[0].transcript;
        }
      }

      this.currentInterimText = interim;
      const combined = (this.accumulatedFinalText + ' ' + this.currentInterimText).trim();
      if (this.onInterimCallback && combined) {
        this.onInterimCallback(combined);
      }
    };

    this.recognition.onerror = (event: any) => {
      if (event.error === 'no-speech') {
        // Browser timed out momentarily during silence — auto keep-alive if user is still in recording session!
        if (this.isListening && this.isContinuousMode) {
          try {
            this.recognition.start();
          } catch {}
          return;
        }
      }

      if (event.error === 'not-allowed') {
        this.isListening = false;
        this.cleanupTimers();
        this.cleanupMedia();
        if (this.onErrorCallback) {
          this.onErrorCallback('Vui lòng cho phép quyền truy cập Micro trên trình duyệt.');
        }
      }
    };

    this.recognition.onend = () => {
      // Auto-reconnect if session is active (allows recording continuously for up to 5 minutes!)
      if (this.isListening && this.isContinuousMode && this.secondsElapsed < this.maxDurationSeconds) {
        try {
          this.recognition.start();
          return;
        } catch {}
      }

      if (!this.isListening) {
        this.cleanupTimers();
        this.cleanupMedia();
        if (this.onEndCallback) {
          this.onEndCallback();
        }
      }
    };
  }

  private cleanupTimers() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    if (this.maxDurationTimer) {
      clearTimeout(this.maxDurationTimer);
      this.maxDurationTimer = null;
    }
  }

  private cleanupMedia() {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }
    this.mediaRecorder = null;
  }

  public stopListening() {
    if (!this.isListening) return;
    this.isListening = false;
    this.isContinuousMode = false;
    this.cleanupTimers();

    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch {}
    }

    const finalText = (this.accumulatedFinalText + ' ' + this.currentInterimText).trim();

    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        if (this.onFinalCallback) {
          this.onFinalCallback(finalText, audioUrl);
        }
        this.cleanupMedia();
      };
      try {
        this.mediaRecorder.stop();
      } catch {
        if (this.onFinalCallback) {
          this.onFinalCallback(finalText);
        }
        this.cleanupMedia();
      }
    } else {
      if (this.onFinalCallback) {
        this.onFinalCallback(finalText);
      }
      this.cleanupMedia();
    }
  }

  public cancelListening() {
    this.isListening = false;
    this.isContinuousMode = false;
    this.cleanupTimers();
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch {}
    }
    this.cleanupMedia();
    if (this.onEndCallback) {
      this.onEndCallback();
    }
  }

  public getIsListening(): boolean {
    return this.isListening;
  }
}

export const speechRecognitionManager = new SpeechRecognitionManager();
