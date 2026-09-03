import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, SRSRating, UserSettings } from '../types';
import { calculateSRS, getRatingIntervalPreviews, MOCHI_LEVEL_INFO } from '../utils/srs';
import { ttsService } from '../utils/tts';
import { soundManager } from '../utils/sounds';
import confetti from 'canvas-confetti';
import {
  Volume2,
  RotateCw,
  Sparkles,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Zap,
  Mic,
  MicOff,
  Keyboard,
  Layers,
  RotateCcw,
} from 'lucide-react';
import { Mascot } from './Mascot';
import { MochiStudyView } from './MochiStudyView';
import { useMediaUrl } from '../hooks/useMediaUrl';
import { speechRecognitionManager, evaluatePronunciation, PronunciationEvaluation } from '../utils/speechRecognition';

const normalizeWord = (s: string) => {
  return (s || '')
    .trim()
    .toLowerCase()
    .replace(/[\s\-_.,!?'"()\[\]\u200B\u00A0]+/g, '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
};

const generateTypingHint = (word: string) => {
  if (!word) return '';
  return word.split('').map((c, i) => {
    if (/[a-zA-Z]/.test(c)) {
      return i === 0 || i === word.length - 1 ? c.toLowerCase() : '_';
    }
    return c;
  }).join(' ');
};

const generateExampleHint = (example?: string, word?: string) => {
  if (!example || !word) return example;
  // Try to replace the exact word (case insensitive) with a blank
  const regex = new RegExp(word, 'gi');
  return example.replace(regex, '______');
};

interface FlashcardStudyProps {
  cards: Card[];
  deckTitle: string;
  settings: UserSettings;
  onFinishSession: (updatedCards: Card[], xpGained: number) => void;
  onExit: () => void;
}

export const FlashcardStudy: React.FC<FlashcardStudyProps> = ({
  cards,
  deckTitle,
  settings,
  onFinishSession,
  onExit,
}) => {
  const [studyQueue, setStudyQueue] = useState<Card[]>(cards);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [updatedCardsMap, setUpdatedCardsMap] = useState<Record<string, Card>>({});
  const [xpGained, setXpGained] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [mascotMood, setMascotMood] = useState<'happy' | 'thinking' | 'cheering' | 'proud' | 'surprised'>('happy');
  
  // Practice mode: 'mochi' | 'typing' | 'speaking' | 'flip'
  const [practiceMode, setPracticeMode] = useState<'mochi' | 'typing' | 'speaking' | 'flip'>('mochi');
  
  // Typing mode states
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const inputValueRef = useRef('');
  inputValueRef.current = inputValue;

  // Speaking mode states
  const [isListening, setIsListening] = useState(false);
  const [speakingTranscript, setSpeakingTranscript] = useState('');
  const [speakingEvaluation, setSpeakingEvaluation] = useState<PronunciationEvaluation | null>(null);
  const [speakingError, setSpeakingError] = useState('');

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const currentCard = studyQueue[currentIndex];
  const imageUrl = useMediaUrl(currentCard?.image);

  const playCardAudio = useCallback(
    (text: string) => {
      ttsService.speak(text, settings.ttsAccent, settings.ttsSpeed);
    },
    [settings.ttsAccent, settings.ttsSpeed]
  );

  const handlePlaySlowAudio = (text: string) => {
    ttsService.speak(text, settings.ttsAccent, 0.65);
  };

  const handlePlayUserVoice = (audioUrl: string) => {
    try {
      const a = new Audio(audioUrl);
      a.play();
    } catch {}
  };

  const [showPeekAnswer, setShowPeekAnswer] = useState(false);

  useEffect(() => {
    if (currentCard && !isFinished) {
      setIsFlipped(false);
      setIsSubmitted(false);
      setShowPeekAnswer(false);
      setInputValue('');
      setIsListening(false);
      setSpeakingTranscript('');
      setSpeakingEvaluation(null);
      setSpeakingError('');
      setMascotMood('thinking');
      if (settings.autoPlayAudio && practiceMode === 'flip') {
        const timer = setTimeout(() => {
          playCardAudio(currentCard.front);
        }, 150);
        return () => clearTimeout(timer);
      }
    }
  }, [currentIndex, currentCard, isFinished, settings.autoPlayAudio, playCardAudio, practiceMode]);

  // Robust Auto-focus input whenever moving to a new card in typing mode
  useEffect(() => {
    if (practiceMode === 'typing' && !isFlipped && !isSubmitted && !isFinished) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [currentIndex, isFlipped, practiceMode, isSubmitted, isFinished]);

  const [strictness, setStrictness] = useState<'standard' | 'strict' | 'master'>('strict');

  const handleStartSpeaking = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!currentCard || isListening) return;

    setSpeakingError('');
    setSpeakingTranscript('');
    setSpeakingEvaluation(null);
    setIsListening(true);
    soundManager.playClick();

    speechRecognitionManager.startListening(
      (interim) => {
        setSpeakingTranscript(interim);
      },
      (final, audioUrl) => {
        setSpeakingTranscript(final);
        setInputValue(final);
        const result = evaluatePronunciation(final, currentCard.front, strictness, audioUrl);
        setSpeakingEvaluation(result);
        setIsListening(false);

        const passScore = strictness === 'master' ? 95 : strictness === 'strict' ? 88 : 80;

        if (result.score >= passScore) {
          soundManager.playCorrect();
          setMascotMood('cheering');
          setIsSubmitted(true);
          setIsCorrect(true);
          setTimeout(() => {
            setIsFlipped(true);
          }, 900);
        } else {
          soundManager.playWrong();
          setMascotMood('surprised');
        }
      },
      (err) => {
        setIsListening(false);
        setSpeakingError(err);
        setMascotMood('surprised');
      },
      () => {
        setIsListening(false);
      },
      settings.ttsAccent || 'en-US'
    );
  };

  const handleFlip = () => {
    soundManager.playFlip();
    if (!isFlipped && practiceMode === 'typing' && !isSubmitted && currentCard) {
      const currentInput = inputValueRef.current;
      const trimmedInput = normalizeWord(currentInput);
      const target = normalizeWord(currentCard.front);
      const correct = trimmedInput.length > 0 && trimmedInput === target;
      setIsSubmitted(true);
      setIsCorrect(correct);
      if (correct) {
        soundManager.playCorrect();
        setMascotMood('cheering');
        if (settings.autoPlayAudio) playCardAudio(currentCard.front);
      } else {
        soundManager.playWrong();
        setMascotMood('surprised');
      }
    }
    setIsFlipped(!isFlipped);
  };

  const handleTypeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitted || !currentCard) return;

    const currentInput = inputValueRef.current;
    const trimmedInput = normalizeWord(currentInput);
    const target = normalizeWord(currentCard.front);
    const correct = trimmedInput.length > 0 && trimmedInput === target;

    setIsSubmitted(true);
    setIsCorrect(correct);
    setIsFlipped(true);
    soundManager.playFlip();

    if (correct) {
      soundManager.playCorrect();
      setMascotMood('cheering');
      if (settings.autoPlayAudio) playCardAudio(currentCard.front);
    } else {
      soundManager.playWrong();
      setMascotMood('surprised');
    }
  };

  const handleRate = (rating: SRSRating) => {
    if (!currentCard) return;

    if (practiceMode === 'flip') {
      soundManager.playClick();
      if (rating === 'again') {
        soundManager.playWrong();
        setMascotMood('thinking');
      } else {
        soundManager.playCorrect();
        setMascotMood('cheering');
      }
    }

    const srsRes = calculateSRS(currentCard, rating);
    const updated: Card = {
      ...currentCard,
      ...srsRes,
      lastReview: Date.now(),
    };

    setUpdatedCardsMap((prev) => ({ ...prev, [updated.id]: updated }));

    const xpMap: Record<SRSRating, number> = { again: 2, hard: 5, good: 10, easy: 15 };
    const addXp = xpMap[rating];
    setXpGained((prev) => prev + addXp);

    const nextQueue = [...studyQueue];
    if (rating === 'again') {
      nextQueue.push(currentCard);
      setStudyQueue(nextQueue);
    }

    if (currentIndex + 1 < nextQueue.length) {
      setCurrentIndex((i) => i + 1);
    } else {
      setIsFinished(true);
      soundManager.playVictory();
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    }
  };

  // Keyboard shortcuts (Full manual control - no auto-advance)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isFinished) return;

      const isTypingField = (e.target as HTMLElement)?.tagName === 'INPUT' || (e.target as HTMLElement)?.tagName === 'TEXTAREA';
      
      // If on front side in typing mode and not focused, focus the input on any printable character
      if (practiceMode === 'typing' && !isFlipped && !isSubmitted && !isTypingField) {
        if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
          inputRef.current?.focus();
        }
      }

      // If user is currently typing in the input box on front side, don't intercept Enter/Space with global shortcut
      if (isTypingField && !isFlipped) {
        return;
      }

      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        if (isFlipped) {
          // If already on back side, Enter or Space advances with 'good'
          handleRate('good');
        } else if (practiceMode === 'speaking') {
          handleStartSpeaking();
        } else {
          handleFlip();
        }
      } else if (e.key === 'r' || e.key === 'R') {
        if (currentCard) playCardAudio(currentCard.front);
      } else if (e.key === 'm' || e.key === 'M') {
        if (practiceMode === 'speaking' && !isFlipped) {
          handleStartSpeaking();
        }
      } else if (isFlipped) {
        if (e.key === '1') handleRate('again');
        else if (e.key === '2') handleRate('hard');
        else if (e.key === '3') handleRate('good');
        else if (e.key === '4') handleRate('easy');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFlipped, isFinished, currentCard, practiceMode, isSubmitted, isListening]);

  if (isFinished) {
    const finalCards = Object.values(updatedCardsMap);
    return (
      <div className="max-w-xl mx-auto py-10 px-4 text-center">
        <div className="bg-white dark:bg-slate-800/90 rounded-3xl p-8 sm:p-10 border border-[#E9E4F0] shadow-lg">
          <Mascot mood="cheering" size="lg" message="Tuyệt vời ông mặt trời!" />

          <h2 className="text-3xl font-black text-[#2E241E] mt-4">
            Hoàn Thành Bài Ôn Tập! 🎉
          </h2>
          <p className="text-sm font-semibold text-[#7A6E66] mt-2">
            Bạn vừa ôn xong <strong className="text-[#2E241E]">{cards.length} từ vựng</strong> trong bộ <span className="text-[#FF8A00]">“{deckTitle}”</span>.
          </p>

          <div className="my-6 p-4 bg-linear-to-r from-[#FFF9DB] to-[#FFF3BF] border border-[#FFE066] rounded-2xl flex items-center justify-around">
            <div className="flex flex-col items-center">
              <span className="text-xs font-bold text-[#8C7A5E]">Kinh nghiệm</span>
              <span className="text-2xl font-black text-[#FF8A00] flex items-center gap-1">
                <Sparkles className="w-5 h-5 fill-[#FF8A00]" /> +{xpGained} XP
              </span>
            </div>
            <div className="h-8 w-px bg-[#F5DF87]" />
            <div className="flex flex-col items-center">
              <span className="text-xs font-bold text-[#8C7A5E]">Đã ôn</span>
              <span className="text-2xl font-black text-[#2E241E]">
                {studyQueue.length} từ
              </span>
            </div>
          </div>

          <button
            onClick={() => onFinishSession(finalCards, xpGained)}
            className="w-full py-4 bg-linear-to-r from-[#FF9F1C] to-[#E85D04] hover:from-[#FF8A00] hover:to-[#DC2F02] text-white font-black text-base rounded-2xl shadow-lg shadow-orange-500/25 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
          >
            Lưu Kết Quả & Tiếp Tục
          </button>
        </div>
      </div>
    );
  }

  // If practiceMode === 'mochi', render the authentic MochiStudyView!
  if (practiceMode === 'mochi') {
    return (
      <div className="space-y-4">
        {/* Practice Mode Switcher for Quick Access */}
        <div className="flex items-center justify-end max-w-2xl mx-auto px-3">
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs">
            <button
              onClick={() => setPracticeMode('mochi')}
              className="px-3 py-1.5 bg-white dark:bg-slate-700 shadow-xs text-amber-600 dark:text-amber-400 font-black rounded-xl text-xs flex items-center gap-1 cursor-pointer"
            >
              <span>🐻 We Bare Bears</span>
            </button>
            <button
              onClick={() => setPracticeMode('flip')}
              className="px-3 py-1.5 text-slate-500 rounded-xl text-xs font-bold hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
            >
              <span>Lật Thẻ</span>
            </button>
            <button
              onClick={() => setPracticeMode('typing')}
              className="px-3 py-1.5 text-slate-500 rounded-xl text-xs font-bold hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
            >
              <span>Gõ Từ</span>
            </button>
            <button
              onClick={() => setPracticeMode('speaking')}
              className="px-3 py-1.5 text-slate-500 rounded-xl text-xs font-bold hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
            >
              <span>Luyện Nói</span>
            </button>
          </div>
        </div>

        <MochiStudyView
          cards={cards}
          deckTitle={deckTitle}
          settings={settings}
          onFinishSession={onFinishSession}
          onExit={onExit}
        />
      </div>
    );
  }

  if (!currentCard) return null;

  const isTypingMode = practiceMode === 'typing';
  const intervalPreviews = getRatingIntervalPreviews(currentCard);
  const progressPct = ((currentIndex + 1) / studyQueue.length) * 100;
  const currentLvlInfo = MOCHI_LEVEL_INFO[currentCard.level || 1];

  return (
    <div className="max-w-2xl mx-auto space-y-5 px-3 select-none">
      {/* Top Session Bar */}
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={onExit}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 bg-white dark:bg-slate-800/90 hover:bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 shadow-2xs transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Thoát</span>
        </button>

        {/* Progress bar */}
        <div className="flex-1 max-w-xs">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 mb-1">
            <span>
              Thẻ {currentIndex + 1}/{studyQueue.length}
            </span>
            <span className="text-amber-600 font-extrabold flex items-center gap-1">
              <Sparkles className="w-3 h-3 fill-amber-500" /> +{xpGained} XP
            </span>
          </div>
          <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-linear-to-r from-[#FED770] to-[#FF9F1C] rounded-full transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* Practice Modes Selector */}
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setPracticeMode('mochi')}
            title="Học chuẩn 3 bước phong cách We Bare Bears"
            className="px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          >
            <span>🐻</span>
            <span className="hidden sm:inline">Bears</span>
          </button>

          <button
            onClick={() => setPracticeMode('flip')}
            title="Lật thẻ truyền thống"
            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
              practiceMode === 'flip'
                ? 'bg-white dark:bg-slate-700 shadow-xs text-amber-600 dark:text-amber-400 font-black'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Lật Thẻ</span>
          </button>

          <button
            onClick={() => setPracticeMode('typing')}
            title="Luyện gõ từ và chính tả"
            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
              practiceMode === 'typing'
                ? 'bg-white dark:bg-slate-700 shadow-xs text-amber-600 dark:text-amber-400 font-black'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Keyboard className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Gõ Từ</span>
          </button>

          <button
            onClick={() => setPracticeMode('speaking')}
            title="Luyện nói & chấm điểm phát âm AI"
            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
              practiceMode === 'speaking'
                ? 'bg-cyan-500 text-white shadow-xs font-black'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Mic className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Luyện Nói</span>
          </button>
        </div>

        <Mascot mood={mascotMood} size="sm" />
      </div>

      {/* 3D Flashcard Container */}
      <div
        onClick={() => {
          if (practiceMode === 'typing' && !isFlipped && !isSubmitted) {
            inputRef.current?.focus();
          } else if (practiceMode === 'speaking' && !isFlipped && !isSubmitted) {
            handleStartSpeaking();
          } else {
            handleFlip();
          }
        }}
        className="w-full min-h-[460px] sm:min-h-[500px] perspective-1000 cursor-pointer group"
      >
        <div
          className={`relative w-full h-full min-h-[460px] sm:min-h-[500px] rounded-3xl transition-transform duration-500 transform-style-3d shadow-md hover:shadow-xl ${
            isFlipped ? 'rotate-y-180' : ''
          }`}
        >
          {/* FRONT SIDE */}
          <div className="absolute inset-0 w-full h-full bg-white dark:bg-slate-800/95 rounded-3xl p-5 sm:p-7 border-2 border-[#E9E4F0] dark:border-slate-700 backface-hidden flex flex-col justify-between items-center text-center overflow-y-auto">
            <div className="w-full flex items-center justify-between">
              <span
                className="px-3 py-1 rounded-full text-xs font-black border flex items-center gap-1"
                style={{
                  backgroundColor: currentLvlInfo.bg,
                  color: currentLvlInfo.color,
                  borderColor: currentLvlInfo.borderColor,
                }}
              >
                <span>{currentLvlInfo.emoji}</span>
                <span>{currentLvlInfo.name}</span>
              </span>

              <span className="text-xs font-bold text-slate-400 dark:text-slate-400">
                {(deckTitle || '').replace(/[\x00-\x1f\x7f-\x9f]/g, ' - ').replace(/::/g, ' - ').replace(/\s+-\s+/g, ' - ').trim()}
              </span>
            </div>

            <div className="my-auto space-y-3 w-full py-1">
              {imageUrl && (
                <div className="flex justify-center pointer-events-none">
                  <img src={imageUrl} alt="Flashcard visual" className="max-h-28 sm:max-h-32 rounded-xl shadow-xs object-contain" />
                </div>
              )}

              {practiceMode === 'speaking' ? (
                <div className="space-y-3.5 py-1 w-full" onClick={e => e.stopPropagation()}>
                  <h2 className="text-2xl sm:text-3xl font-black text-[#5B3E06] dark:text-amber-300">
                    {currentCard.back}
                  </h2>
                  {currentCard.example && (
                    <div className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-300 italic px-3">
                      &ldquo;{generateExampleHint(currentCard.example, currentCard.front)}&rdquo;
                    </div>
                  )}
                  <div className="flex items-center justify-center gap-2 flex-wrap">
                    {showPeekAnswer ? (
                      <div className="space-y-0.5 animate-mochi-pop">
                        <div className="text-xl sm:text-2xl font-black text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/80 px-5 py-2 rounded-2xl border-2 border-emerald-400 dark:border-emerald-600 shadow-sm inline-block">
                          {currentCard.front}
                        </div>
                        {currentCard.phonetic && (
                          <div className="text-xs font-mono text-slate-500 dark:text-slate-400 font-bold">
                            {currentCard.phonetic}
                          </div>
                        )}
                      </div>
                    ) : (
                      <h1 className="text-lg sm:text-xl font-bold text-[#A87B32] dark:text-amber-300 tracking-[0.25em] bg-[#FFF8E7] dark:bg-amber-950/40 px-5 py-2 rounded-2xl border-2 border-dashed border-[#FAD67B] dark:border-amber-700/50 inline-block">
                        {generateTypingHint(currentCard.front)}
                      </h1>
                    )}

                    <button
                      type="button"
                      onClick={() => playCardAudio(currentCard.front)}
                      title="Nghe phát âm chuẩn Edge-TTS"
                      className="p-2.5 bg-cyan-100 dark:bg-cyan-950/60 hover:bg-cyan-200 text-cyan-700 dark:text-cyan-300 rounded-2xl transition-all cursor-pointer shadow-xs"
                    >
                      <Volume2 className="w-5 h-5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        soundManager.playClick();
                        setShowPeekAnswer(!showPeekAnswer);
                      }}
                      title="Hiện / Ẩn đáp án từ vựng"
                      className={`px-3 py-2 rounded-2xl text-xs font-black transition-all flex items-center gap-1 cursor-pointer shadow-xs ${
                        showPeekAnswer
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 border border-emerald-300'
                          : 'bg-amber-100 dark:bg-amber-950/60 hover:bg-amber-200 text-amber-800 dark:text-amber-200 border border-amber-300'
                      }`}
                    >
                      <HelpCircle className="w-4 h-4" />
                      <span>{showPeekAnswer ? 'Ẩn Từ' : 'Xem Đáp Án'}</span>
                    </button>
                  </div>

                  {/* Mic Button & Live Recording Waves */}
                  <div className="pt-2">
                    {isListening ? (
                      <div className="space-y-2 animate-fadeIn">
                        <div className="flex items-center justify-center gap-1.5 h-8">
                          {[40, 80, 100, 60, 90, 70, 50].map((h, i) => (
                            <div key={i} style={{ height: `${h}%` }} className="w-1.5 bg-rose-500 rounded-full animate-pulse" />
                          ))}
                        </div>
                        <p className="text-xs font-bold text-rose-600 dark:text-rose-400 animate-pulse">
                          🎙️ Đang nghe... Hãy phát âm từ tiếng Anh!
                        </p>
                        {speakingTranscript && (
                          <div className="text-xs font-semibold text-rose-800 dark:text-rose-200 bg-rose-50 dark:bg-rose-950/60 p-1.5 rounded-xl max-w-xs mx-auto border border-rose-200">
                            &ldquo;{speakingTranscript}&rdquo;
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        <button
                          type="button"
                          onClick={handleStartSpeaking}
                          className="w-16 h-16 rounded-full bg-linear-to-tr from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white flex items-center justify-center mx-auto shadow-lg shadow-cyan-500/30 transition-transform hover:scale-110 active:scale-95 cursor-pointer relative group"
                        >
                          <div className="absolute inset-0 rounded-full bg-cyan-400 animate-ping opacity-25" />
                          <Mic className="w-8 h-8 relative z-10" />
                        </button>
                        <p className="text-[11px] font-bold text-slate-400">
                          Nhấn vào Micro (hoặc phím Space / M) để luyện nói
                        </p>
                      </div>
                    )}
                  </div>

                  {speakingEvaluation && !isListening && (
                    <div className="p-3 bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-700 rounded-2xl text-xs text-amber-900 dark:text-amber-200 max-w-xs mx-auto animate-mochi-pop">
                      <div className="font-extrabold text-sm mb-0.5">{speakingEvaluation.score}% - {speakingEvaluation.feedback}</div>
                      <div>Máy nghe được: <strong>&ldquo;{speakingEvaluation.spokenText}&rdquo;</strong></div>
                    </div>
                  )}

                  {speakingError && !isListening && (
                    <div className="text-xs text-rose-600 font-bold max-w-xs mx-auto">{speakingError}</div>
                  )}
                </div>
              ) : practiceMode === 'typing' ? (
                <>
                  <h2 className="text-2xl sm:text-3xl font-black text-[#5B3E06] dark:text-amber-300">
                    {currentCard.back}
                  </h2>
                  {currentCard.example && (
                    <div className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-300 italic px-3">
                      &ldquo;{generateExampleHint(currentCard.example, currentCard.front)}&rdquo;
                    </div>
                  )}
                  <div className="flex items-center justify-center gap-2 flex-wrap">
                    {showPeekAnswer ? (
                      <div className="space-y-0.5 animate-mochi-pop">
                        <div className="text-xl sm:text-2xl font-black text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/80 px-5 py-2 rounded-2xl border-2 border-emerald-400 dark:border-emerald-600 shadow-sm inline-block">
                          {currentCard.front}
                        </div>
                        {currentCard.phonetic && (
                          <div className="text-xs font-mono text-slate-500 dark:text-slate-400 font-bold">
                            {currentCard.phonetic}
                          </div>
                        )}
                      </div>
                    ) : (
                      <h1 className="text-lg sm:text-xl font-bold text-[#A87B32] dark:text-amber-300 tracking-[0.25em] bg-[#FFF8E7] dark:bg-amber-950/40 px-5 py-2 rounded-2xl border-2 border-dashed border-[#FAD67B] dark:border-amber-700/50 inline-block">
                        {generateTypingHint(currentCard.front)}
                      </h1>
                    )}

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        playCardAudio(currentCard.front);
                      }}
                      title="Nghe phát âm chuẩn Edge-TTS"
                      className="p-2.5 bg-amber-100 dark:bg-amber-950/60 hover:bg-amber-200 text-amber-700 dark:text-amber-300 rounded-2xl transition-all cursor-pointer shadow-xs"
                    >
                      <Volume2 className="w-5 h-5" />
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        soundManager.playClick();
                        const next = !showPeekAnswer;
                        setShowPeekAnswer(next);
                        if (next) {
                          setInputValue(currentCard.front);
                        }
                      }}
                      title="Hiện / Ẩn đáp án từ vựng"
                      className={`px-3 py-2 rounded-2xl text-xs font-black transition-all flex items-center gap-1 cursor-pointer shadow-xs ${
                        showPeekAnswer
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 border border-emerald-300'
                          : 'bg-amber-100 dark:bg-amber-950/60 hover:bg-amber-200 text-amber-800 dark:text-amber-200 border border-amber-300'
                      }`}
                    >
                      <HelpCircle className="w-4 h-4" />
                      <span>{showPeekAnswer ? 'Ẩn Từ' : 'Xem Đáp Án'}</span>
                    </button>
                  </div>

                  <form onSubmit={handleTypeSubmit} onClick={e => e.stopPropagation()} className="w-full max-w-sm mx-auto space-y-2.5 mt-2">
                    <div className="relative flex items-center">
                      <input
                        ref={inputRef}
                        type="text"
                        disabled={isSubmitted || isListening}
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder={isListening ? "🎙️ Đang nghe bạn phát âm..." : "Gõ từ hoặc bấm Micro để nói..."}
                        className={`w-full p-3.5 pl-4 pr-14 text-center font-extrabold text-lg sm:text-xl rounded-2xl border-2 transition-all outline-hidden bg-white dark:bg-slate-700 ${
                          isListening
                            ? 'border-rose-500 ring-2 ring-rose-500/20 text-rose-600 dark:text-rose-300 animate-pulse'
                            : 'border-slate-300 dark:border-slate-500 focus:border-[#FF9F1C] text-slate-800 dark:text-slate-100'
                        } shadow-2xs`}
                      />
                      
                      {/* Integrated Micro Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStartSpeaking();
                        }}
                        title="Bấm vào đây để Luyện nói / Nhận diện giọng nói"
                        className={`absolute right-2 p-2 rounded-xl transition-all cursor-pointer ${
                          isListening
                            ? 'bg-rose-500 text-white animate-bounce shadow-md'
                            : 'bg-cyan-100 dark:bg-cyan-950 hover:bg-cyan-200 text-cyan-700 dark:text-cyan-300 hover:scale-110 active:scale-95'
                        }`}
                      >
                        <Mic className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Prominent Speaking Button below input */}
                    <div className="flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStartSpeaking();
                        }}
                        className={`px-4 py-2 rounded-2xl font-black text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer ${
                          isListening
                            ? 'bg-rose-500 text-white animate-pulse'
                            : 'bg-linear-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white hover:scale-105 active:scale-95'
                        }`}
                      >
                        <Mic className="w-4 h-4" />
                        <span>{isListening ? '🎙️ Đang lắng nghe... Hãy nói!' : '🎙️ Bấm vào đây để Luyện Nói'}</span>
                      </button>
                    </div>

                    {/* Detailed Diagnostic Feedback */}
                    {speakingEvaluation && !isListening && (
                      <div className="p-3.5 bg-white dark:bg-slate-800/95 rounded-2xl border-2 border-amber-300 dark:border-amber-600 shadow-md space-y-2.5 text-center animate-mochi-pop">
                        <div className="flex items-center justify-between">
                          <span className="font-black text-xs sm:text-sm text-slate-800 dark:text-white">
                            Điểm: <strong className={speakingEvaluation.score >= 88 ? 'text-emerald-500' : speakingEvaluation.score >= 70 ? 'text-amber-500' : 'text-rose-500'}>{speakingEvaluation.score}%</strong>
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                            {strictness === 'master' ? 'Chuyên gia (95%)' : strictness === 'strict' ? 'Nghiêm ngặt (88%)' : 'Tiêu chuẩn (80%)'}
                          </span>
                        </div>

                        {/* Letter-by-Letter Alignment Badges */}
                        <div className="flex items-center justify-center gap-1 py-0.5 flex-wrap">
                          {speakingEvaluation.charMatches.map((m, idx) => (
                            <span
                              key={idx}
                              title={m.matched ? 'Phát âm đúng âm này' : 'Chưa đúng hoặc thiếu âm này'}
                              className={`w-7 h-8 rounded-lg font-black text-sm flex items-center justify-center uppercase shadow-2xs border ${
                                m.matched
                                  ? 'bg-emerald-500 text-white border-emerald-600'
                                  : 'bg-rose-500 text-white border-rose-600 animate-pulse'
                              }`}
                            >
                              {m.char}
                            </span>
                          ))}
                        </div>

                        {/* Specific Phonetic Tip */}
                        {speakingEvaluation.tip && (
                          <div className="text-[11px] font-bold text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/60 p-2 rounded-xl border border-amber-200 dark:border-amber-800 text-left">
                            💡 {speakingEvaluation.tip}
                          </div>
                        )}

                        {/* Audio Comparison Controls */}
                        <div className="flex items-center justify-center gap-1.5 pt-1 flex-wrap">
                          <button
                            type="button"
                            onClick={() => playCardAudio(currentCard.front)}
                            className="px-2.5 py-1.5 bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 hover:bg-cyan-100 rounded-xl text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <Volume2 className="w-3 h-3" /> <span>Mẫu Chuẩn</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handlePlaySlowAudio(currentCard.front)}
                            className="px-2.5 py-1.5 bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 hover:bg-amber-100 rounded-xl text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <span>🐢 Chậm 0.7x</span>
                          </button>

                          {speakingEvaluation.audioBlobUrl && (
                            <button
                              type="button"
                              onClick={() => handlePlayUserVoice(speakingEvaluation.audioBlobUrl!)}
                              className="px-2.5 py-1.5 bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 hover:bg-purple-100 rounded-xl text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                            >
                              <span>🎙️ Nghe Lại Giọng Tôi</span>
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {speakingError && !isListening && (
                      <div className="text-xs text-rose-600 font-bold">{speakingError}</div>
                    )}
                  </form>
                </>
              ) : (
                <>
                  <h1 className="text-4xl sm:text-5xl font-black text-[#2D221D] dark:text-white tracking-tight">
                    {currentCard.front}
                  </h1>

                  {currentCard.phonetic && (
                    <div className="text-base sm:text-lg font-mono text-slate-500 dark:text-slate-400 font-semibold tracking-wide">
                      {currentCard.phonetic}
                    </div>
                  )}

                  {currentCard.partOfSpeech && (
                    <span className="inline-block px-3 py-1 rounded-lg text-xs font-bold bg-[#F4F2F9] dark:bg-slate-700 text-[#6A5A80] dark:text-purple-300">
                      {currentCard.partOfSpeech}
                    </span>
                  )}

                  <div className="pt-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        soundManager.playClick();
                        playCardAudio(currentCard.front);
                      }}
                      title="Nghe phát âm (Phím R)"
                      className="p-3.5 bg-linear-to-tr from-[#FFF3D6] to-[#FFE8A3] dark:from-amber-900/60 dark:to-amber-800/60 hover:from-[#FFE8A3] hover:to-[#FFD875] text-[#7A4B00] dark:text-amber-200 rounded-2xl shadow-xs transition-transform hover:scale-110 active:scale-95"
                    >
                      <Volume2 className="w-6 h-6 stroke-[2.5]" />
                    </button>
                  </div>
                </>
              )}
            </div>

            <div className="text-xs font-bold text-slate-400 dark:text-slate-400 flex items-center gap-1.5 group-hover:text-[#FF8A00] transition-colors">
              <RotateCw className="w-3.5 h-3.5" />
              <span>
                {isTypingMode && !isSubmitted
                  ? 'Gõ từ tiếng Anh và nhấn Enter'
                  : 'Chạm vào thẻ hoặc bấm [Space] để xem nghĩa'}
              </span>
            </div>
          </div>

          {/* BACK SIDE */}
          <div className="absolute inset-0 w-full h-full bg-linear-to-b from-white to-[#FAF8FD] dark:from-slate-800/95 dark:to-slate-900/95 rounded-3xl p-6 sm:p-8 border-2 border-[#FED770] dark:border-amber-500/50 rotate-y-180 backface-hidden flex flex-col justify-between text-center overflow-y-auto">
            
            {/* 1. Typing Mode Validation Banner */}
            {isTypingMode && isSubmitted && (
              <div className="w-full mb-3 animate-mochi-pop">
                {isCorrect ? (
                  <div className="py-2.5 px-4 bg-emerald-50 dark:bg-emerald-950/60 border-2 border-emerald-400 dark:border-emerald-700 rounded-2xl flex items-center justify-center gap-2 text-emerald-800 dark:text-emerald-200 font-extrabold text-sm sm:text-base shadow-xs">
                    <span>🎉 Chính xác! Bạn đã gõ đúng: <strong className="underline decoration-2">{currentCard.front}</strong></span>
                  </div>
                ) : inputValue.trim() ? (
                  <div className="py-2.5 px-4 bg-rose-50 dark:bg-rose-950/60 border-2 border-rose-400 dark:border-rose-700 rounded-2xl flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-3 text-rose-800 dark:text-rose-200 font-extrabold text-sm shadow-xs">
                    <div>❌ Bạn đã gõ: <span className="line-through text-rose-600 dark:text-rose-400 bg-white/80 dark:bg-slate-800 px-2 py-0.5 rounded-lg border border-rose-200 dark:border-rose-800">{inputValue}</span></div>
                    <div className="text-emerald-700 dark:text-emerald-300">👉 Đúng: <span className="bg-emerald-100 dark:bg-emerald-900/80 text-emerald-900 dark:text-emerald-100 px-2 py-0.5 rounded-lg border border-emerald-300 dark:border-emerald-700">{currentCard.front}</span></div>
                  </div>
                ) : (
                  <div className="py-2 px-4 bg-amber-50 dark:bg-amber-950/60 border-2 border-amber-300 dark:border-amber-700 rounded-2xl flex items-center justify-center gap-2 text-amber-800 dark:text-amber-200 font-bold text-xs sm:text-sm">
                    <span>💡 Bạn chưa nhập từ • Đáp án đúng: <strong className="text-amber-900 dark:text-amber-100">{currentCard.front}</strong></span>
                  </div>
                )}
              </div>
            )}

            {/* 2. English Word Header */}
            <div className="w-full flex flex-col items-center justify-center gap-1 pb-1">
              <div className="flex items-center gap-2.5">
                <span className="font-black text-2xl sm:text-3xl text-[#2D221D] dark:text-white">
                  {currentCard.front}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    soundManager.playClick();
                    playCardAudio(currentCard.front);
                  }}
                  title="Phát âm"
                  className="p-2 bg-[#FFF3D6] dark:bg-amber-900/60 hover:bg-[#FFE8A3] text-[#7A4B00] dark:text-amber-200 rounded-xl shadow-2xs transition-transform hover:scale-110 active:scale-95"
                >
                  <Volume2 className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
                </button>
              </div>

              {currentCard.phonetic && (
                <span className="text-xs sm:text-sm font-mono text-slate-500 dark:text-slate-400 font-bold">
                  {currentCard.phonetic}
                </span>
              )}
            </div>

            {/* 3. Image & Meaning & Example */}
            <div className="my-auto space-y-3 py-1">
              {imageUrl && (
                <div className="flex justify-center pointer-events-none">
                  <img src={imageUrl} alt="Flashcard visual" className="max-h-28 sm:max-h-32 rounded-xl shadow-xs object-contain" />
                </div>
              )}
              
              <div className="p-3.5 sm:p-4 rounded-2xl bg-linear-to-r from-[#FFF9E6] to-[#FFF4D4] dark:from-amber-950/60 dark:to-orange-950/50 border border-[#FFE8A3] dark:border-amber-700/50 shadow-2xs">
                <h3 className="text-xl sm:text-2xl font-black text-[#5B3E06] dark:text-amber-200">
                  {currentCard.back}
                </h3>
              </div>

              {currentCard.example && (
                <div className="p-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-left shadow-2xs">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                    Ví dụ minh họa
                  </div>
                  <div className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 italic leading-relaxed">
                    &ldquo;{currentCard.example}&rdquo;
                  </div>
                  {currentCard.exampleMeaning && (
                    <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 font-medium">
                      👉 {currentCard.exampleMeaning}
                    </div>
                  )}
                </div>
              )}

              {currentCard.hint && (
                <div className="p-2 bg-purple-50 dark:bg-purple-950/60 rounded-xl border border-purple-100 dark:border-purple-800 text-xs text-purple-800 dark:text-purple-200 font-medium text-left flex items-start gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5 text-purple-500 shrink-0 mt-0.5" />
                  <span>Mẹo nhớ: {currentCard.hint}</span>
                </div>
              )}
            </div>

            <div className="text-[11px] font-bold text-slate-400 mt-2">
              Đánh giá mức độ ghi nhớ (Hoặc bấm Phím 1, 2, 3, 4 / Enter) 👇
            </div>
          </div>
        </div>
      </div>

      {/* SRS Rating Buttons */}
      {isFlipped ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 animate-mochi-pulse">
          <button
            onClick={() => handleRate('again')}
            className="flex flex-col items-center justify-center p-3 rounded-2xl bg-[#FFF0F0] dark:bg-rose-950/50 hover:bg-[#FFE0E0] dark:hover:bg-rose-900/60 border-2 border-[#FFC9C9] dark:border-rose-800 text-[#E03131] dark:text-rose-300 transition-all hover:scale-105 active:scale-95 shadow-xs"
          >
            <div className="flex items-center gap-1">
              <XCircle className="w-4 h-4" />
              <span className="font-extrabold text-sm">Chưa nhớ</span>
            </div>
            <span className="text-[11px] font-bold mt-0.5 opacity-80">
              {intervalPreviews.again} [1]
            </span>
          </button>

          <button
            onClick={() => handleRate('hard')}
            className="flex flex-col items-center justify-center p-3 rounded-2xl bg-[#FFF4E6] dark:bg-orange-950/50 hover:bg-[#FFE8CC] dark:hover:bg-orange-900/60 border-2 border-[#FFD8A8] dark:border-orange-800 text-[#D9480F] dark:text-orange-300 transition-all hover:scale-105 active:scale-95 shadow-xs"
          >
            <div className="flex items-center gap-1">
              <span className="font-extrabold text-sm">Khó</span>
            </div>
            <span className="text-[11px] font-bold mt-0.5 opacity-80">
              {intervalPreviews.hard} [2]
            </span>
          </button>

          <button
            onClick={() => handleRate('good')}
            className="flex flex-col items-center justify-center p-3 rounded-2xl bg-[#EBFBEE] dark:bg-emerald-950/50 hover:bg-[#D3F9D8] dark:hover:bg-emerald-900/60 border-2 border-[#B2F2BB] dark:border-emerald-800 text-[#2B8A3E] dark:text-emerald-300 transition-all hover:scale-105 active:scale-95 shadow-xs"
          >
            <div className="flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" />
              <span className="font-extrabold text-sm">Nhớ tốt</span>
            </div>
            <span className="text-[11px] font-bold mt-0.5 opacity-80">
              {intervalPreviews.good} [3]
            </span>
          </button>

          <button
            onClick={() => handleRate('easy')}
            className="flex flex-col items-center justify-center p-3 rounded-2xl bg-[#E7F5FF] dark:bg-sky-950/50 hover:bg-[#D0EBFF] dark:hover:bg-sky-900/60 border-2 border-[#A5D8FF] dark:border-sky-800 text-[#1971C2] dark:text-sky-300 transition-all hover:scale-105 active:scale-95 shadow-xs"
          >
            <div className="flex items-center gap-1">
              <Zap className="w-4 h-4 fill-current" />
              <span className="font-extrabold text-sm">Dễ ợt</span>
            </div>
            <span className="text-[11px] font-bold mt-0.5 opacity-80">
              {intervalPreviews.easy} [4]
            </span>
          </button>
        </div>
      ) : isTypingMode ? (
        <button
          onClick={handleFlip}
          className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold text-xs rounded-2xl border border-slate-200 transition-all flex items-center justify-center gap-1.5"
        >
          <RotateCw className="w-3.5 h-3.5" />
          <span>Bỏ qua & Xem đáp án (Space)</span>
        </button>
      ) : (
        <button
          onClick={handleFlip}
          className="w-full py-3.5 bg-linear-to-r from-[#FED770] to-[#FFB703] hover:from-[#FFCA3A] hover:to-[#FB8500] text-[#543800] font-black text-base rounded-2xl shadow-md transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
        >
          <RotateCw className="w-5 h-5" />
          <span>Lật Thẻ (Space)</span>
        </button>
      )}
    </div>
  );
};
