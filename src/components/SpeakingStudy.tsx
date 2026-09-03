import React, { useState, useEffect, useCallback } from 'react';
import { Card, UserSettings } from '../types';
import { ttsService } from '../utils/tts';
import { soundManager } from '../utils/sounds';
import { speechRecognitionManager, evaluatePronunciation, PronunciationEvaluation, isSpeechRecognitionSupported } from '../utils/speechRecognition';
import { useMediaUrl } from '../hooks/useMediaUrl';
import { Mascot } from './Mascot';
import {
  Mic,
  MicOff,
  Volume2,
  ArrowLeft,
  RotateCcw,
  Sparkles,
  Award,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface SpeakingStudyProps {
  cards: Card[];
  deckTitle: string;
  settings: UserSettings;
  onFinishSession: (xpGained: number) => void;
  onExit: () => void;
}

export const SpeakingStudy: React.FC<SpeakingStudyProps> = ({
  cards,
  deckTitle,
  settings,
  onFinishSession,
  onExit,
}) => {
  const [studyQueue] = useState<Card[]>(cards);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [evaluation, setEvaluation] = useState<PronunciationEvaluation | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [xpGained, setXpGained] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [mascotMood, setMascotMood] = useState<'happy' | 'thinking' | 'cheering' | 'surprised'>('happy');

  const currentCard = studyQueue[currentIndex];
  const imageUrl = useMediaUrl(currentCard?.image);
  const hasSupport = isSpeechRecognitionSupported();

  const playCardAudio = useCallback(
    (text: string) => {
      soundManager.playClick();
      ttsService.speak(text, settings.ttsAccent, settings.ttsSpeed);
    },
    [settings.ttsAccent, settings.ttsSpeed]
  );

  // Play audio on new card if auto-play is enabled
  useEffect(() => {
    if (currentCard && !isFinished) {
      setEvaluation(null);
      setLiveTranscript('');
      setErrorMsg('');
      setMascotMood('thinking');
      if (settings.autoPlayAudio) {
        const timer = setTimeout(() => {
          playCardAudio(currentCard.front);
        }, 200);
        return () => clearTimeout(timer);
      }
    }
  }, [currentIndex, currentCard, isFinished, settings.autoPlayAudio, playCardAudio]);

  const handleStartListening = () => {
    if (!currentCard || isListening) return;

    setErrorMsg('');
    setLiveTranscript('');
    setEvaluation(null);
    setIsListening(true);
    soundManager.playClick();

    speechRecognitionManager.startListening(
      (interim) => {
        setLiveTranscript(interim);
      },
      (final) => {
        setLiveTranscript(final);
        const result = evaluatePronunciation(final, currentCard.front);
        setEvaluation(result);
        setIsListening(false);

        if (result.score >= 80) {
          soundManager.playCorrect();
          setMascotMood('cheering');
          setXpGained((x) => x + 15);
        } else if (result.score >= 50) {
          soundManager.playClick();
          setMascotMood('happy');
          setXpGained((x) => x + 8);
        } else {
          soundManager.playWrong();
          setMascotMood('surprised');
        }
      },
      (err) => {
        setIsListening(false);
        setErrorMsg(err);
        setMascotMood('surprised');
      },
      () => {
        setIsListening(false);
      },
      settings.ttsAccent || 'en-US'
    );
  };

  const handleStopListening = () => {
    speechRecognitionManager.stopListening();
    setIsListening(false);
  };

  const handleNextCard = () => {
    soundManager.playClick();
    if (currentIndex + 1 < studyQueue.length) {
      setCurrentIndex((i) => i + 1);
    } else {
      setIsFinished(true);
      soundManager.playVictory();
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    }
  };

  if (!hasSupport) {
    return (
      <div className="max-w-xl mx-auto py-12 px-4 text-center">
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
          <div className="text-5xl">🎙️</div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-white">Trình duyệt chưa hỗ trợ Nhận Diện Giọng Nói</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Tính năng Luyện Phát Âm (Web Speech Recognition) hoạt động tốt nhất trên <strong>Google Chrome</strong> hoặc <strong>Microsoft Edge</strong>.
          </p>
          <button
            onClick={onExit}
            className="px-6 py-3 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold rounded-2xl"
          >
            Quay lại bài học
          </button>
        </div>
      </div>
    );
  }

  if (isFinished) {
    return (
      <div className="max-w-xl mx-auto py-10 px-4 text-center">
        <div className="bg-white dark:bg-slate-900/95 rounded-3xl p-8 sm:p-10 border border-slate-200 dark:border-slate-800 shadow-xl">
          <Mascot mood="cheering" size="lg" message="Phát âm đỉnh của chóp!" />

          <h2 className="text-3xl font-black text-[#2E241E] dark:text-white mt-4">
            Hoàn Thành Bài Luyện Nói! 🎙️
          </h2>
          <p className="text-sm font-semibold text-[#7A6E66] dark:text-slate-400 mt-2">
            Bạn vừa luyện nói xong <strong className="text-slate-800 dark:text-white">{cards.length} từ vựng</strong> trong bộ <span className="text-[#FF8A00]">“{deckTitle}”</span>.
          </p>

          <div className="my-6 p-4 bg-linear-to-r from-amber-50 to-orange-50 dark:from-slate-800 dark:to-slate-800/60 border border-amber-200 dark:border-slate-700 rounded-2xl flex items-center justify-around">
            <div className="flex flex-col items-center">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Kinh nghiệm</span>
              <span className="text-2xl font-black text-amber-600 dark:text-amber-400 flex items-center gap-1">
                <Sparkles className="w-5 h-5 fill-amber-500" /> +{xpGained} XP
              </span>
            </div>
            <div className="h-8 w-px bg-amber-200 dark:bg-slate-700" />
            <div className="flex flex-col items-center">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Đã luyện</span>
              <span className="text-2xl font-black text-[#2E241E] dark:text-white">
                {cards.length} từ
              </span>
            </div>
          </div>

          <button
            onClick={() => onFinishSession(xpGained)}
            className="w-full py-4 bg-linear-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black text-base rounded-2xl shadow-lg shadow-orange-500/25 transition-all hover:scale-[1.02] active:scale-95"
          >
            Lưu Kết Quả & Quay Về
          </button>
        </div>
      </div>
    );
  }

  const progressPct = ((currentIndex + 1) / studyQueue.length) * 100;

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fadeIn pb-12">
      {/* Top Bar */}
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={onExit}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Thoát</span>
        </button>

        {/* Progress Bar */}
        <div className="flex-1 max-w-xs">
          <div className="flex items-center justify-between text-xs font-black text-slate-500 dark:text-slate-400 mb-1">
            <span>Luyện Phát Âm AI</span>
            <span>{currentIndex + 1} / {studyQueue.length}</span>
          </div>
          <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-linear-to-r from-cyan-400 to-blue-500 rounded-full transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        <Mascot mood={mascotMood} size="sm" />
      </div>

      {/* Speaking Card */}
      <div className="bg-white dark:bg-slate-900/95 rounded-3xl p-6 sm:p-8 border-2 border-cyan-200 dark:border-cyan-500/40 shadow-xl space-y-6 text-center relative overflow-hidden">
        
        {/* Top Header */}
        <div className="flex items-center justify-between">
          <span className="px-3 py-1 bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800 rounded-full text-xs font-black uppercase">
            🎙️ Speaking AI
          </span>
          <span className="text-xs font-bold text-slate-400">
            {(deckTitle || '').replace(/[\x00-\x1f\x7f-\x9f]/g, ' - ').replace(/::/g, ' - ').trim()}
          </span>
        </div>

        {/* Word and Meaning */}
        <div className="space-y-2 py-2">
          {imageUrl && (
            <div className="flex justify-center pointer-events-none mb-3">
              <img src={imageUrl} alt="" className="max-h-28 sm:max-h-32 rounded-xl shadow-xs object-contain" />
            </div>
          )}

          <div className="flex items-center justify-center gap-3">
            <h1 className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
              {currentCard.front}
            </h1>
            <button
              onClick={() => playCardAudio(currentCard.front)}
              title="Nghe phát âm chuẩn Edge-TTS"
              className="p-3 bg-cyan-50 dark:bg-cyan-950/60 hover:bg-cyan-100 text-cyan-700 dark:text-cyan-300 rounded-2xl transition-transform hover:scale-110 active:scale-95 shadow-xs cursor-pointer border border-cyan-200 dark:border-cyan-800"
            >
              <Volume2 className="w-6 h-6 stroke-[2.5]" />
            </button>
          </div>

          {currentCard.phonetic && (
            <div className="text-base font-mono text-slate-500 dark:text-slate-400 font-bold">
              {currentCard.phonetic}
            </div>
          )}

          <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 max-w-md mx-auto">
            <div className="text-base sm:text-lg font-black text-amber-700 dark:text-amber-300">
              {currentCard.back}
            </div>
            {currentCard.example && (
              <div className="text-xs text-slate-500 dark:text-slate-400 italic mt-1">
                &ldquo;{currentCard.example}&rdquo;
              </div>
            )}
          </div>
        </div>

        {/* Live Audio Waves / Recording Status */}
        <div className="py-2">
          {isListening ? (
            <div className="space-y-3 animate-fadeIn">
              <div className="flex items-center justify-center gap-1.5 h-10">
                {[40, 70, 90, 60, 100, 75, 45, 85, 95, 50].map((h, i) => (
                  <div
                    key={i}
                    style={{ height: `${h}%` }}
                    className="w-1.5 bg-rose-500 rounded-full animate-pulse"
                  />
                ))}
              </div>
              <p className="text-sm font-bold text-rose-600 dark:text-rose-400 animate-pulse">
                🎙️ Đang lắng nghe giọng nói của bạn... Hãy phát âm từ trên!
              </p>
              {liveTranscript && (
                <div className="p-2.5 bg-rose-50 dark:bg-rose-950/60 rounded-xl text-xs font-semibold text-rose-800 dark:text-rose-200 border border-rose-200 max-w-sm mx-auto">
                  &ldquo;{liveTranscript}&rdquo;
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <button
                onClick={handleStartListening}
                className="w-20 h-20 sm:w-24 sm:h-24 mx-auto rounded-full bg-linear-to-tr from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white flex items-center justify-center shadow-xl shadow-rose-500/30 transition-transform hover:scale-110 active:scale-95 cursor-pointer relative group"
              >
                <div className="absolute inset-0 rounded-full bg-rose-500 animate-ping opacity-25" />
                <Mic className="w-9 h-9 sm:w-10 sm:h-10 relative z-10" />
              </button>
              <p className="text-xs font-bold text-slate-400">
                Nhấn vào Micro để bắt đầu nói
              </p>
            </div>
          )}
        </div>

        {/* Evaluation Feedback Banner */}
        {evaluation && !isListening && (
          <div className="space-y-4 animate-mochi-pop">
            <div
              className={`p-4 rounded-2xl border-2 max-w-md mx-auto space-y-2 text-left ${
                evaluation.score >= 80
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-400 text-emerald-900 dark:text-emerald-100'
                  : evaluation.score >= 50
                  ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-400 text-amber-900 dark:text-amber-100'
                  : 'bg-rose-50 dark:bg-rose-950/60 border-rose-400 text-rose-900 dark:text-rose-100'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-sm flex items-center gap-1.5">
                  {evaluation.score >= 80 ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-amber-500" />
                  )}
                  {evaluation.feedback}
                </span>
                <span className="text-xl font-black px-2.5 py-1 rounded-xl bg-white/80 dark:bg-slate-800 shadow-2xs">
                  {evaluation.score}%
                </span>
              </div>

              <div className="text-xs font-semibold pt-1 border-t border-slate-200/60 dark:border-slate-700">
                <div>Máy nhận diện được: <strong className="underline">&ldquo;{evaluation.spokenText}&rdquo;</strong></div>
                <div>Từ cần phát âm: <strong>&ldquo;{evaluation.targetText}&rdquo;</strong></div>
              </div>
            </div>

            {/* Action buttons after evaluation */}
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={handleStartListening}
                className="px-5 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs sm:text-sm rounded-2xl transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Nói Lại</span>
              </button>

              <button
                onClick={handleNextCard}
                className="px-8 py-3 bg-linear-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black text-xs sm:text-sm rounded-2xl shadow-md transition-all hover:scale-105 active:scale-95 flex items-center gap-1.5 cursor-pointer"
              >
                <span>Từ Tiếp Theo</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {errorMsg && !isListening && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-300 text-xs font-bold rounded-2xl max-w-md mx-auto">
            {errorMsg}
          </div>
        )}
      </div>
    </div>
  );
};
