import React, { useState, useMemo } from 'react';
import { Exam, ExamResult, UserAccount } from '../types';
import { B1_EXAMS } from '../data/b1Exams';
import { storage } from '../utils/storage';
import { soundManager } from '../utils/sounds';
import { Mascot } from './Mascot';
import {
  ArrowLeft,
  Clock,
  CheckCircle2,
  Trophy,
  Play,
  FileText,
  Sparkles,
  BookOpen,
  Filter,
} from 'lucide-react';

interface ExamHubProps {
  currentUser: UserAccount | null;
  onBack: () => void;
  onSelectExam: (exam: Exam) => void;
}

export const ExamHub: React.FC<ExamHubProps> = ({
  currentUser,
  onBack,
  onSelectExam,
}) => {
  const [filterType, setFilterType] = useState<'all' | 'unit' | 'review'>('all');

  const examResults: ExamResult[] = useMemo(() => {
    if (!currentUser) return [];
    return storage.getExamResults(currentUser.id);
  }, [currentUser]);

  const filteredExams = useMemo(() => {
    if (filterType === 'unit') {
      return B1_EXAMS.filter((e) => e.unit.startsWith('Unit'));
    }
    if (filterType === 'review') {
      return B1_EXAMS.filter((e) => !e.unit.startsWith('Unit'));
    }
    return B1_EXAMS;
  }, [filterType]);

  const statsOverview = useMemo(() => {
    const totalTaken = examResults.length;
    if (totalTaken === 0) {
      return { totalTaken: 0, avgScore: 0, totalXp: 0 };
    }
    const sumPercent = examResults.reduce((acc, curr) => acc + curr.percentage, 0);
    const sumXp = examResults.reduce((acc, curr) => acc + (curr.xpGained || 0), 0);
    return {
      totalTaken,
      avgScore: Math.round(sumPercent / totalTaken),
      totalXp: sumXp,
    };
  }, [examResults]);

  const handleStartExam = (exam: Exam) => {
    soundManager.playClick();
    onSelectExam(exam);
  };

  return (
    <div className="w-full space-y-6 max-w-5xl mx-auto pb-12 animate-mochi-pop">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="liquid-glass-pill flex items-center gap-2 px-4 py-2 text-slate-700 dark:text-slate-200 font-bold text-sm hover:scale-105 active:scale-95 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Về Màn Hình Chính</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="liquid-glass-pill px-3 py-1 text-xs font-black text-amber-700 dark:text-amber-300 border border-amber-400/30 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
            <span>Format Đề Thi Destination B1 Chuẩn</span>
          </span>
        </div>
      </div>

      {/* Hero Welcome Banner */}
      <div className="liquid-glass-card rounded-3xl p-6 sm:p-8 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 border-2 border-amber-400/30">
        <div className="flex items-center gap-5 relative z-10">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-linear-to-tr from-amber-400 to-orange-500 flex items-center justify-center text-5xl shadow-lg shadow-amber-500/20 border border-white/40 shrink-0">
            📝
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase bg-amber-500/20 text-amber-900 dark:text-amber-300 border border-amber-400/30">
                Luyện Thi Trực Tuyến
              </span>
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                7 Đề Thi • 115 Câu Hỏi
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
              Phòng Luyện Đề & Bài Tập Destination B1
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium mt-1 max-w-xl leading-relaxed">
              Trải nghiệm làm bài thi thật với đồng hồ đếm ngược, tự động chấm điểm, phân tích điểm mạnh theo từng dạng bài và kèm lời giải thích ngữ pháp chi tiết!
            </p>
          </div>
        </div>

        <div className="shrink-0 relative z-10 flex flex-col items-center">
          <Mascot mood="cheering" size="md" />
        </div>
      </div>

      {/* Gamification Exam Stats */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <div className="liquid-glass-subtle rounded-2xl p-4 flex flex-col items-center justify-center text-center border border-white/50 dark:border-white/10">
          <FileText className="w-5 h-5 text-blue-500 mb-1" />
          <div className="text-xl sm:text-2xl font-black text-slate-800 dark:text-white">
            {statsOverview.totalTaken}
          </div>
          <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
            Lượt thi hoàn thành
          </div>
        </div>

        <div className="liquid-glass-subtle rounded-2xl p-4 flex flex-col items-center justify-center text-center border border-white/50 dark:border-white/10">
          <Trophy className="w-5 h-5 text-amber-500 mb-1" />
          <div className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400">
            {statsOverview.avgScore > 0 ? `${statsOverview.avgScore}%` : '--'}
          </div>
          <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
            Điểm trung bình
          </div>
        </div>

        <div className="liquid-glass-subtle rounded-2xl p-4 flex flex-col items-center justify-center text-center border border-white/50 dark:border-white/10">
          <Sparkles className="w-5 h-5 text-emerald-500 mb-1" />
          <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">
            +{statsOverview.totalXp} XP
          </div>
          <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
            Kinh nghiệm tích lũy
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="liquid-glass-subtle p-2 rounded-2xl flex items-center justify-between gap-2 overflow-x-auto">
        <div className="flex items-center gap-1.5 w-full">
          <button
            onClick={() => setFilterType('all')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              filterType === 'all'
                ? 'liquid-glass-pill shadow-xs ring-2 ring-amber-400/50 text-slate-900 dark:text-white bg-amber-400/30'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            📚 Tất cả đề thi ({B1_EXAMS.length})
          </button>

          <button
            onClick={() => setFilterType('unit')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              filterType === 'unit'
                ? 'liquid-glass-pill shadow-xs ring-2 ring-amber-400/50 text-slate-900 dark:text-white bg-amber-400/30'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            🎯 Đề theo từng Unit (6)
          </button>

          <button
            onClick={() => setFilterType('review')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              filterType === 'review'
                ? 'liquid-glass-pill shadow-xs ring-2 ring-amber-400/50 text-slate-900 dark:text-white bg-amber-400/30'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            🏆 Đề thi Tổng Hợp Review (1)
          </button>
        </div>
      </div>

      {/* Exams Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredExams.map((exam) => {
          const bestScore = currentUser ? storage.getBestExamScore(currentUser.id, exam.id) : null;
          const isReview = !exam.unit.startsWith('Unit');

          return (
            <div
              key={exam.id}
              className={`liquid-glass-card rounded-3xl p-5 sm:p-6 flex flex-col justify-between transition-all duration-300 hover:scale-[1.015] hover:shadow-xl border ${
                isReview
                  ? 'border-pink-400/40 bg-linear-to-br from-pink-500/10 to-purple-500/10'
                  : 'border-white/60 dark:border-white/10'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-inner border border-white/40 shrink-0"
                      style={{ backgroundColor: `${exam.color}35` }}
                    >
                      {exam.emoji}
                    </div>
                    <div>
                      <span
                        className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border"
                        style={{
                          backgroundColor: `${exam.color}20`,
                          color: exam.color,
                          borderColor: `${exam.color}40`,
                        }}
                      >
                        {exam.unit}
                      </span>
                      <h3 className="font-black text-lg sm:text-xl text-slate-900 dark:text-white mt-1 line-clamp-1">
                        {exam.title}
                      </h3>
                    </div>
                  </div>

                  {bestScore && (
                    <div className="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-400/30">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{bestScore.score}/{bestScore.totalQuestions}</span>
                    </div>
                  )}
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 font-medium mt-3 leading-relaxed">
                  {exam.description}
                </p>

                <div className="flex items-center gap-4 mt-4 text-xs font-bold text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-slate-400" />
                    <span>{exam.questions.length} câu hỏi</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{exam.durationMinutes} phút</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                    <Sparkles className="w-3.5 h-3.5 fill-amber-400" />
                    <span>+50 XP</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-white/40 dark:border-white/10 flex items-center justify-between">
                {bestScore ? (
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Điểm cao nhất: <strong className="text-emerald-600 dark:text-emerald-400 font-black">{bestScore.percentage}%</strong>
                  </span>
                ) : (
                  <span className="text-xs font-semibold text-slate-400">
                    Chưa làm bài thi này
                  </span>
                )}

                <button
                  onClick={() => handleStartExam(exam)}
                  className="liquid-glass-pill flex items-center gap-2 px-4 py-2 bg-linear-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-amber-950 font-black text-xs sm:text-sm shadow-md shadow-amber-500/20 hover:scale-105 active:scale-95 cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-amber-950" />
                  <span>{bestScore ? 'Luyện Lại' : 'Bắt Đầu Thi'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
