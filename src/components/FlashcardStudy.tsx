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
} from 'lucide-react';
import { Mascot } from './Mascot';
import { useMediaUrl } from '../hooks/useMediaUrl';

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
  
  // Typing mode states
  const [isTypingMode, setIsTypingMode] = useState(true);
  const [inputValue, setInputValue] = useState('');
  const inputValueRef = useRef('');
  inputValueRef.current = inputValue;

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

  useEffect(() => {
    if (currentCard && !isFinished) {
      setIsFlipped(false);
      setIsSubmitted(false);
      setInputValue('');
      setMascotMood('thinking');
      if (settings.autoPlayAudio && !isTypingMode) {
        const timer = setTimeout(() => {
          playCardAudio(currentCard.front);
        }, 150);
        return () => clearTimeout(timer);
      }
    }
  }, [currentIndex, currentCard, isFinished, settings.autoPlayAudio, playCardAudio, isTypingMode]);

  const handleFlip = () => {
    soundManager.playFlip();
    if (!isFlipped && isTypingMode && !isSubmitted && currentCard) {
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

    if (!isTypingMode) {
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

  // Auto-advance if typed correctly
  useEffect(() => {
    if (isTypingMode && isSubmitted && isCorrect) {
      const timer = setTimeout(() => {
        handleRate('good');
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isTypingMode, isSubmitted, isCorrect]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isFinished) return;

      const isTypingField = (e.target as HTMLElement)?.tagName === 'INPUT' || (e.target as HTMLElement)?.tagName === 'TEXTAREA';
      
      // If user is currently typing in the input box on front side, don't intercept Enter/Space with global shortcut
      if (isTypingField && !isFlipped) {
        return;
      }

      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        handleFlip();
      } else if (e.key === 'r' || e.key === 'R') {
        if (currentCard) playCardAudio(currentCard.front);
      } else if (isFlipped) {
        if (e.key === '1') handleRate('again');
        else if (e.key === '2') handleRate('hard');
        else if (e.key === '3') handleRate('good');
        else if (e.key === '4') handleRate('easy');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFlipped, isFinished, currentCard, isTypingMode, isSubmitted]);

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
              <span className="text-xs font-bold text-[#8C6D00] uppercase">Điểm thưởng</span>
              <span className="text-2xl font-black text-[#E67700] flex items-center gap-1">
                <Sparkles className="w-5 h-5 fill-[#FAB005]" /> +{xpGained} XP
              </span>
            </div>
            <div className="w-px h-10 bg-[#FFD43B]" />
            <div className="flex flex-col items-center">
              <span className="text-xs font-bold text-[#8C6D00] uppercase">Trí nhớ SRS</span>
              <span className="text-2xl font-black text-[#2B8A3E]">
                {finalCards.filter((c) => c.level >= 3).length}/{finalCards.length || 1}
              </span>
            </div>
          </div>

          <button
            onClick={() => onFinishSession(finalCards, xpGained)}
            className="w-full py-3.5 bg-linear-to-r from-[#FFD13B] to-[#FFAA00] hover:from-[#FFC61A] hover:to-[#E69900] text-[#4A3200] font-black text-base rounded-2xl shadow-md transition-all hover:scale-105 active:scale-95"
          >
            Lưu Tiến Độ & Trở Về Trang Chủ
          </button>
        </div>
      </div>
    );
  }

  if (!currentCard) return null;

  const intervalPreviews = getRatingIntervalPreviews(currentCard);
  const progressPct = (currentIndex / studyQueue.length) * 100;
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

        {/* Typing Mode Toggle */}
        <button
          onClick={() => setIsTypingMode(!isTypingMode)}
          className={`flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl border shadow-2xs transition-all ${
            isTypingMode
              ? 'bg-amber-100 text-amber-800 border-amber-300'
              : 'bg-white text-slate-500 hover:text-slate-800 border-slate-200'
          }`}
        >
          <span>{isTypingMode ? '⌨️ Gõ Từ' : '🎴 Lật Thẻ'}</span>
        </button>

        <Mascot mood={mascotMood} size="sm" />
      </div>

      {/* 3D Flashcard Container */}
      <div
        onClick={handleFlip}
        className="w-full min-h-[460px] sm:min-h-[500px] perspective-1000 cursor-pointer group"
      >
        <div
          className={`relative w-full h-full min-h-[460px] sm:min-h-[500px] rounded-3xl transition-transform duration-500 transform-style-3d shadow-md hover:shadow-xl ${
            isFlipped ? 'rotate-y-180' : ''
          }`}
        >
          {/* FRONT SIDE */}
          <div className="absolute inset-0 w-full h-full bg-white dark:bg-slate-800/90 rounded-3xl p-5 sm:p-7 border-2 border-[#E9E4F0] backface-hidden flex flex-col justify-between items-center text-center overflow-y-auto">
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

              <span className="text-xs font-bold text-slate-400">
                {(deckTitle || '').replace(/[\x00-\x1f\x7f-\x9f]/g, ' - ').replace(/::/g, ' - ').replace(/\s+-\s+/g, ' - ').trim()}
              </span>
            </div>

            <div className="my-auto space-y-3 w-full py-1">
              {imageUrl && (
                <div className="flex justify-center pointer-events-none">
                  <img src={imageUrl} alt="Flashcard visual" className="max-h-28 sm:max-h-32 rounded-xl shadow-xs object-contain" />
                </div>
              )}

              {isTypingMode ? (
                <>
                  <h2 className="text-2xl sm:text-3xl font-black text-[#5B3E06]">
                    {currentCard.back}
                  </h2>
                  {currentCard.example && (
                    <div className="text-xs sm:text-sm font-semibold text-slate-500 italic px-3">
                      &ldquo;{generateExampleHint(currentCard.example, currentCard.front)}&rdquo;
                    </div>
                  )}
                  <h1 className="text-lg sm:text-xl font-bold text-[#A87B32] tracking-[0.25em] bg-[#FFF8E7] px-5 py-2 rounded-2xl border-2 border-dashed border-[#FAD67B] inline-block">
                    {generateTypingHint(currentCard.front)}
                  </h1>
                  <form onSubmit={handleTypeSubmit} onClick={e => e.stopPropagation()} className="w-full max-w-sm mx-auto space-y-2 mt-2">
                    <input
                      type="text"
                      autoFocus
                      disabled={isSubmitted}
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      placeholder="Gõ từ tiếng Anh..."
                      className="w-full p-3.5 text-center font-extrabold text-lg sm:text-xl rounded-2xl border-2 transition-all outline-hidden bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-500 focus:border-[#FF9F1C] text-slate-800 dark:text-slate-100 shadow-2xs"
                    />
                  </form>
                </>
              ) : (
                <>
                  <h1 className="text-4xl sm:text-5xl font-black text-[#2D221D] tracking-tight">
                    {currentCard.front}
                  </h1>

                  {currentCard.phonetic && (
                    <div className="text-base sm:text-lg font-mono text-slate-500 font-semibold tracking-wide">
                      {currentCard.phonetic}
                    </div>
                  )}

                  {currentCard.partOfSpeech && (
                    <span className="inline-block px-3 py-1 rounded-lg text-xs font-bold bg-[#F4F2F9] text-[#6A5A80]">
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
                      className="p-3.5 bg-linear-to-tr from-[#FFF3D6] to-[#FFE8A3] hover:from-[#FFE8A3] hover:to-[#FFD875] text-[#7A4B00] rounded-2xl shadow-xs transition-transform hover:scale-110 active:scale-95"
                    >
                      <Volume2 className="w-6 h-6 stroke-[2.5]" />
                    </button>
                  </div>
                </>
              )}
            </div>

            <div className="text-xs font-bold text-slate-400 flex items-center gap-1.5 group-hover:text-[#FF8A00] transition-colors">
              <RotateCw className="w-3.5 h-3.5" />
              <span>
                {isTypingMode && !isSubmitted
                  ? 'Gõ từ tiếng Anh và nhấn Enter'
                  : 'Chạm vào thẻ hoặc bấm [Space] để xem nghĩa'}
              </span>
            </div>
          </div>

          {/* BACK SIDE */}
          <div className="absolute inset-0 w-full h-full bg-linear-to-b from-white to-[#FAF8FD] rounded-3xl p-6 sm:p-8 border-2 border-[#FED770] rotate-y-180 backface-hidden flex flex-col justify-between text-center overflow-y-auto">
            
            {/* 1. Typing Mode Validation Banner */}
            {isTypingMode && isSubmitted && (
              <div className="w-full mb-3 animate-mochi-pop">
                {isCorrect ? (
                  <div className="py-2.5 px-4 bg-emerald-50 border-2 border-emerald-400 rounded-2xl flex items-center justify-center gap-2 text-emerald-800 font-extrabold text-sm sm:text-base shadow-xs">
                    <span>🎉 Chính xác! Bạn đã gõ đúng: <strong className="underline decoration-2">{currentCard.front}</strong></span>
                  </div>
                ) : inputValue.trim() ? (
                  <div className="py-2.5 px-4 bg-rose-50 border-2 border-rose-400 rounded-2xl flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-3 text-rose-800 font-extrabold text-sm shadow-xs">
                    <div>❌ Bạn đã gõ: <span className="line-through text-rose-600 bg-white/80 px-2 py-0.5 rounded-lg border border-rose-200">{inputValue}</span></div>
                    <div className="text-emerald-700">👉 Đúng: <span className="bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded-lg border border-emerald-300">{currentCard.front}</span></div>
                  </div>
                ) : (
                  <div className="py-2 px-4 bg-amber-50 border-2 border-amber-300 rounded-2xl flex items-center justify-center gap-2 text-amber-800 font-bold text-xs sm:text-sm">
                    <span>💡 Bạn chưa nhập từ • Đáp án đúng: <strong className="text-amber-900">{currentCard.front}</strong></span>
                  </div>
                )}
              </div>
            )}

            {/* 2. English Word Header */}
            <div className="w-full flex flex-col items-center justify-center gap-1 pb-1">
              <div className="flex items-center gap-2.5">
                <span className="font-black text-2xl sm:text-3xl text-[#2D221D]">
                  {currentCard.front}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    soundManager.playClick();
                    playCardAudio(currentCard.front);
                  }}
                  title="Phát âm"
                  className="p-2 bg-[#FFF3D6] hover:bg-[#FFE8A3] text-[#7A4B00] rounded-xl shadow-2xs transition-transform hover:scale-110 active:scale-95"
                >
                  <Volume2 className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
                </button>
              </div>

              {currentCard.phonetic && (
                <span className="text-xs sm:text-sm font-mono text-slate-500 font-bold">
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
              
              <div className="p-3.5 sm:p-4 rounded-2xl bg-linear-to-r from-[#FFF9E6] to-[#FFF4D4] border border-[#FFE8A3] shadow-2xs">
                <h3 className="text-xl sm:text-2xl font-black text-[#5B3E06]">
                  {currentCard.back}
                </h3>
              </div>

              {currentCard.example && (
                <div className="p-3 bg-white rounded-2xl border border-slate-200 text-left shadow-2xs">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                    Ví dụ minh họa
                  </div>
                  <div className="text-xs sm:text-sm font-semibold text-slate-800 italic leading-relaxed">
                    &ldquo;{currentCard.example}&rdquo;
                  </div>
                  {currentCard.exampleMeaning && (
                    <div className="text-[11px] text-slate-600 mt-1 font-medium">
                      👉 {currentCard.exampleMeaning}
                    </div>
                  )}
                </div>
              )}

              {currentCard.hint && (
                <div className="p-2 bg-purple-50 rounded-xl border border-purple-100 text-xs text-purple-800 font-medium text-left flex items-start gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5 text-purple-500 shrink-0 mt-0.5" />
                  <span>Mẹo nhớ: {currentCard.hint}</span>
                </div>
              )}
            </div>

            <div className="text-[11px] font-bold text-slate-400 mt-2">
              Đánh giá mức độ ghi nhớ theo Spaced Repetition bên dưới 👇
            </div>
          </div>
        </div>
      </div>

      {/* SRS Rating Buttons */}
      {isFlipped ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 animate-mochi-pulse">
          <button
            onClick={() => handleRate('again')}
            className="flex flex-col items-center justify-center p-3 rounded-2xl bg-[#FFF0F0] hover:bg-[#FFE0E0] border-2 border-[#FFC9C9] hover:border-[#FFA8A8] text-[#E03131] transition-all hover:scale-105 active:scale-95 shadow-xs"
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
            className="flex flex-col items-center justify-center p-3 rounded-2xl bg-[#FFF4E6] hover:bg-[#FFE8CC] border-2 border-[#FFD8A8] hover:border-[#FFC078] text-[#D9480F] transition-all hover:scale-105 active:scale-95 shadow-xs"
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
            className="flex flex-col items-center justify-center p-3 rounded-2xl bg-[#EBFBEE] hover:bg-[#D3F9D8] border-2 border-[#B2F2BB] hover:border-[#8CE99A] text-[#2B8A3E] transition-all hover:scale-105 active:scale-95 shadow-xs"
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
            className="flex flex-col items-center justify-center p-3 rounded-2xl bg-[#E7F5FF] hover:bg-[#D0EBFF] border-2 border-[#A5D8FF] hover:border-[#74C0FC] text-[#1971C2] transition-all hover:scale-105 active:scale-95 shadow-xs"
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
