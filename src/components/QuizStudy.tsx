import React, { useState, useEffect, useMemo } from 'react';
import { Card, UserSettings } from '../types';
import { ttsService } from '../utils/tts';
import { soundManager } from '../utils/sounds';
import confetti from 'canvas-confetti';
import { Volume2, ArrowLeft, CheckCircle2, XCircle } from 'lucide-react';
import { Mascot } from './Mascot';

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
  deckTitle: _deckTitle,
  settings,
  onFinish,
  onExit,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [mascotMood, setMascotMood] = useState<'happy' | 'thinking' | 'cheering' | 'surprised'>('happy');

  const questions: Question[] = useMemo(() => {
    const pool = Array.from(new Set(allCards.map((c) => c.back))).filter(Boolean);

    return cards.map((card) => {
      const distractors = pool.filter((meaning) => meaning !== card.back);
      const shuffledDistractors = [...distractors].sort(() => 0.5 - Math.random()).slice(0, 3);
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

  useEffect(() => {
    if (currentQ && !isFinished) {
      setSelectedOption(null);
      setIsAnswered(false);
      setMascotMood('thinking');
      if (settings.autoPlayAudio) {
        ttsService.speak(currentQ.card.front, settings.ttsAccent, settings.ttsSpeed);
      }
    }
  }, [currentIndex, currentQ, isFinished, settings]);

  const handleSelectOption = (idx: number) => {
    if (isAnswered || !currentQ) return;

    setSelectedOption(idx);
    setIsAnswered(true);

    const isCorrect = idx === currentQ.correctIndex;
    if (isCorrect) {
      soundManager.playCorrect();
      setMascotMood('cheering');
      setScore((s) => s + 1);
    } else {
      soundManager.playWrong();
      setMascotMood('surprised');
    }

    setTimeout(() => {
      if (currentIndex + 1 < questions.length) {
        setCurrentIndex((i) => i + 1);
      } else {
        setIsFinished(true);
        soundManager.playVictory();
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      }
    }, 1200);
  };

  const handleSpeak = () => {
    if (currentQ) {
      soundManager.playClick();
      ttsService.speak(currentQ.card.front, settings.ttsAccent, settings.ttsSpeed);
    }
  };

  if (isFinished) {
    const xpGained = score * 10;
    return (
      <div className="max-w-md mx-auto py-10 px-4 text-center">
        <div className="bg-white rounded-3xl p-8 border border-[#E9E4F0] shadow-lg">
          <Mascot mood="cheering" size="lg" message="Luyện tập siêu đỉnh!" />

          <h2 className="text-2xl sm:text-3xl font-black text-[#2E241E] mt-4">
            Hoàn Thành Trắc Nghiệm! 🎯
          </h2>

          <div className="my-6 p-4 bg-[#FFF9DB] border border-[#FFE066] rounded-2xl flex items-center justify-around">
            <div>
              <div className="text-xs font-bold text-[#8C6D00]">ĐÚNG</div>
              <div className="text-2xl font-black text-[#2B8A3E]">
                {score}/{questions.length}
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
              Câu {currentIndex + 1}/{questions.length}
            </span>
            <span className="text-emerald-600">Đúng: {score}</span>
          </div>
          <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-linear-to-r from-purple-400 to-indigo-500 rounded-full transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        <Mascot mood={mascotMood} size="sm" />
      </div>

      {/* Question Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E9E4F0] shadow-sm text-center">
        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
          Chọn nghĩa đúng của từ vựng:
        </div>

        <div className="flex items-center justify-center gap-3 my-4">
          <h2 className="text-3xl sm:text-4xl font-black text-[#2E241E]">
            {currentQ.card.front}
          </h2>
          <button
            onClick={handleSpeak}
            className="p-2.5 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-2xl transition-all"
          >
            <Volume2 className="w-5 h-5" />
          </button>
        </div>

        {currentQ.card.phonetic && (
          <div className="text-sm font-mono text-slate-500 font-semibold">
            {currentQ.card.phonetic}
          </div>
        )}
      </div>

      {/* 4 Choices */}
      <div className="grid grid-cols-1 gap-3">
        {currentQ.options.map((option, idx) => {
          let btnStyle = 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700';

          if (isAnswered) {
            if (idx === currentQ.correctIndex) {
              btnStyle = 'bg-[#E6FCF5] border-[#63E6BE] text-[#0CA678] ring-2 ring-[#20C997] shadow-sm';
            } else if (idx === selectedOption) {
              btnStyle = 'bg-[#FFF5F5] border-[#FF8787] text-[#FA5252]';
            } else {
              btnStyle = 'bg-white opacity-40 border-slate-200 text-slate-400';
            }
          }

          return (
            <button
              key={idx}
              disabled={isAnswered}
              onClick={() => handleSelectOption(idx)}
              className={`w-full p-4 rounded-2xl border-2 font-extrabold text-base text-left transition-all flex items-center justify-between ${btnStyle} ${
                !isAnswered ? 'hover:scale-[1.01] active:scale-98' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-xl bg-slate-100 flex items-center justify-center text-xs font-black text-slate-600">
                  {String.fromCharCode(65 + idx)}
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
    </div>
  );
};
