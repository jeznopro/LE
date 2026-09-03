import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, UserSettings } from '../types';
import { ttsService } from '../utils/tts';
import { soundManager } from '../utils/sounds';
import confetti from 'canvas-confetti';
import { Volume2, ArrowLeft, CheckCircle2, XCircle, Sparkles } from 'lucide-react';
import { storage } from '../utils/storage';
import { calculateSRS } from '../utils/srs';

interface QuizStudyProps {
  cards: Card[];
  allCards: Card[];
  deckTitle: string;
  settings: UserSettings;
  onFinish: (xpGained: number) => void;
  onExit: () => void;
}

interface Question {
  card: Card;
  options: string[];
  correctIndex: number;
}

export const QuizStudy: React.FC<QuizStudyProps> = ({
  cards,
  allCards,
  deckTitle,
  settings,
  onFinish,
  onExit,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [totalXpGained, setTotalXpGained] = useState(0);

  const questions: Question[] = useMemo(() => {
    const pool = Array.from(new Set(allCards.map((c) => c.back))).filter(Boolean);

    return cards.map((card) => {
      const distractors = pool.filter((meaning) => meaning !== card.back);
      const shuffledDistractors = [...distractors].sort(() => 0.5 - Math.random()).slice(0, 3);
      
      const fallbacks = [
        'Thực hiện, hoàn thành',
        'Phát triển, mở rộng',
        'Quan sát, theo dõi',
        'Quan trọng, thiết yếu',
        'Cung cấp, đáp ứng',
        'Khám phá, phát hiện'
      ];
      while (shuffledDistractors.length < 3) {
        const fb = fallbacks.find((f) => f !== card.back && !shuffledDistractors.includes(f));
        if (fb) shuffledDistractors.push(fb);
        else shuffledDistractors.push(`Đáp án khác ${shuffledDistractors.length + 1}`);
      }

      const options = [card.back, ...shuffledDistractors].sort(() => 0.5 - Math.random());
      const correctIndex = options.indexOf(card.back);

      return {
        card,
        options,
        correctIndex,
      };
    });
  }, [cards, allCards]);

  const currentQ = questions[currentIndex];

  const handleSpeakNormal = useCallback(() => {
    if (currentQ) {
      soundManager.playClick();
      ttsService.speak(currentQ.card.front, settings.ttsAccent, settings.ttsSpeed || 0.9);
    }
  }, [currentQ, settings]);

  const handleSpeakSlow = useCallback(() => {
    if (currentQ) {
      soundManager.playClick();
      ttsService.speak(currentQ.card.front, settings.ttsAccent, 0.6);
    }
  }, [currentQ, settings]);

  useEffect(() => {
    if (currentQ && !isFinished) {
      setSelectedOption(null);
      setIsAnswered(false);
      if (settings.autoPlayAudio) {
        ttsService.speak(currentQ.card.front, settings.ttsAccent, settings.ttsSpeed || 0.9);
      }
    }
  }, [currentIndex, currentQ, isFinished, settings]);

  const handleSelectOption = useCallback((idx: number) => {
    if (isAnswered || !currentQ) return;

    setSelectedOption(idx);
    setIsAnswered(true);

    const isCorrect = idx === currentQ.correctIndex;
    const addXp = isCorrect ? 10 : 5;
    setTotalXpGained((x) => x + addXp);

    if (isCorrect) {
      soundManager.playCorrect();
      setScore((s) => s + 1);
    } else {
      soundManager.playWrong();
    }

    // 1. Immediately persist this card to localStorage word-by-word!
    const srsRes = calculateSRS(currentQ.card, isCorrect ? 'good' : 'again');
    const updatedCard: Card = {
      ...currentQ.card,
      ...srsRes,
      lastReview: Date.now(),
    };
    storage.updateSingleCard(updatedCard);

    // 2. Immediately record review and XP in stats!
    storage.recordReview(addXp, 1);

    setTimeout(() => {
      if (currentIndex + 1 < questions.length) {
        setCurrentIndex((i) => i + 1);
      } else {
        setIsFinished(true);
        soundManager.playVictory();
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
      }
    }, 1100);
  }, [isAnswered, currentQ, currentIndex, questions.length]);

  // Keyboard shortcuts (1, 2, 3, 4 or A, B, C, D)
  useEffect(() => {
    if (isAnswered || isFinished || !currentQ) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const isTyping = (e.target as HTMLElement)?.tagName === 'INPUT' || (e.target as HTMLElement)?.tagName === 'TEXTAREA';
      if (isTyping) return;

      const key = e.key.toLowerCase();
      if (key === '1' || key === 'a') {
        e.preventDefault();
        handleSelectOption(0);
      } else if (key === '2' || key === 'b') {
        e.preventDefault();
        handleSelectOption(1);
      } else if (key === '3' || key === 'c') {
        e.preventDefault();
        handleSelectOption(2);
      } else if (key === '4' || key === 'd') {
        e.preventDefault();
        handleSelectOption(3);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSelectOption, isAnswered, isFinished, currentQ]);

  // Finished Session Screen with We Bare Bears Celebration
  if (isFinished) {
    return (
      <div className="max-w-md mx-auto py-10 px-4 text-center select-none animate-fadeIn">
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border-2 border-purple-200 dark:border-slate-700 shadow-xl space-y-4">
          <div className="w-52 h-32 mx-auto rounded-2xl overflow-hidden shadow-md border border-purple-200 dark:border-slate-700 bg-purple-50 dark:bg-slate-800">
            <img
              src="/we_bare_bears_party.png"
              alt="We Bare Bears Celebration"
              className="w-full h-full object-cover"
            />
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white pt-2">
            Hoàn Thành Trắc Nghiệm! 🎯
          </h2>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Bộ thẻ: <span className="font-bold text-purple-600 dark:text-purple-400">{deckTitle}</span>
          </p>

          <div className="my-5 p-4 bg-purple-50 dark:bg-slate-800 border border-purple-200 dark:border-purple-800/60 rounded-2xl flex items-center justify-around">
            <div>
              <div className="text-xs font-bold text-slate-500 dark:text-slate-400">CHÍNH XÁC</div>
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {score}/{questions.length}
              </div>
            </div>
            <div className="w-px h-10 bg-purple-200 dark:bg-slate-700" />
            <div>
              <div className="text-xs font-bold text-slate-500 dark:text-slate-400">ĐIỂM THƯỞNG</div>
              <div className="text-2xl font-black text-amber-500 dark:text-amber-400 flex items-center gap-1 justify-center">
                <Sparkles className="w-5 h-5 fill-amber-500" /> +{totalXpGained} XP
              </div>
            </div>
          </div>

          <button
            onClick={() => onFinish(totalXpGained)}
            className="w-full py-3.5 bg-linear-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-black text-base rounded-2xl shadow-md transition-all hover:scale-102 active:scale-95 cursor-pointer"
          >
            Nhận Thưởng & Hoàn Thành
          </button>
        </div>
      </div>
    );
  }

  if (!currentQ) return null;

  const progressPct = ((currentIndex + 1) / questions.length) * 100;

  return (
    <div className="max-w-xl mx-auto space-y-6 px-4 select-none">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-4 pt-2">
        <button
          onClick={onExit}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 dark:text-slate-300 dark:hover:text-white bg-white dark:bg-slate-800 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs cursor-pointer transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Thoát</span>
        </button>

        <div className="flex-1 max-w-xs">
          <div className="flex justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
            <span>
              Câu {currentIndex + 1}/{questions.length}
            </span>
            <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">Đúng: {score}</span>
          </div>
          <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-linear-to-r from-purple-500 to-indigo-500 rounded-full transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        <div className="flex items-center gap-1 text-xs font-black text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60 px-2.5 py-1.5 rounded-xl border border-purple-200 dark:border-purple-800">
          <span>🎯</span>
          <span>Trắc Nghiệm</span>
        </div>
      </div>

      {/* Question Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border-2 border-slate-200 dark:border-slate-700 shadow-lg text-center space-y-3">
        <div className="text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">
          Chọn nghĩa đúng của từ vựng:
        </div>

        <div className="flex items-center justify-center gap-3 my-2">
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            {currentQ.card.front}
          </h2>
          
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleSpeakNormal}
              title="Nghe chuẩn"
              className="p-2.5 bg-amber-50 dark:bg-slate-800 hover:bg-amber-100 dark:hover:bg-slate-700 text-amber-600 dark:text-amber-400 rounded-2xl transition-all cursor-pointer shadow-2xs"
            >
              <Volume2 className="w-5 h-5" />
            </button>
            <button
              onClick={handleSpeakSlow}
              title="Nghe chậm (0.6x)"
              className="p-2.5 bg-amber-50 dark:bg-slate-800 hover:bg-amber-100 dark:hover:bg-slate-700 rounded-2xl transition-all cursor-pointer shadow-2xs text-lg select-none"
            >
              🐌
            </button>
          </div>
        </div>

        {currentQ.card.phonetic && (
          <div className="text-sm font-mono text-amber-600 dark:text-amber-300 font-bold">
            {currentQ.card.phonetic}
          </div>
        )}
      </div>

      {/* 4 Choices */}
      <div className="grid grid-cols-1 gap-3">
        {currentQ.options.map((option, idx) => {
          let btnStyle = 'bg-white dark:bg-slate-900 hover:bg-purple-50/50 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100';

          if (isAnswered) {
            if (idx === currentQ.correctIndex) {
              btnStyle = 'bg-emerald-50 dark:bg-emerald-950/80 border-emerald-500 text-emerald-800 dark:text-emerald-200 ring-2 ring-emerald-400 shadow-sm';
            } else if (idx === selectedOption) {
              btnStyle = 'bg-rose-50 dark:bg-rose-950/80 border-rose-500 text-rose-800 dark:text-rose-200';
            } else {
              btnStyle = 'bg-white dark:bg-slate-900 opacity-40 border-slate-200 dark:border-slate-800 text-slate-400';
            }
          }

          return (
            <button
              key={idx}
              disabled={isAnswered}
              onClick={() => handleSelectOption(idx)}
              className={`w-full p-4 rounded-2xl border-2 font-extrabold text-base text-left transition-all flex items-center justify-between cursor-pointer ${btnStyle} ${
                !isAnswered ? 'hover:scale-[1.01] active:scale-98' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-black text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600 font-mono">
                  {idx + 1}
                </span>
                <span>{option}</span>
              </div>

              {isAnswered && idx === currentQ.correctIndex && (
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              )}
              {isAnswered && idx === selectedOption && idx !== currentQ.correctIndex && (
                <XCircle className="w-5 h-5 text-rose-500" />
              )}
            </button>
          );
        })}
      </div>

      <p className="text-center text-xs text-slate-400 dark:text-slate-500 font-semibold pt-1">
        Phím tắt: Bấm <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded font-mono text-[10px]">1</kbd>, <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded font-mono text-[10px]">2</kbd>, <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded font-mono text-[10px]">3</kbd>, <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded font-mono text-[10px]">4</kbd> để chọn đáp án
      </p>
    </div>
  );
};
