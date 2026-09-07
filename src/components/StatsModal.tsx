import React from 'react';
import { Card, UserStats } from '../types';
import { MOCHI_LEVEL_INFO } from '../utils/srs';
import { X, Flame, Sparkles, Trophy, TrendingUp, CheckCircle2 } from 'lucide-react';
import { Mascot } from './Mascot';

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: UserStats;
  cards: Card[];
}

export const StatsModal: React.FC<StatsModalProps> = ({
  isOpen,
  onClose,
  stats,
  cards,
}) => {
  if (!isOpen) return null;

  const totalCards = cards.length;
  const levelCounts: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  cards.forEach((c) => {
    const lvl = c.level ?? 0;
    levelCounts[lvl] = (levelCounts[lvl] || 0) + 1;
  });

  const deepMemoryCount = (levelCounts[4] || 0) + (levelCounts[5] || 0);
  const masteryPercentage = totalCards > 0 ? Math.round((deepMemoryCount / totalCards) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fadeIn">
      <div className="liquid-glass-modal rounded-3xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6 animate-scaleUp shadow-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl liquid-glass-subtle flex items-center justify-center text-indigo-500 dark:text-indigo-300 shadow-inner">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-[#2E241E] dark:text-slate-100">
                Thống Kê Tiến Độ Học Tập
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                Theo dõi sự phát triển trí nhớ Spaced Repetition của bạn
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="liquid-glass-subtle p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl transition-all cursor-pointer hover:scale-105"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top Highlight Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 liquid-glass-subtle rounded-2xl text-center border-amber-500/20">
            <Flame className="w-5 h-5 text-amber-500 mx-auto mb-1 animate-mochi-pulse" />
            <div className="text-xl font-black text-amber-600 dark:text-amber-400">{stats.streak} ngày</div>
            <div className="text-[11px] font-bold text-amber-700 dark:text-amber-300">Chuỗi học liên tục</div>
          </div>

          <div className="p-3.5 liquid-glass-subtle rounded-2xl text-center border-yellow-500/20">
            <Sparkles className="w-5 h-5 text-amber-400 mx-auto mb-1" />
            <div className="text-xl font-black text-amber-600 dark:text-amber-300">{stats.xp}</div>
            <div className="text-[11px] font-bold text-amber-700 dark:text-amber-400">Tổng điểm XP</div>
          </div>

          <div className="p-3.5 liquid-glass-subtle rounded-2xl text-center border-emerald-500/20">
            <CheckCircle2 className="w-5 h-5 text-emerald-500 dark:text-emerald-400 mx-auto mb-1" />
            <div className="text-xl font-black text-emerald-600 dark:text-emerald-400">{stats.totalReviews}</div>
            <div className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300">Lượt ôn tập</div>
          </div>

          <div className="p-3.5 liquid-glass-subtle rounded-2xl text-center border-purple-500/20">
            <Trophy className="w-5 h-5 text-purple-500 dark:text-purple-400 mx-auto mb-1" />
            <div className="text-xl font-black text-purple-600 dark:text-purple-300">Cấp {stats.level}</div>
            <div className="text-[11px] font-bold text-purple-700 dark:text-purple-300">Cấp bậc Mochi</div>
          </div>
        </div>

        {/* 6-Level Memory Breakdown */}
        <div className="liquid-glass-subtle rounded-3xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase text-slate-600 dark:text-slate-300">
              Phân Phối 6 Cấp Độ Trí Nhớ
            </span>
            <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
              {masteryPercentage}% Thuộc sâu
            </span>
          </div>

          {([5, 4, 3, 2, 1, 0] as const).map((lvl) => {
            const count = levelCounts[lvl] || 0;
            const pct = totalCards > 0 ? Math.round((count / totalCards) * 100) : 0;
            const info = MOCHI_LEVEL_INFO[lvl];

            return (
              <div key={lvl} className="space-y-1">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="flex items-center gap-1.5" style={{ color: info.color }}>
                    <span>{info.emoji}</span>
                    <span>{info.name} (Cấp {lvl})</span>
                  </span>
                  <span className="text-slate-600 dark:text-slate-400 font-semibold">
                    {count} từ ({pct}%)
                  </span>
                </div>
                <div className="w-full h-2.5 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500 shadow-xs"
                    style={{ width: `${pct}%`, backgroundColor: info.color }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Mascot cheer message */}
        <div className="p-4 liquid-glass-subtle rounded-3xl flex items-center gap-4 border-amber-400/30">
          <Mascot mood="cheering" size="sm" />
          <div className="text-xs text-amber-900 dark:text-amber-100 font-bold leading-relaxed">
            Mỗi ngày chỉ cần dành 10-15 phút ôn tập đúng vào <strong>Thời Điểm Vàng</strong>, bạn sẽ chuyển toàn bộ từ vựng sang trí nhớ dài hạn vĩnh viễn!
          </div>
        </div>
      </div>
    </div>
  );
};
