import React, { useState, useEffect, useRef } from 'react';
import { Card, UserSettings } from '../types';
import { ttsService } from '../utils/tts';
import { soundManager } from '../utils/sounds';
import confetti from 'canvas-confetti';
import {
  Volume2,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ArrowRight,
} from 'lucide-react';
import { Mascot } from './Mascot';

interface TypingStudyProps {
  cards: Card[];
  deckTitle: string;
  settings: UserSettings;
  onFinish: (xpGained: number) => void;
  onExit: () => void;
}

export const TypingStudy: React.FC<TypingStudyProps> = ({
  cards,
  deckTitle: _deckTitle,
  settings,
  onFinish,
  onExit,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [inputValue, setInputValue] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [hintLevel, setHintLevel] = useState(0);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [mascotMood, setMascotMood] = useState<'happy' | 'thinking' | 'cheering' | 'surprised'>('happy');

  const inputRef = useRef<HTMLInputElement>(null);
  const currentCard = cards[currentIndex];

  useEffect(() => {
    if (currentCard && !isFinished) {
      setInputValue('');
      setIsSubmitted(false);
      setIsCorrect(false);
      setHintLevel(0);
      setMascotMood('thinking');
      setTimeout(() => inputRef.current?.focus(), 100);

      if (settings.autoPlayAudio) {
        ttsService.speak(currentCard.front, settings.ttsAccent, settings.ttsSpeed);
      }
    }
  }, [currentIndex, currentCard, isFinished, settings]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isSubmitted || !currentCard) return;

    const trimmedInput = inputValue.trim().toLowerCase();
    const target = currentCard.front.trim().toLowerCase();
    const correct = trimmedInput === target;

    setIsSubmitted(true);
    setIsCorrect(correct);

    if (correct) {
      soundManager.playCorrect();
      setMascotMood('cheering');
      setScore((s) => s + 1);
    } else {
      soundManager.playWrong();
      setMascotMood('surprised');
    }
  };

  const handleNext = () => {
    if (currentIndex + 1 < cards.length) {
      setCurrentIndex((i) => i + 1);
    } else {
      setIsFinished(true);
      soundManager.playVictory();
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    }
  };

  const handleHint = () => {
    if (!currentCard || hintLevel >= currentCard.front.length) return;
    soundManager.playClick();
    setHintLevel((h) => h + 1);
    setInputValue(currentCard.front.slice(0, hintLevel + 1));
    inputRef.current?.focus();
  };

  const handleSpeak = () => {
    if (currentCard) {
      soundManager.playClick();
      ttsService.speak(currentCard.front, settings.ttsAccent, settings.ttsSpeed);
    }
  };

  if (isFinished) {
    const xpGained = score * 12;
    return (
      <div className="max-w-md mx-auto py-10 px-4 text-center">
        <div className="bg-white rounded-3xl p-8 border border-[#E9E4F0] shadow-lg">
          <Mascot mood="cheering" size="lg" message="Kỹ năng gõ siêu chuẩn!" />

          <h2 className="text-2xl sm:text-3xl font-black text-[#2E241E] mt-4">
            Hoàn Thành Luyện Gõ! ⌨️
          </h2>

          <div className="my-6 p-4 bg-[#FFF9DB] border border-[#FFE066] rounded-2xl flex items-center justify-around">
            <div>
              <div className="text-xs font-bold text-[#8C6D00]">CHÍNH XÁC</div>
              <div className="text-2xl font-black text-[#2B8A3E]">
                {score}/{cards.length}
              </div>
            </div>
            <div className="w-px h-10 bg-[#FFD43B]" />
            <div>
              <div className="text-xs font-bold text-[#8C6D00]">ĐIỂM XP</div>
              <div className="text-2xl font-black text-[#E67700]">+{xpGained} XP</div>
            </div>
          </div>

          <button
            onClick={() => onFinish(xpGained)}
            className="w-full py-3.5 bg-linear-to-r from-[#FFD13B] to-[#FFAA00] hover:from-[#FFC61A] text-[#4A3200] font-black text-base rounded-2xl shadow-md transition-all hover:scale-105 active:scale-95"
          >
            Lưu Kết Quả & Quay Về
          </button>
        </div>
      </div>
    );
  }

  if (!currentCard) return null;

  const progressPct = ((currentIndex + 1) / cards.length) * 100;

  return (
    <div className="max-w-xl mx-auto space-y-6 px-4 select-none">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={onExit}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-2xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Thoát</span>
        </button>

        <div className="flex-1 max-w-xs">
          <div className="flex justify-between text-[11px] font-bold text-slate-500 mb-1">
            <span>
              Từ {currentIndex + 1}/{cards.length}
            </span>
            <span className="text-emerald-600 font-bold">Chính xác: {score}</span>
          </div>
          <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-linear-to-r from-emerald-400 to-teal-500 rounded-full transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        <Mascot mood={mascotMood} size="sm" />
      </div>

      {/* Target Word Prompt Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E9E4F0] shadow-sm text-center space-y-3">
        <span className="text-xs font-black uppercase tracking-wider text-slate-400">
          Nghĩa Tiếng Việt
        </span>

        <h2 className="text-2xl sm:text-3xl font-black text-[#5B3E06]">
          {currentCard.back}
        </h2>

        {/* Audio helper button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handleSpeak}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-xs font-bold transition-all hover:scale-105"
          >
            <Volume2 className="w-4 h-4 text-amber-600" />
            <span>Nghe phát âm</span>
          </button>
        </div>

        {currentCard.example && (
          <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 italic">
            &ldquo;{currentCard.example}&rdquo;
          </div>
        )}
      </div>

      {/* Typing Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            disabled={isSubmitted}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Gõ từ tiếng Anh vào đây..."
            className={`w-full p-4 text-center font-extrabold text-xl sm:text-2xl rounded-2xl border-2 transition-all outline-hidden ${
              isSubmitted
                ? isCorrect
                  ? 'bg-emerald-50 border-emerald-400 text-emerald-800'
                  : 'bg-rose-50 border-rose-400 text-rose-800'
                : 'bg-white border-slate-300 focus:border-[#FF9F1C] focus:ring-4 focus:ring-[#FF9F1C]/20 text-slate-800'
            }`}
          />
        </div>

        {/* Feedback / Result section */}
        {isSubmitted && (
          <div
            className={`p-4 rounded-2xl border flex items-center justify-between animate-mochi-pulse ${
              isCorrect
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {isCorrect ? (
                <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
              ) : (
                <XCircle className="w-6 h-6 text-rose-600 shrink-0" />
              )}
              <div>
                <div className="font-extrabold text-sm sm:text-base">
                  {isCorrect ? 'Chính xác 100%!' : 'Chưa đúng rồi!'}
                </div>
                {!isCorrect && (
                  <div className="text-xs font-bold mt-0.5">
                    Đáp án đúng: <span className="underline font-black text-sm">{currentCard.front}</span>
                  </div>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={handleNext}
              className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-black text-white font-bold text-xs rounded-xl shadow-xs transition-all hover:scale-105"
            >
              <span>Tiếp tục</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Buttons: Submit & Hint */}
        {!isSubmitted && (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleHint}
              className="flex items-center gap-1.5 px-4 py-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 font-bold text-xs rounded-2xl shadow-2xs transition-all"
            >
              <HelpCircle className="w-4 h-4 text-purple-500" />
              <span>Gợi ý chữ cái</span>
            </button>

            <button
              type="submit"
              disabled={!inputValue.trim()}
              className="flex-1 py-3 bg-linear-to-r from-[#FFD13B] to-[#FFAA00] hover:from-[#FFC61A] disabled:opacity-50 text-[#4A3200] font-black text-sm rounded-2xl shadow-xs transition-all hover:scale-[1.02] active:scale-95"
            >
              Kiểm Tra (Enter)
            </button>
          </div>
        )}
      </form>
    </div>
  );
};
