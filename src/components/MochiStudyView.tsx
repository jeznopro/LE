import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, UserSettings, SRSRating } from '../types';
import { ttsService } from '../utils/tts';
import { soundManager } from '../utils/sounds';
import confetti from 'canvas-confetti';
import { calculateSRS, getRatingIntervalPreviews } from '../utils/srs';
import { useMediaUrl } from '../hooks/useMediaUrl';
import { X, Volume2, Sparkles, ArrowRight, CheckCircle2 } from 'lucide-react';
import { storage } from '../utils/storage';

interface MochiStudyViewProps {
  cards: Card[];
  deckTitle: string;
  settings: UserSettings;
  onFinishSession: (updatedCards: Card[], xpGained: number) => void;
  onCardReviewed?: (updatedCard: Card, xpGained: number) => void;
  onExit: () => void;
}

type StepType = 'card' | 'dictation' | 'slots';

export const MochiStudyView: React.FC<MochiStudyViewProps> = ({
  cards,
  deckTitle,
  settings,
  onFinishSession,
  onCardReviewed,
  onExit,
}) => {
  const [studyQueue, setStudyQueue] = useState<Card[]>(cards);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [updatedCardsMap, setUpdatedCardsMap] = useState<Record<string, Card>>({});
  const [xpGained, setXpGained] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  // Sequential 3-Step Flow for each word:
  // Step 1: 'card' (Xem Thẻ) -> Step 2: 'dictation' (Nghe & Viết) -> Step 3: 'slots' (Điền Từ) -> Next Word!
  const [currentStep, setCurrentStep] = useState<StepType>('card');
  
  // Step 1: Card flip state
  const [isFlipped, setIsFlipped] = useState(false);

  // Step 2: Dictation state (Nghe và viết lại)
  const [dictationInput, setDictationInput] = useState('');
  const dictationInputRef = useRef<HTMLInputElement>(null);
  const [dictationPassed, setDictationPassed] = useState<boolean | null>(null);

  // Step 3: Letter slots state (Điền từ)
  const [revealedIndices, setRevealedIndices] = useState<number[]>([]);
  const [userLetters, setUserLetters] = useState<string[]>([]);
  const [activeSlotIndex, setActiveSlotIndex] = useState(0);
  const [slotsPassed, setSlotsPassed] = useState<boolean | null>(null);

  // Bottom Sheet Feedback State
  const [showBottomSheet, setShowBottomSheet] = useState(false);
  const [isAnswerCorrect, setIsAnswerCorrect] = useState(false);
  const [showExampleTranslation, setShowExampleTranslation] = useState(false);

  const currentCard = studyQueue[currentIndex];
  const imageUrl = useMediaUrl(currentCard?.image);
  const intervalPreviews = currentCard ? getRatingIntervalPreviews(currentCard) : null;

  // Audio players
  const playNormalAudio = useCallback(
    (text?: string) => {
      const target = text || currentCard?.front;
      if (!target) return;
      soundManager.playClick();
      ttsService.speak(target, settings.ttsAccent, settings.ttsSpeed || 0.9);
    },
    [currentCard, settings.ttsAccent, settings.ttsSpeed]
  );

  const playSlowAudio = useCallback(
    (text?: string) => {
      const target = text || currentCard?.front;
      if (!target) return;
      soundManager.playClick();
      ttsService.speak(target, settings.ttsAccent, 0.6);
    },
    [currentCard, settings.ttsAccent]
  );

  // Normalize helper
  const cleanWord = (s: string) =>
    (s || '').trim().toLowerCase().replace(/[^a-zA-Z0-9]/g, '');

  // Initialize Letter Slots for "Điền từ" (Chỉ hiện 1-2 chữ gợi ý mờ, người học tự gõ nguyên từ)
  const initLetterSlots = useCallback((targetWord: string) => {
    const letters = targetWord.split('');
    const len = letters.length;

    // Chọn 1-2 vị trí để hiển thị CHỮ GỢI Ý MỜ (như Hangman/Mochi)
    const hints: number[] = [];
    if (len >= 4) {
      hints.push(Math.floor(len / 2));
    }
    if (len >= 6) {
      hints.push(len - 1);
    }
    setRevealedIndices(hints);

    // Người học phải gõ nguyên cả từ từ đầu đến cuối -> Toàn bộ ô đều trống!
    const initialUserLetters = letters.map((char) => {
      if (!/[a-zA-Z0-9]/.test(char)) return char;
      return '';
    });
    setUserLetters(initialUserLetters);

    // Con trỏ bắt đầu từ chữ cái đầu tiên (vị trí 0)
    const firstEmpty = initialUserLetters.findIndex((l) => l === '');
    setActiveSlotIndex(firstEmpty !== -1 ? firstEmpty : 0);
  }, []);

  // Reset states on card change (Always starts at Step 1: 'card')
  useEffect(() => {
    if (currentCard && !isFinished) {
      setIsFlipped(false);
      setShowBottomSheet(false);
      setIsAnswerCorrect(false);
      setShowExampleTranslation(false);
      setDictationInput('');
      setCurrentStep('card');
      setDictationPassed(null);
      setSlotsPassed(null);

      initLetterSlots(cleanWord(currentCard.front));

      // Auto play audio on card view if enabled
      if (settings.autoPlayAudio) {
        const timer = setTimeout(() => {
          playNormalAudio(currentCard.front);
        }, 200);
        return () => clearTimeout(timer);
      }
    }
  }, [currentIndex, currentCard, isFinished, settings.autoPlayAudio, initLetterSlots, playNormalAudio]);

  // Focus input on dictation mode
  useEffect(() => {
    if (currentStep === 'dictation' && !showBottomSheet) {
      const timer = setTimeout(() => {
        dictationInputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [currentStep, showBottomSheet]);

  // Keyboard handler for Letter Slots (Gõ nguyên từ): Type letters, Backspace to erase, and ENTER to submit when full!
  useEffect(() => {
    if (currentStep !== 'slots' || showBottomSheet || isFinished || !currentCard) return;

    const handleSlotKeyDown = (e: KeyboardEvent) => {
      const key = e.key;

      // Submit with Enter only when full
      if (key === 'Enter') {
        e.preventDefault();
        const isFull = userLetters.every((l) => l !== '');
        if (isFull) {
          checkSlotsAnswer(userLetters.join(''));
        }
        return;
      }

      // Handle letter key (a-z, 0-9)
      if (/^[a-zA-Z0-9]$/.test(key)) {
        e.preventDefault();
        const nextLetters = [...userLetters];
        nextLetters[activeSlotIndex] = key.toLowerCase();
        setUserLetters(nextLetters);
        soundManager.playClick();

        // Advance to next slot
        if (activeSlotIndex + 1 < nextLetters.length) {
          setActiveSlotIndex(activeSlotIndex + 1);
        }
        return;
      }

      // Backspace handler
      if (key === 'Backspace') {
        e.preventDefault();
        const nextLetters = [...userLetters];
        if (nextLetters[activeSlotIndex] !== '') {
          // Clear current slot
          nextLetters[activeSlotIndex] = '';
          setUserLetters(nextLetters);
        } else if (activeSlotIndex > 0) {
          // Clear previous slot and move cursor back
          nextLetters[activeSlotIndex - 1] = '';
          setUserLetters(nextLetters);
          setActiveSlotIndex(activeSlotIndex - 1);
        }
        return;
      }

      // Arrow navigation
      if (key === 'ArrowLeft') {
        e.preventDefault();
        if (activeSlotIndex > 0) setActiveSlotIndex(activeSlotIndex - 1);
        return;
      }

      if (key === 'ArrowRight') {
        e.preventDefault();
        if (activeSlotIndex < userLetters.length - 1) setActiveSlotIndex(activeSlotIndex + 1);
        return;
      }
    };

    window.addEventListener('keydown', handleSlotKeyDown);
    return () => window.removeEventListener('keydown', handleSlotKeyDown);
  }, [currentStep, showBottomSheet, isFinished, userLetters, activeSlotIndex, currentCard]);

  // Submit Dictation
  const handleDictationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCard || showBottomSheet) return;

    const target = cleanWord(currentCard.front);
    const user = cleanWord(dictationInput);
    const correct = user.length > 0 && user === target;

    setDictationPassed(correct);
    setIsAnswerCorrect(correct);
    setShowBottomSheet(true);

    if (correct) {
      soundManager.playCorrect();
    } else {
      soundManager.playWrong();
    }
  };

  // Check Letter Slots
  const checkSlotsAnswer = (constructedWord: string) => {
    if (!currentCard || showBottomSheet) return;
    const target = cleanWord(currentCard.front);
    const user = cleanWord(constructedWord);
    const correct = user === target;

    setSlotsPassed(correct);
    setIsAnswerCorrect(correct);
    setShowBottomSheet(true);

    if (correct) {
      soundManager.playCorrect();
    } else {
      soundManager.playWrong();
    }
  };

  // Handle rating card directly from Bottom Sheet (Anki 1 - 4 Rating Buttons)
  const handleRateCard = (rating: SRSRating) => {
    soundManager.playClick();
    setShowBottomSheet(false);
    advanceCard(rating);
  };

  // Handle Bottom Sheet "Tiếp Tục": Transitions from Step 2 to Step 3
  const handleBottomSheetContinue = () => {
    soundManager.playClick();
    setShowBottomSheet(false);

    if (currentStep === 'dictation') {
      // Step 2 finished -> Auto advance to Step 3 (Điền Từ)
      setCurrentStep('slots');
    } else if (currentStep === 'slots') {
      // Step 3 finished -> Default to 'good' rating
      advanceCard('good');
    }
  };

  // Global keyboard shortcuts:
  // - Step 1 ('card'): Enter lần 1 = Lật thẻ, Enter lần 2 = Chuyển tiếp sang Bước 2
  // - Bottom Sheet at Step 2: Enter or Space = Tiếp tục sang Bước 3
  // - Bottom Sheet at Step 3: Phím 1, 2, 3, 4 chọn cấp độ ghi nhớ Anki (hoặc Enter = Tốt)
  useEffect(() => {
    const handleGlobalKey = (e: KeyboardEvent) => {
      const isTyping = (e.target as HTMLElement)?.tagName === 'INPUT' || (e.target as HTMLElement)?.tagName === 'TEXTAREA';

      // If bottom sheet is open:
      if (showBottomSheet) {
        if (currentStep === 'dictation') {
          if (e.key === 'Enter' || e.code === 'Space') {
            e.preventDefault();
            handleBottomSheetContinue();
          }
        } else if (currentStep === 'slots') {
          if (e.key === '1') {
            e.preventDefault();
            handleRateCard('again');
          } else if (e.key === '2') {
            e.preventDefault();
            handleRateCard('hard');
          } else if (e.key === '3') {
            e.preventDefault();
            handleRateCard('good');
          } else if (e.key === '4') {
            e.preventDefault();
            handleRateCard('easy');
          } else if (e.key === 'Enter') {
            e.preventDefault();
            handleRateCard('good');
          }
        }
        return;
      }

      // If in Step 1 ('card') and not typing:
      // Enter lần 1 để lật thẻ, Enter lần 2 để chuyển tiếp qua Bước 2
      if (currentStep === 'card' && !isTyping) {
        if (e.code === 'Space') {
          e.preventDefault();
          soundManager.playFlip();
          setIsFlipped((prev) => !prev);
        } else if (e.key === 'Enter') {
          e.preventDefault();
          if (!isFlipped) {
            // Enter lần 1: Lật thẻ
            soundManager.playFlip();
            setIsFlipped(true);
          } else {
            // Enter lần 2: Chuyển tiếp sang Bước 2 (Nghe & Viết)
            soundManager.playClick();
            setCurrentStep('dictation');
          }
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKey);
    return () => window.removeEventListener('keydown', handleGlobalKey);
  }, [showBottomSheet, currentStep, isFlipped, currentCard]);

  // Advance card and calculate SRS - Immediately saved to storage word-by-word!
  // "từ nào xong rồi ko cần học lại": Cards are completed and NEVER repeated in current session!
  const advanceCard = (rating: SRSRating) => {
    if (!currentCard) return;

    const srsRes = calculateSRS(currentCard, rating);
    const updated: Card = {
      ...currentCard,
      ...srsRes,
      lastReview: Date.now(),
    };

    const addXp = rating === 'again' ? 5 : rating === 'easy' ? 20 : 15;

    // 1. Instantly persist updated card to localStorage!
    storage.updateSingleCard(updated);

    // 2. Instantly record review and XP so stats/streak update immediately!
    storage.recordReview(addXp, 1);

    // 3. Notify parent component in real time
    onCardReviewed?.(updated, addXp);

    setUpdatedCardsMap((prev) => ({ ...prev, [updated.id]: updated }));
    setXpGained((prev) => prev + addXp);

    // NOTE: "từ nào xong rồi ko cần học lại" -> Card is NOT repeated in current session!
    if (currentIndex + 1 < studyQueue.length) {
      setCurrentIndex((i) => i + 1);
    } else {
      setIsFinished(true);
      soundManager.playVictory();
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
    }
  };

  // Helper to format example sentence with highlighted target word
  const renderHighlightedExample = (example?: string, word?: string) => {
    if (!example || !word) return example || '';
    const regex = new RegExp(`(${word})`, 'gi');
    const parts = example.split(regex);
    return parts.map((part, i) =>
      part.toLowerCase() === word.toLowerCase() ? (
        <span
          key={i}
          className="font-black underline decoration-2 decoration-amber-500 dark:decoration-amber-400 text-slate-900 dark:text-amber-300"
        >
          {part}
        </span>
      ) : (
        <span key={i} className="text-slate-800 dark:text-slate-100 font-semibold">
          {part}
        </span>
      )
    );
  };

  // Finished Session Screen with We Bare Bears Celebration
  if (isFinished) {
    const finalCards = Object.values(updatedCardsMap);
    return (
      <div className="max-w-xl mx-auto py-10 px-4 text-center select-none animate-fadeIn">
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 sm:p-10 border-2 border-amber-300 dark:border-slate-700 shadow-2xl space-y-5">
          {/* We Bare Bears Celebration Image */}
          <div className="w-56 h-36 mx-auto rounded-3xl overflow-hidden shadow-lg border-2 border-amber-200 dark:border-slate-700 bg-amber-50 dark:bg-slate-800">
            <img
              src="/we_bare_bears_party.png"
              alt="We Bare Bears Celebration"
              className="w-full h-full object-cover"
            />
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            Hoàn Thành Bài Học We Bare Bears! 🎉
          </h2>
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
            Bạn vừa hoàn thành cả 3 bước ôn tập cho <strong className="text-slate-900 dark:text-white">{cards.length} từ vựng</strong> trong bộ <span className="text-amber-600 dark:text-amber-400">“{deckTitle}”</span>.
          </p>

          <div className="my-6 p-4 bg-linear-to-r from-amber-50 to-orange-50 dark:from-slate-800 dark:to-slate-800 border border-amber-200 dark:border-slate-700 rounded-2xl flex items-center justify-around">
            <div className="flex flex-col items-center">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Điểm Thưởng</span>
              <span className="text-2xl font-black text-amber-500 dark:text-amber-400 flex items-center gap-1">
                <Sparkles className="w-5 h-5 fill-amber-500" /> +{xpGained} XP
              </span>
            </div>
            <div className="h-8 w-px bg-amber-200 dark:bg-slate-700" />
            <div className="flex flex-col items-center">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Tổng Số Lượt</span>
              <span className="text-2xl font-black text-slate-900 dark:text-white">
                {studyQueue.length} lượt
              </span>
            </div>
          </div>

          <button
            onClick={() => onFinishSession(finalCards, xpGained)}
            className="w-full py-4 bg-linear-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black text-base rounded-2xl shadow-lg shadow-orange-500/25 transition-all hover:scale-102 active:scale-95 cursor-pointer"
          >
            Lưu Kết Quả & Trở Về
          </button>
        </div>
      </div>
    );
  }

  if (!currentCard) return null;

  const progressPct = Math.min(100, Math.round(((currentIndex) / studyQueue.length) * 100));

  return (
    <div className="max-w-2xl mx-auto space-y-4 px-3 select-none relative pb-32">
      
      {/* 1. Header Bar with Sliding We Bare Bears Avatar (Panda) */}
      <div className="flex items-center gap-3 pt-2 pb-1">
        <button
          onClick={onExit}
          title="Thoát bài học"
          className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
        >
          <X className="w-6 h-6 stroke-[2.5]" />
        </button>

        {/* Sliding Progress Track */}
        <div className="flex-1 relative h-3.5 sm:h-4 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center">
          {/* Progress fill */}
          <div
            className="h-full bg-linear-to-r from-amber-400 via-orange-400 to-amber-500 rounded-full transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />

          {/* Cute We Bare Bears Panda Avatar sliding on track */}
          <div
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 transition-all duration-300 z-10 select-none pointer-events-none"
            style={{ left: `${Math.max(5, Math.min(95, progressPct))}%` }}
          >
            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white dark:border-slate-800 shadow-md bg-white">
              <img
                src="/we_bare_bears_avatar.png"
                alt="We Bare Bears Panda Mascot"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>

        <span className="text-xs font-black text-slate-500 dark:text-slate-300 shrink-0">
          {currentIndex + 1}/{studyQueue.length}
        </span>
      </div>

      {/* 2. Sequential 3-Step Breadcrumb Bar (1. Xem Thẻ ➔ 2. Nghe & Viết ➔ 3. Điền Từ) */}
      <div className="flex items-center justify-center gap-2 py-1 flex-wrap">
        {/* Step 1 Pill */}
        <button
          onClick={() => setCurrentStep('card')}
          className={`flex items-center gap-1 px-3.5 py-1.5 rounded-full text-xs font-extrabold transition-all cursor-pointer ${
            currentStep === 'card'
              ? 'bg-amber-500 text-white shadow-sm scale-105'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <span>🐻</span>
          <span>1. Xem Thẻ</span>
        </button>

        <span className="text-slate-300 dark:text-slate-600 font-bold text-xs">➔</span>

        {/* Step 2 Pill: Nghe & Viết */}
        <button
          onClick={() => setCurrentStep('dictation')}
          className={`flex items-center gap-1 px-3.5 py-1.5 rounded-full text-xs font-extrabold transition-all cursor-pointer ${
            currentStep === 'dictation'
              ? 'bg-amber-500 text-white shadow-sm scale-105'
              : dictationPassed !== null
              ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <span>🎧</span>
          <span>2. Nghe & Viết</span>
          {dictationPassed && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-300" />}
        </button>

        <span className="text-slate-300 dark:text-slate-600 font-bold text-xs">➔</span>

        {/* Step 3 Pill: Điền Từ */}
        <button
          onClick={() => setCurrentStep('slots')}
          className={`flex items-center gap-1 px-3.5 py-1.5 rounded-full text-xs font-extrabold transition-all cursor-pointer ${
            currentStep === 'slots'
              ? 'bg-amber-500 text-white shadow-sm scale-105'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <span>🧩</span>
          <span>3. Điền Từ</span>
        </button>
      </div>

      {/* 3. STEP 1: FLASHCARD CARD (Chạm lật xem từ vựng & câu ví dụ) */}
      {currentStep === 'card' && (
        <div className="space-y-5 animate-fadeIn">
          <div
            onClick={() => {
              soundManager.playFlip();
              setIsFlipped(!isFlipped);
            }}
            className="w-full min-h-[460px] sm:min-h-[500px] bg-white dark:bg-slate-900 rounded-3xl border-2 border-slate-200 dark:border-slate-700 p-6 sm:p-8 shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer flex flex-col justify-between items-center text-center relative group"
          >
            {/* Top Audio Buttons: Normal Yellow Speaker + Cute Snail */}
            <div className="flex items-center justify-center gap-4 z-10" onClick={(e) => e.stopPropagation()}>
              {/* Yellow Speaker Button */}
              <button
                type="button"
                onClick={() => playNormalAudio()}
                title="Nghe phát âm chuẩn"
                className="w-13 h-13 rounded-full bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 shadow-md flex items-center justify-center text-amber-500 hover:scale-108 active:scale-95 transition-all cursor-pointer"
              >
                <Volume2 className="w-6 h-6 stroke-[2.5]" />
              </button>

              {/* Snail Slow-Audio Button (0.6x) */}
              <button
                type="button"
                onClick={() => playSlowAudio()}
                title="Nghe phát âm chậm (0.6x)"
                className="w-13 h-13 rounded-full bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 shadow-md flex items-center justify-center text-2xl hover:scale-108 active:scale-95 transition-all cursor-pointer select-none"
              >
                🐌
              </button>
            </div>

            {/* Card Content: Front vs Back */}
            {!isFlipped ? (
              /* FRONT */
              <div className="my-auto space-y-4 w-full">
                {imageUrl ? (
                  <div className="max-w-xs mx-auto rounded-2xl overflow-hidden shadow-md border-2 border-amber-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                    <img
                      src={imageUrl}
                      alt={currentCard.front}
                      className="w-full h-48 sm:h-52 object-cover"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = '/we_bare_bears.png';
                      }}
                    />
                  </div>
                ) : (
                  <div className="w-56 h-44 mx-auto rounded-3xl overflow-hidden shadow-md border-2 border-amber-200 dark:border-slate-700 bg-amber-50 dark:bg-slate-800 flex items-center justify-center p-2">
                    <img
                      src="/we_bare_bears.png"
                      alt="We Bare Bears Stack"
                      className="w-full h-full object-contain"
                    />
                  </div>
                )}

                {/* Main Word & IPA on Front */}
                <div className="space-y-1">
                  <div className="flex items-center justify-center gap-2 flex-wrap">
                    <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                      {currentCard.front}
                    </h1>
                    {currentCard.partOfSpeech && (
                      <span className="text-xs font-black uppercase px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">
                        {currentCard.partOfSpeech}
                      </span>
                    )}
                  </div>
                  {currentCard.phonetic && (
                    <div className="text-base font-mono text-amber-600 dark:text-amber-300 font-bold">
                      {currentCard.phonetic}
                    </div>
                  )}
                </div>

                {/* Example sentence with underlined bold target word (Crisp white in Dark Mode) */}
                {currentCard.example && (
                  <p className="text-sm sm:text-base font-semibold max-w-md mx-auto leading-relaxed px-4 text-slate-700 dark:text-slate-200 italic">
                    {renderHighlightedExample(currentCard.example, currentCard.front)}
                  </p>
                )}
              </div>
            ) : (
              /* BACK */
              <div className="my-auto space-y-3 w-full animate-fadeIn">
                <div className="flex items-center justify-center gap-2 flex-wrap">
                  <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                    {currentCard.front}
                  </h1>
                  {currentCard.partOfSpeech && (
                    <span className="text-xs font-black uppercase px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">
                      {currentCard.partOfSpeech}
                    </span>
                  )}
                </div>

                {currentCard.phonetic && (
                  <div className="text-base sm:text-lg font-mono text-amber-600 dark:text-amber-300 font-bold">
                    {currentCard.phonetic}
                  </div>
                )}

                <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 pt-1">
                  👉 {currentCard.back}
                </div>

                {currentCard.exampleMeaning && (
                  <div className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300 italic max-w-md mx-auto pt-1">
                    &ldquo;{currentCard.exampleMeaning}&rdquo;
                  </div>
                )}

                {currentCard.relatedWords && (
                  <div className="text-xs sm:text-sm font-semibold text-purple-600 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/40 px-3 py-1.5 rounded-xl border border-purple-200 dark:border-purple-800 max-w-md mx-auto mt-2">
                    🔗 <span className="font-bold">Từ liên quan:</span> {currentCard.relatedWords}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sequential Advance Button to Step 2 */}
          <div className="flex items-center justify-center pt-2">
            {!isFlipped ? (
              <button
                type="button"
                onClick={() => {
                  soundManager.playFlip();
                  setIsFlipped(true);
                }}
                className="w-full sm:w-auto px-10 py-4 bg-linear-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-2xl font-black text-base shadow-lg shadow-orange-500/25 transition-all hover:scale-105 active:scale-95 cursor-pointer flex items-center justify-center gap-2.5"
              >
                <span>Lật Thẻ Xem Nghĩa (Enter lần 1)</span>
                <span className="text-xl">🔄</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  soundManager.playClick();
                  setCurrentStep('dictation');
                }}
                className="w-full sm:w-auto px-10 py-4 bg-linear-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-2xl font-black text-base shadow-lg shadow-orange-500/25 transition-all hover:scale-105 active:scale-95 cursor-pointer flex items-center justify-center gap-2.5"
              >
                <span>Bắt Đầu Luyện Tập ➔ Bước 2: Nghe & Viết (Enter lần 2)</span>
                <ArrowRight className="w-5 h-5 stroke-[2.5]" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* 4. STEP 2: "NGHE VÀ VIẾT LẠI" (Dictation) */}
      {currentStep === 'dictation' && (
        <div className="space-y-8 text-center py-6 animate-fadeIn">
          <div className="space-y-1">
            <span className="px-3 py-1 bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 rounded-full text-xs font-black">
              Bước 2/3: Luyện Phản Xạ Nghe
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white pt-1">
              Nghe và viết lại
            </h2>
          </div>

          {/* Center Audio Buttons */}
          <div className="flex items-center justify-center gap-5">
            {/* Big Yellow Speaker Button */}
            <button
              type="button"
              onClick={() => playNormalAudio()}
              title="Nghe chuẩn"
              className="w-20 h-20 rounded-full bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 shadow-lg flex items-center justify-center text-amber-500 hover:scale-110 active:scale-95 transition-all cursor-pointer"
            >
              <Volume2 className="w-10 h-10 stroke-[2.5]" />
            </button>

            {/* Snail Slow-Audio Button */}
            <button
              type="button"
              onClick={() => playSlowAudio()}
              title="Nghe chậm (0.6x)"
              className="w-16 h-16 rounded-full bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 shadow-md flex items-center justify-center text-3xl hover:scale-110 active:scale-95 transition-all cursor-pointer select-none"
            >
              🐌
            </button>
          </div>

          {/* Input Box with Crisp Green Border Focus & Dark Mode High Contrast */}
          <form onSubmit={handleDictationSubmit} className="max-w-md mx-auto space-y-4">
            <input
              ref={dictationInputRef}
              type="text"
              value={dictationInput}
              onChange={(e) => setDictationInput(e.target.value)}
              placeholder="Gõ lại từ bạn nghe được"
              autoFocus
              className="w-full p-4 rounded-2xl border-2 border-emerald-500 dark:border-emerald-400 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-extrabold text-lg sm:text-xl focus:outline-none focus:ring-4 focus:ring-emerald-200 dark:focus:ring-emerald-950/60 transition-all text-center shadow-sm placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />

            <button
              type="submit"
              disabled={!dictationInput.trim()}
              className="w-full py-4 bg-linear-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 disabled:opacity-40 text-white font-black text-base rounded-2xl shadow-md transition-all hover:scale-102 active:scale-95 cursor-pointer"
            >
              Kiểm Tra (Enter)
            </button>
          </form>
        </div>
      )}

      {/* 5. STEP 3: "ĐIỀN TỪ" (Letter Slots with Arrow Pointer) */}
      {currentStep === 'slots' && (
        <div className="space-y-8 text-center py-6 animate-fadeIn">
          <div className="space-y-1">
            <span className="px-3 py-1 bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 rounded-full text-xs font-black">
              Bước 3/3: Khắc Sâu Trí Nhớ
            </span>
            <div className="text-xs font-bold text-slate-500 dark:text-slate-400 pt-1">
              Điền từ tương ứng với nghĩa:
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              {currentCard.back} {currentCard.partOfSpeech && <span className="text-slate-500 dark:text-slate-400 text-xl font-bold">({currentCard.partOfSpeech})</span>}
            </h2>
          </div>

          {/* Letter Slots Box (High Contrast in Dark Mode) */}
          <div className="max-w-md mx-auto p-6 sm:p-8 bg-white dark:bg-slate-900 rounded-3xl border-2 border-slate-200 dark:border-slate-700 shadow-xl space-y-3">
            <div className="flex items-center justify-center gap-2 sm:gap-3 flex-wrap">
              {userLetters.map((letter, idx) => {
                const targetChar = cleanWord(currentCard.front)[idx] || '';
                const isHint = revealedIndices.includes(idx);
                const isActive = activeSlotIndex === idx;

                return (
                  <div
                    key={idx}
                    onClick={() => setActiveSlotIndex(idx)}
                    className="flex flex-col items-center cursor-pointer select-none group"
                  >
                    {/* Letter Character or Ghost hint (Chỉ hiện chữ mờ ở ô gợi ý) */}
                    <div className="w-8 sm:w-10 text-center text-xl sm:text-2xl font-black min-h-[36px] flex items-center justify-center">
                      {letter ? (
                        <span className="text-slate-900 dark:text-white transition-all transform scale-105">
                          {letter}
                        </span>
                      ) : isHint ? (
                        // Chỉ ô gợi ý mới hiện chữ mờ mờ
                        <span className="text-slate-400/45 dark:text-slate-500/55 select-none transition-opacity font-black">
                          {targetChar}
                        </span>
                      ) : (
                        // Các ô khác để trống hoàn toàn (chỉ có gạch chân)
                        <span className="opacity-0 select-none pointer-events-none">
                          {targetChar}
                        </span>
                      )}
                    </div>

                    {/* Underline Dash */}
                    <div
                      className={`w-7 sm:w-9 h-1 rounded-full transition-all duration-200 ${
                        isActive
                          ? 'bg-amber-500 dark:bg-amber-400 h-1.5 shadow-xs'
                          : letter
                          ? 'bg-slate-700 dark:bg-slate-300'
                          : isHint
                          ? 'bg-slate-400/60 dark:bg-slate-500/60'
                          : 'bg-slate-200 dark:bg-slate-700'
                      }`}
                    />

                    {/* Active Cursor Arrow Pointer ▲ */}
                    <div className="h-5 flex items-center justify-center">
                      {isActive && (
                        <span className="text-amber-500 dark:text-amber-400 text-sm font-black animate-bounce">
                          ▲
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold pt-1">
              Nhìn chữ gợi ý mờ và gõ nguyên toàn bộ từ (Backspace để xóa)
            </p>

            {/* Submit Button for Letter Slots (Only submits when full and Enter pressed) */}
            <div className="pt-2">
              {userLetters.every((l) => l !== '') ? (
                <button
                  type="button"
                  onClick={() => checkSlotsAnswer(userLetters.join(''))}
                  className="w-full py-3.5 bg-linear-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black text-sm rounded-2xl shadow-md transition-all hover:scale-102 active:scale-95 cursor-pointer animate-pulse"
                >
                  Nộp Bài & Kiểm Tra (Enter) ➔
                </button>
              ) : (
                <div className="text-xs text-slate-400 dark:text-slate-500 font-bold py-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                  Gõ đủ tất cả các chữ cái rồi nhấn <kbd className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded font-mono font-black">Enter</kbd> để nộp bài
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 6. WE BARE BEARS BOTTOM SHEET FEEDBACK */}
      {showBottomSheet && (
        <div
          className={`fixed bottom-0 left-0 right-0 z-50 p-5 sm:p-7 shadow-2xl transition-all duration-300 animate-slideUp text-white ${
            isAnswerCorrect ? 'bg-[#10B981]' : 'bg-[#F05151]'
          }`}
        >
          {/* We Bare Bears Peeking Illustration on top border */}
          <div className="absolute -top-14 sm:-top-16 left-6 sm:left-12 flex items-center select-none pointer-events-none">
            <img
              src="/we_bare_bears_peeking.png"
              alt="We Bare Bears Peeking"
              className="h-16 sm:h-20 w-auto drop-shadow-xl animate-bounce"
            />
          </div>

          <div className="max-w-2xl mx-auto space-y-4">
            {/* Top row with Speaker, Word, Phonetic, Meaning */}
            <div className="flex items-start gap-4">
              <button
                type="button"
                onClick={() => playNormalAudio()}
                title="Nghe phát âm"
                className="w-14 h-14 rounded-full bg-white text-amber-500 shadow-md flex items-center justify-center shrink-0 hover:scale-105 active:scale-95 transition-transform cursor-pointer"
              >
                <Volume2 className="w-7 h-7 stroke-[2.5]" />
              </button>

              <div className="space-y-1 flex-1">
                <div className="text-2xl sm:text-3xl font-black flex items-center gap-2">
                  <span>{currentCard.front}</span>
                  {currentCard.partOfSpeech && (
                    <span className="text-lg opacity-90 font-bold">({currentCard.partOfSpeech})</span>
                  )}
                </div>

                {currentCard.phonetic && (
                  <div className="text-sm font-mono opacity-90 font-semibold text-amber-100">
                    {currentCard.phonetic}
                  </div>
                )}

                <div className="text-lg font-extrabold pt-0.5">
                  {currentCard.back}
                </div>
              </div>
            </div>

            {/* Example sentence & Translation Button [ 文A ] */}
            {currentCard.example && (
              <div className="pt-2 border-t border-white/20 space-y-1.5">
                <p className="text-sm sm:text-base font-semibold leading-relaxed">
                  {currentCard.example}
                </p>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowExampleTranslation(!showExampleTranslation)}
                    className="p-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                    title="Xem bản dịch câu ví dụ"
                  >
                    <span>文A</span>
                    <span className="text-[11px]">{showExampleTranslation ? 'Ẩn dịch' : 'Dịch câu'}</span>
                  </button>

                  {showExampleTranslation && currentCard.exampleMeaning && (
                    <span className="text-xs opacity-90 italic">
                      {currentCard.exampleMeaning}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Sequential Action Button on Bottom Sheet */}
            <div className="pt-2">
              {currentStep === 'dictation' ? (
                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={handleBottomSheetContinue}
                    className="w-full sm:w-auto px-16 py-3.5 bg-white text-slate-950 hover:bg-slate-100 font-black text-base rounded-full shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer"
                  >
                    Tiếp Tục ➔ Bước 3: Điền Từ 🧩 (Enter)
                  </button>
                </div>
              ) : (
                /* STEP 3 (Điền Từ) Finished -> 4 CON SỐ GHI NHỚ ANKI (1 - 4) */
                <div className="space-y-2.5">
                  <div className="text-center text-xs font-black tracking-wide text-white/90">
                    ĐÁNH GIÁ MỨC ĐỘ GHI NHỚ THEO CHUẨN ANKI (Bấm phím 1 - 4):
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {/* 1. Chưa Nhớ / Again */}
                    <button
                      type="button"
                      onClick={() => handleRateCard('again')}
                      className="p-3 bg-red-500/90 hover:bg-red-600 active:scale-95 border border-red-300/40 rounded-2xl text-white transition-all shadow-md flex flex-col items-center justify-center gap-1 cursor-pointer group"
                    >
                      <div className="flex items-center gap-1.5 text-xs font-black">
                        <span className="w-5 h-5 rounded-md bg-white/20 flex items-center justify-center font-mono">1</span>
                        <span>Chưa Nhớ</span>
                      </div>
                      <span className="text-[11px] font-bold text-red-100">
                        {intervalPreviews?.again || '< 10 phút'} • Cấp 1 🌱
                      </span>
                    </button>

                    {/* 2. Khó / Hard */}
                    <button
                      type="button"
                      onClick={() => handleRateCard('hard')}
                      className="p-3 bg-amber-500/90 hover:bg-amber-600 active:scale-95 border border-amber-300/40 rounded-2xl text-white transition-all shadow-md flex flex-col items-center justify-center gap-1 cursor-pointer group"
                    >
                      <div className="flex items-center gap-1.5 text-xs font-black">
                        <span className="w-5 h-5 rounded-md bg-white/20 flex items-center justify-center font-mono">2</span>
                        <span>Khó</span>
                      </div>
                      <span className="text-[11px] font-bold text-amber-100">
                        {intervalPreviews?.hard || '1 ngày'} • Cấp 2 🌿
                      </span>
                    </button>

                    {/* 3. Tốt / Good */}
                    <button
                      type="button"
                      onClick={() => handleRateCard('good')}
                      className="p-3 bg-emerald-600 hover:bg-emerald-700 active:scale-95 border border-emerald-300/40 rounded-2xl text-white transition-all shadow-md flex flex-col items-center justify-center gap-1 cursor-pointer group ring-2 ring-white/60"
                    >
                      <div className="flex items-center gap-1.5 text-xs font-black">
                        <span className="w-5 h-5 rounded-md bg-white/20 flex items-center justify-center font-mono">3</span>
                        <span>Tốt (Chuẩn)</span>
                      </div>
                      <span className="text-[11px] font-bold text-emerald-100">
                        {intervalPreviews?.good || '3 ngày'} • Cấp 3 🌸
                      </span>
                    </button>

                    {/* 4. Dễ / Easy */}
                    <button
                      type="button"
                      onClick={() => handleRateCard('easy')}
                      className="p-3 bg-sky-500/90 hover:bg-sky-600 active:scale-95 border border-sky-300/40 rounded-2xl text-white transition-all shadow-md flex flex-col items-center justify-center gap-1 cursor-pointer group"
                    >
                      <div className="flex items-center gap-1.5 text-xs font-black">
                        <span className="w-5 h-5 rounded-md bg-white/20 flex items-center justify-center font-mono">4</span>
                        <span>Dễ</span>
                      </div>
                      <span className="text-[11px] font-bold text-sky-100">
                        {intervalPreviews?.easy || '4 ngày'} • Cấp 4/5 💎
                      </span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
