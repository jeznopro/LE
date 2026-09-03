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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-800/95 rounded-3xl w-full max-w-xl max-h-[90vh] overflow-y-auto border border-[#E9E4F0] dark:border-slate-700 shadow-2xl p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-700 dark:text-indigo-300">
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
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top Highlight Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 bg-[#FFF4E5] dark:bg-[#FFF4E5]/10 border border-[#FFD8A8] dark:border-transparent rounded-2xl text-center">
            <Flame className="w-5 h-5 text-[#F76707] mx-auto fill-[#FFA94D] mb-1 animate-mochi-pulse" />
            <div className="text-xl font-black text-[#D9480F] dark:text-[#FFA94D]">{stats.streak} ngày</div>
            <div className="text-[11px] font-bold text-[#E8590C] dark:text-[#FFC078]">Chuỗi học liên tục</div>
          </div>

          <div className="p-3.5 bg-[#FFF9DB] dark:bg-[#FFF9DB]/10 border border-[#FFE066] dark:border-transparent rounded-2xl text-center">
            <Sparkles className="w-5 h-5 text-[#F59F00] mx-auto fill-[#FFD43B] mb-1" />
            <div className="text-xl font-black text-[#E67700] dark:text-[#FFD43B]">{stats.xp}</div>
            <div className="text-[11px] font-bold text-[#F59F00] dark:text-[#FFE066]">Tổng điểm XP</div>
          </div>

          <div className="p-3.5 bg-[#EBFBEE] dark:bg-[#EBFBEE]/10 border border-[#B2F2BB] dark:border-transparent rounded-2xl text-center">
            <CheckCircle2 className="w-5 h-5 text-[#2B8A3E] dark:text-[#69DB7C] mx-auto mb-1" />
            <div className="text-xl font-black text-[#2B8A3E] dark:text-[#51CF66]">{stats.totalReviews}</div>
            <div className="text-[11px] font-bold text-[#2F9E44] dark:text-[#8CE99A]">Lượt ôn tập</div>
          </div>

          <div className="p-3.5 bg-[#F3F0FA] dark:bg-[#F3F0FA]/10 border border-[#D0BFFF] dark:border-transparent rounded-2xl text-center">
            <Trophy className="w-5 h-5 text-[#7048E8] dark:text-[#9775FA] mx-auto mb-1" />
            <div className="text-xl font-black text-[#7048E8] dark:text-[#845EF7]">Cấp {stats.level}</div>
            <div className="text-[11px] font-bold text-[#7048E8] dark:text-[#B197FC]">Cấp bậc Mochi</div>
          </div>
        </div>

        {/* 6-Level Memory Breakdown */}
        <div className="bg-slate-50 dark:bg-slate-700/50 rounded-2xl p-4 border border-slate-200 dark:border-slate-600 space-y-3">
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
                  <span className="text-slate-600 dark:text-slate-400">
                    {count} từ ({pct}%)
                  </span>
                </div>
                <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-600 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, backgroundColor: info.color }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Mascot cheer message */}
        <div className="p-4 bg-linear-to-r from-amber-50 to-orange-50 dark:from-amber-900/30 dark:to-orange-900/30 border border-amber-200 dark:border-amber-800/50 rounded-2xl flex items-center gap-4">
          <Mascot mood="cheering" size="sm" />
          <div className="text-xs text-amber-900 dark:text-amber-100 font-bold">
            Mỗi ngày chỉ cần dành 10-15 phút ôn tập đúng vào <strong>Thời Điểm Vàng</strong>, bạn sẽ chuyển toàn bộ từ vựng sang trí nhớ dài hạn vĩnh viễn!
          </div>
        </div>
      </div>
    </div>
  );
};
