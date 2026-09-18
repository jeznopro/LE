import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Exam, ExamQuestion, ExamResult, ExamUserAnswer, UserAccount } from '../types';
import { storage } from '../utils/storage';
import { soundManager } from '../utils/sounds';
import { Mascot } from './Mascot';
import confetti from 'canvas-confetti';
import {
  Clock,
  CheckCircle2,
  XCircle,
  Flag,
  ChevronLeft,
  ChevronRight,
  Send,
  RotateCcw,
  Sparkles,
  Trophy,
  ArrowLeft,
  AlertCircle,
  HelpCircle,
  Check,
  Award,
} from 'lucide-react';

interface ExamSessionProps {
  exam: Exam;
  currentUser: UserAccount | null;
  onExit: () => void;
  onExamCompleted: (result: ExamResult) => void;
}

export const ExamSession: React.FC<ExamSessionProps> = ({
  exam,
  currentUser,
  onExit,
  onExamCompleted,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<Record<string, boolean>>({});
  const [secondsRemaining, setSecondsRemaining] = useState(exam.durationMinutes * 60);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [examResult, setExamResult] = useState<ExamResult | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showPalette, setShowPalette] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const currentQuestion = exam.questions[currentIndex];

  // Countdown Timer
  useEffect(() => {
    if (isSubmitted) return;
    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleSubmitExam();
          return 0;
        }
        if (prev === 60) {
          soundManager.playWrong(); // Alert 1 minute remaining
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isSubmitted]);

  // Focus input for word-formation
  useEffect(() => {
    if (!isSubmitted && currentQuestion.type === 'word-formation') {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [currentIndex, isSubmitted, currentQuestion.type]);

  const formatTimer = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSelectOption = (option: string) => {
    soundManager.playClick();
    setUserAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: option,
    }));
  };

  const handleTextInputChange = (val: string) => {
    setUserAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: val,
    }));
  };

  const toggleFlag = (qId: string) => {
    soundManager.playClick();
    setFlaggedQuestions((prev) => ({
      ...prev,
      [qId]: !prev[qId],
    }));
  };

  const answeredCount = Object.keys(userAnswers).filter(
    (k) => userAnswers[k] && userAnswers[k].trim() !== ''
  ).length;

  const handleSubmitExam = () => {
    soundManager.playVictory();
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });

    let score = 0;
    const answersRecord: Record<string, ExamUserAnswer> = {};
    const dạngBreakdown: Record<string, { total: number; correct: number }> = {};

    exam.questions.forEach((q) => {
      const uAns = (userAnswers[q.id] || '').trim();
      const cAns = q.correctAnswer.trim();

      // Flexible check for word-formation (case-insensitive and trimmed)
      const isCorrect = uAns.toLowerCase() === cAns.toLowerCase();
      if (isCorrect) score += 1;

      answersRecord[q.id] = {
        questionId: q.id,
        userAnswer: uAns,
        isCorrect,
        isFlagged: Boolean(flaggedQuestions[q.id]),
      };

      // Breakdown by dạng
      if (!dạngBreakdown[q.dạng]) {
        dạngBreakdown[q.dạng] = { total: 0, correct: 0 };
      }
      dạngBreakdown[q.dạng].total += 1;
      if (isCorrect) {
        dạngBreakdown[q.dạng].correct += 1;
      }
    });

    const totalQuestions = exam.questions.length;
    const percentage = Math.round((score / totalQuestions) * 100);
    const timeSpentSeconds = exam.durationMinutes * 60 - secondsRemaining;
    const xpGained = score * 5 + (percentage >= 80 ? 25 : 10);

    const result: ExamResult = {
      id: `result-${Date.now()}`,
      examId: exam.id,
      examTitle: exam.title,
      userId: currentUser ? currentUser.id : 'guest',
      score,
      totalQuestions,
      percentage,
      timeSpentSeconds,
      completedAt: Date.now(),
      answers: answersRecord,
      xpGained,
      dạngBreakdown,
    };

    if (currentUser) {
      storage.saveExamResult(currentUser.id, result);
      // Award XP to stats
      const stats = storage.getStatsForUser(currentUser.id);
      const updatedStats = {
        ...stats,
        xp: stats.xp + xpGained,
        totalReviews: stats.totalReviews + totalQuestions,
      };
      storage.saveStatsForUser(currentUser.id, updatedStats);
    }

    setExamResult(result);
    setIsSubmitted(true);
    setShowConfirmModal(false);
    onExamCompleted(result);
  };

  const handleRetakeExam = () => {
    soundManager.playClick();
    setUserAnswers({});
    setFlaggedQuestions({});
    setSecondsRemaining(exam.durationMinutes * 60);
    setCurrentIndex(0);
    setIsSubmitted(false);
    setExamResult(null);
  };

  // ================= RENDER RESULT SCREEN =================
  if (isSubmitted && examResult) {
    const isPassing = examResult.percentage >= 70;

    return (
      <div className="w-full max-w-4xl mx-auto space-y-6 animate-mochi-pop pb-12">
        {/* Top Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={onExit}
            className="liquid-glass-pill flex items-center gap-2 px-4 py-2 text-slate-700 dark:text-slate-200 font-bold text-sm hover:scale-105 active:scale-95 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Về Phòng Luyện Đề</span>
          </button>

          <button
            onClick={handleRetakeExam}
            className="liquid-glass-pill flex items-center gap-2 px-4 py-2 bg-amber-500/20 text-amber-900 dark:text-amber-300 font-bold text-sm hover:scale-105 active:scale-95 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Làm Lại Đề Này</span>
          </button>
        </div>

        {/* Result Score Card */}
        <div className="liquid-glass-card rounded-3xl p-6 sm:p-8 text-center relative overflow-hidden border-2 border-amber-400/40">
          <div className="flex justify-center mb-3">
            <Mascot mood={isPassing ? 'cheering' : 'thinking'} size="lg" />
          </div>

          <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-500/20 text-amber-900 dark:text-amber-300 border border-amber-400/30">
            Kết Quả Bài Thi Destination B1
          </span>

          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-2">
            {exam.title}
          </h2>

          <div className="flex items-center justify-center gap-6 mt-6">
            <div className="text-center">
              <div className="text-4xl sm:text-5xl font-black text-emerald-600 dark:text-emerald-400">
                {examResult.score}/{examResult.totalQuestions}
              </div>
              <div className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-1">
                Số câu đúng
              </div>
            </div>

            <div className="h-12 w-px bg-white/40 dark:bg-white/10" />

            <div className="text-center">
              <div className="text-4xl sm:text-5xl font-black text-amber-600 dark:text-amber-400">
                {examResult.percentage}%
              </div>
              <div className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-1">
                Tỷ lệ chính xác
              </div>
            </div>

            <div className="h-12 w-px bg-white/40 dark:bg-white/10" />

            <div className="text-center">
              <div className="text-4xl sm:text-5xl font-black text-purple-600 dark:text-purple-400">
                +{examResult.xpGained}
              </div>
              <div className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-1">
                Điểm XP nhận được
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-white/40 dark:border-white/10 flex items-center justify-center gap-4 text-xs font-semibold text-slate-600 dark:text-slate-300">
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-slate-400" />
              <span>Thời gian làm: {formatTimer(examResult.timeSpentSeconds)}</span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-500" />
              <span>
                Đánh giá: {examResult.percentage >= 90 ? 'Xuất sắc 🌟' : examResult.percentage >= 70 ? 'Đạt chuẩn B1 👍' : 'Cần ôn luyện thêm 💪'}
              </span>
            </div>
          </div>
        </div>

        {/* Dạng bài Breakdown Analytics */}
        <div className="liquid-glass-card rounded-3xl p-6">
          <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2 mb-4">
            <Trophy className="w-4 h-4 text-amber-500" />
            <span>Phân Tích Chi Tiết Theo Dạng Bài</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.entries(examResult.dạngBreakdown).map(([dạng, stats]) => {
              const pct = Math.round((stats.correct / stats.total) * 100);
              return (
                <div
                  key={dạng}
                  className="liquid-glass-subtle rounded-2xl p-3.5 border border-white/40 dark:border-white/10 flex flex-col justify-between"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      {dạng}
                    </span>
                    <span className="text-xs font-black text-amber-600 dark:text-amber-400">
                      {stats.correct}/{stats.total}
                    </span>
                  </div>

                  <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden mt-2.5">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        pct >= 80 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Detailed Question Review List */}
        <div className="space-y-4">
          <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-indigo-500" />
            <span>Xem Lại Từng Câu Hỏi & Lời Giải Chi Tiết</span>
          </h3>

          {exam.questions.map((q, idx) => {
            const answerInfo = examResult.answers[q.id];
            const isCorrect = answerInfo?.isCorrect;
            const uAns = answerInfo?.userAnswer || '(Bỏ trống)';

            return (
              <div
                key={q.id}
                className={`liquid-glass-card rounded-3xl p-5 sm:p-6 border-2 transition-all ${
                  isCorrect
                    ? 'border-emerald-400/40 bg-emerald-500/5'
                    : 'border-rose-400/40 bg-rose-500/5'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="w-7 h-7 rounded-xl bg-white/80 dark:bg-slate-800 flex items-center justify-center font-black text-xs text-slate-700 dark:text-slate-200 border">
                      {idx + 1}
                    </span>
                    <span className="text-[11px] font-black px-2.5 py-0.5 rounded-lg bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-400/30">
                      🏷️ {q.dạng}
                    </span>
                  </div>

                  <div className="shrink-0 flex items-center gap-1.5 font-bold text-xs">
                    {isCorrect ? (
                      <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Chính xác</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400">
                        <XCircle className="w-4 h-4" />
                        <span>Chưa đúng</span>
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-3 text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100 leading-relaxed">
                  {q.question}
                </div>

                {/* Answers Compare */}
                <div className="mt-4 p-3 rounded-2xl bg-white/60 dark:bg-slate-800/60 border border-white/40 dark:border-white/10 space-y-1.5 text-xs sm:text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-500 dark:text-slate-400 w-28 shrink-0">
                      Bạn đã chọn:
                    </span>
                    <span
                      className={`font-black px-2.5 py-0.5 rounded-lg ${
                        isCorrect
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200'
                          : 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-200'
                      }`}
                    >
                      {uAns}
                    </span>
                  </div>

                  {!isCorrect && (
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-500 dark:text-slate-400 w-28 shrink-0">
                        Đáp án đúng:
                      </span>
                      <span className="font-black px-2.5 py-0.5 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200">
                        {q.correctAnswer}
                      </span>
                    </div>
                  )}
                </div>

                {/* Explanation */}
                <div className="mt-3 p-3.5 rounded-2xl bg-amber-500/10 dark:bg-amber-400/10 border border-amber-300/30 dark:border-amber-500/20 text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
                  <div className="font-black text-amber-800 dark:text-amber-300 mb-1 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 fill-amber-400" />
                    <span>Giải thích chi tiết:</span>
                  </div>
                  {q.explanation}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-center gap-4 pt-4">
          <button
            onClick={handleRetakeExam}
            className="liquid-glass-pill px-6 py-3 bg-linear-to-r from-amber-400 to-amber-500 text-amber-950 font-black text-sm shadow-md hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Làm Lại Đề Này</span>
          </button>

          <button
            onClick={onExit}
            className="liquid-glass-pill px-6 py-3 text-slate-700 dark:text-slate-200 font-black text-sm hover:scale-105 active:scale-95 cursor-pointer"
          >
            Quay Về Phòng Luyện Đề
          </button>
        </div>
      </div>
    );
  }

  // ================= RENDER EXAM TAKING PHASE =================
  const currentAnswer = userAnswers[currentQuestion.id] || '';
  const isCurrentFlagged = Boolean(flaggedQuestions[currentQuestion.id]);

  return (
    <div className="w-full max-w-4xl mx-auto space-y-5 animate-mochi-pop pb-12">
      {/* Top Header & Timer Bar */}
      <div className="liquid-glass-card rounded-3xl p-4 sm:p-5 flex items-center justify-between gap-3 border-2 border-white/60 dark:border-white/10 shadow-lg">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (window.confirm('Bạn có chắc chắn muốn thoát bài thi không? Kết quả sẽ không được lưu.')) {
                onExit();
              }
            }}
            className="liquid-glass-pill p-2 text-slate-600 dark:text-slate-300 hover:text-rose-500 rounded-xl cursor-pointer hover:scale-105 transition-all"
            title="Thoát bài thi"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div>
            <h2 className="font-black text-base sm:text-lg text-slate-900 dark:text-white line-clamp-1">
              {exam.title}
            </h2>
            <div className="text-xs font-bold text-slate-500 dark:text-slate-400">
              Câu {currentIndex + 1} / {exam.questions.length} • Đã làm: {answeredCount}/{exam.questions.length}
            </div>
          </div>
        </div>

        {/* Timer & Palette Toggle */}
        <div className="flex items-center gap-2.5">
          <div
            className={`px-3.5 py-1.5 rounded-2xl flex items-center gap-2 font-black text-sm shadow-inner transition-colors ${
              secondsRemaining < 120
                ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-400/40 animate-mochi-pulse'
                : 'bg-amber-500/20 text-amber-900 dark:text-amber-300 border border-amber-400/40'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span className="font-mono">{formatTimer(secondsRemaining)}</span>
          </div>

          <button
            onClick={() => setShowPalette(!showPalette)}
            className={`liquid-glass-pill px-3 py-1.5 text-xs font-black rounded-2xl transition-all cursor-pointer ${
              showPalette
                ? 'bg-amber-500 text-white shadow-xs'
                : 'text-slate-700 dark:text-slate-300'
            }`}
          >
            Lưới câu hỏi
          </button>
        </div>
      </div>

      {/* Question Palette Drawer (Collapsible) */}
      {showPalette && (
        <div className="liquid-glass-card rounded-3xl p-4 sm:p-5 border border-white/50 dark:border-white/10 animate-mochi-pop">
          <div className="flex items-center justify-between mb-3 text-xs font-bold text-slate-600 dark:text-slate-400">
            <span>Bảng điều hướng câu hỏi:</span>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Đã làm
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500" /> Đánh dấu
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-600" /> Chưa làm
              </span>
            </div>
          </div>

          <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
            {exam.questions.map((q, idx) => {
              const hasAnswer = Boolean(userAnswers[q.id]?.trim());
              const isFlagged = Boolean(flaggedQuestions[q.id]);
              const isCurrent = idx === currentIndex;

              let btnClass = 'bg-white/60 dark:bg-slate-800 text-slate-700 dark:text-slate-300';
              if (hasAnswer) btnClass = 'bg-emerald-500 text-white shadow-sm';
              if (isFlagged) btnClass = 'bg-purple-500 text-white shadow-sm';
              if (isCurrent) btnClass += ' ring-2 ring-amber-400 ring-offset-1 scale-105';

              return (
                <button
                  key={q.id}
                  onClick={() => {
                    soundManager.playClick();
                    setCurrentIndex(idx);
                  }}
                  className={`h-9 rounded-xl font-black text-xs transition-all cursor-pointer flex items-center justify-center relative ${btnClass}`}
                >
                  <span>{idx + 1}</span>
                  {isFlagged && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-yellow-400" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Question Card */}
      <div className="liquid-glass-card rounded-3xl p-6 sm:p-8 space-y-6 border-2 border-white/70 dark:border-white/10 shadow-xl min-h-[380px] flex flex-col justify-between">
        <div>
          {/* Question Tag & Flag Bar */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-xl text-xs font-black bg-amber-500/15 text-amber-900 dark:text-amber-300 border border-amber-400/30">
                🏷️ {currentQuestion.dạng}
              </span>
              {currentQuestion.type === 'word-formation' && (
                <span className="px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-purple-500/15 text-purple-800 dark:text-purple-300 border border-purple-400/30">
                  Gõ từ cấu tạo
                </span>
              )}
            </div>

            <button
              onClick={() => toggleFlag(currentQuestion.id)}
              className={`liquid-glass-pill flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isCurrentFlagged
                  ? 'bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-400/40'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Flag className={`w-3.5 h-3.5 ${isCurrentFlagged ? 'fill-purple-500 text-purple-600' : ''}`} />
              <span>{isCurrentFlagged ? 'Đã đánh dấu' : 'Đánh dấu câu'}</span>
            </button>
          </div>

          {/* Question Prompt */}
          <div className="mt-6 text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-relaxed tracking-tight">
            {currentQuestion.question}
          </div>

          {/* Question Form Input */}
          <div className="mt-6">
            {currentQuestion.type === 'multiple-choice' && currentQuestion.options && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {currentQuestion.options.map((opt, oIdx) => {
                  const isSelected = currentAnswer.toLowerCase() === opt.toLowerCase();
                  return (
                    <button
                      key={opt}
                      onClick={() => handleSelectOption(opt)}
                      className={`p-4 rounded-2xl text-left font-bold text-sm sm:text-base transition-all duration-200 flex items-center gap-3 cursor-pointer border ${
                        isSelected
                          ? 'bg-linear-to-r from-amber-400/30 to-amber-500/30 dark:from-amber-500/30 dark:to-orange-500/30 border-amber-400 text-amber-950 dark:text-amber-100 shadow-md scale-[1.01]'
                          : 'liquid-glass-subtle border-white/40 dark:border-white/10 text-slate-800 dark:text-slate-200 hover:bg-white/40 dark:hover:bg-white/10'
                      }`}
                    >
                      <span
                        className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black shrink-0 border ${
                          isSelected
                            ? 'bg-amber-500 text-white border-amber-600'
                            : 'bg-white/60 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {String.fromCharCode(65 + oIdx)}
                      </span>
                      <span className="flex-1">{opt}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {(currentQuestion.type === 'word-formation' || currentQuestion.type === 'fill-blank') && (
              <div className="space-y-3">
                <div className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4 text-purple-500" />
                  <span>
                    {currentQuestion.type === 'word-formation'
                      ? 'Hãy biến đổi từ gốc in hoa để điền vào chỗ trống:'
                      : 'Hãy gõ đáp án điền vào chỗ trống:'}
                  </span>
                </div>
                <input
                  ref={inputRef}
                  type="text"
                  value={currentAnswer}
                  onChange={(e) => handleTextInputChange(e.target.value)}
                  placeholder="Gõ đáp án vào đây..."
                  className="w-full p-4 rounded-2xl border-2 text-lg sm:text-xl font-black bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 focus:border-amber-500 text-slate-900 dark:text-white shadow-inner outline-hidden"
                />
              </div>
            )}
          </div>
        </div>

        {/* Bottom Navigation & Submit Bar */}
        <div className="pt-6 border-t border-white/40 dark:border-white/10 flex items-center justify-between gap-3">
          <button
            onClick={() => {
              soundManager.playClick();
              setCurrentIndex((prev) => Math.max(0, prev - 1));
            }}
            disabled={currentIndex === 0}
            className="liquid-glass-pill px-4 py-2.5 text-xs sm:text-sm font-black text-slate-700 dark:text-slate-200 disabled:opacity-40 flex items-center gap-1 cursor-pointer hover:scale-105 active:scale-95"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Câu Trước</span>
          </button>

          <button
            onClick={() => setShowConfirmModal(true)}
            className="liquid-glass-pill px-5 py-2.5 bg-linear-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-black text-xs sm:text-sm shadow-md shadow-emerald-500/20 hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            <span>Nộp Bài Thi</span>
          </button>

          <button
            onClick={() => {
              soundManager.playClick();
              setCurrentIndex((prev) => Math.min(exam.questions.length - 1, prev + 1));
            }}
            disabled={currentIndex === exam.questions.length - 1}
            className="liquid-glass-pill px-4 py-2.5 text-xs sm:text-sm font-black text-slate-700 dark:text-slate-200 disabled:opacity-40 flex items-center gap-1 cursor-pointer hover:scale-105 active:scale-95"
          >
            <span>Câu Tiếp</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="liquid-glass-card rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-4 text-center border-2 border-amber-400/40 shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-300 flex items-center justify-center mx-auto text-3xl">
              📝
            </div>

            <h3 className="text-xl font-black text-slate-900 dark:text-white">
              Xác nhận nộp bài thi?
            </h3>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium">
              Bạn đã hoàn thành <strong className="text-amber-600 dark:text-amber-400">{answeredCount}/{exam.questions.length}</strong> câu hỏi.
              {answeredCount < exam.questions.length && (
                <span className="block mt-1 text-rose-500 font-bold">
                  ⚠️ Vẫn còn {exam.questions.length - answeredCount} câu chưa trả lời!
                </span>
              )}
            </p>

            <div className="flex items-center justify-center gap-3 pt-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="liquid-glass-pill px-4 py-2.5 text-xs font-black text-slate-600 dark:text-slate-300 cursor-pointer"
              >
                Tiếp Tục Làm
              </button>

              <button
                onClick={handleSubmitExam}
                className="liquid-glass-pill px-5 py-2.5 bg-linear-to-r from-emerald-500 to-teal-600 text-white font-black text-xs shadow-md cursor-pointer hover:scale-105 active:scale-95"
              >
                Nộp Bài Ngay
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
