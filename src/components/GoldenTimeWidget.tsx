import React from 'react';
import { Card, MemoryLevel } from '../types';
import { MOCHI_LEVEL_INFO, isCardDue } from '../utils/srs';
import { Clock, Zap, Sparkles } from 'lucide-react';
import { Mascot } from './Mascot';

interface GoldenTimeWidgetProps {
  cards: Card[];
  onReviewDueCards: () => void;
  onReviewLevel?: (level: MemoryLevel) => void;
}

export const GoldenTimeWidget: React.FC<GoldenTimeWidgetProps> = ({
  cards,
  onReviewDueCards,
  onReviewLevel,
}) => {
  const levelCounts: Record<MemoryLevel, number> = {
    0: 0,
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  };

  const dueCards = cards.filter(isCardDue);

  cards.forEach((c) => {
    const lvl = (c.level ?? 0) as MemoryLevel;
    levelCounts[lvl] = (levelCounts[lvl] || 0) + 1;
  });

  const totalCards = cards.length;

  let nextReviewInText = '';
  if (dueCards.length === 0 && cards.length > 0) {
    const upcomingTimestamps = cards
      .map((c) => c.nextReview)
      .filter((t) => t > Date.now())
      .sort((a, b) => a - b);

    if (upcomingTimestamps.length > 0) {
      const diffMs = upcomingTimestamps[0] - Date.now();
      const diffMins = Math.round(diffMs / 60000);
      if (diffMins < 60) {
        nextReviewInText = `${diffMins} phút nữa`;
      } else if (diffMins < 1440) {
        nextReviewInText = `${Math.round(diffMins / 60)} giờ nữa`;
      } else {
        nextReviewInText = `${Math.round(diffMins / 1440)} ngày nữa`;
      }
    }
  }

  const isGoldenTime = dueCards.length > 0;

  return (
    <div className="liquid-glass-card w-full rounded-3xl p-5 sm:p-7 relative overflow-hidden">
      {/* Specular ambient light refraction */}
      <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-gradient-to-br from-amber-400/20 via-orange-300/15 to-transparent blur-2xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 w-56 h-56 rounded-full bg-gradient-to-tr from-rose-400/15 via-purple-300/10 to-transparent blur-2xl pointer-events-none" />

      {/* Header & Golden Time Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 relative z-10">
        <div className="flex items-center gap-3.5">
          <Mascot
            mood={isGoldenTime ? 'cheering' : 'proud'}
            size="sm"
            message={isGoldenTime ? 'Tới giờ ôn tập rồi nè!' : 'Trí nhớ đang rất tốt!'}
          />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Thời Điểm Vàng
              </h2>
              <span className="liquid-glass-subtle px-2.5 py-0.5 rounded-full text-xs font-black uppercase text-amber-600 dark:text-amber-300 border border-amber-300/60 dark:border-amber-500/30 flex items-center gap-1 shadow-2xs">
                <Sparkles className="w-3 h-3 fill-amber-500 text-amber-500" /> SRS AI
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium mt-0.5">
              Não bộ ghi nhớ sâu nhất khi ôn lại đúng thời điểm Spaced Repetition.
            </p>
          </div>
        </div>

        {/* Action Button: Review Due Cards if available */}
        {isGoldenTime && onReviewDueCards && (
          <button
            onClick={onReviewDueCards}
            className="liquid-glass-pill self-start md:self-center px-4 py-2.5 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white font-black text-xs sm:text-sm rounded-full shadow-lg shadow-orange-500/25 flex items-center gap-2 cursor-pointer border border-white/50"
          >
            <Zap className="w-4 h-4 fill-amber-200" />
            <span>Ôn {dueCards.length} từ đến hạn ngay</span>
            <span>➔</span>
          </button>
        )}
      </div>

      {/* 5 Memory Levels Progress Dashboard */}
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-xs sm:text-sm font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
            5 Cấp Độ Ghi Nhớ ({totalCards} từ vựng)
          </span>
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
            Cấp 5: {Math.round(((levelCounts[5] || 0) / (totalCards || 1)) * 100)}% thành thạo
          </span>
        </div>

        {/* Segmented Liquid Glass Bar */}
        <div className="w-full h-3.5 liquid-glass-subtle rounded-full overflow-hidden flex p-0.5 gap-0.5 border border-white/60 dark:border-white/10">
          {([1, 2, 3, 4, 5] as MemoryLevel[]).map((lvl) => {
            const count = levelCounts[lvl];
            const pct = totalCards > 0 ? (count / totalCards) * 100 : 0;
            const info = MOCHI_LEVEL_INFO[lvl];
            if (count === 0) return null;
            return (
              <div
                key={lvl}
                style={{
                  width: `${pct}%`,
                  backgroundColor: info.color,
                }}
                className="h-full rounded-full transition-all duration-500 relative group cursor-pointer shadow-xs"
                title={`${info.name}: ${count} từ (${pct.toFixed(1)}%)`}
              />
            );
          })}
        </div>

        {/* 5 Individual Active Level Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 mt-4">
          {([1, 2, 3, 4, 5] as MemoryLevel[]).map((lvl) => {
            const count = levelCounts[lvl];
            const info = MOCHI_LEVEL_INFO[lvl];
            const isClickable = count > 0 && onReviewLevel;

            return (
              <div
                key={lvl}
                onClick={() => isClickable && onReviewLevel(lvl)}
                className={`liquid-glass-subtle p-3 rounded-2xl border transition-all duration-300 ${
                  isClickable 
                    ? 'cursor-pointer hover:scale-105 hover:shadow-md hover:border-amber-400/60' 
                    : 'opacity-85'
                }`}
                style={{
                  borderColor: `${info.color}40`,
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-lg filter drop-shadow-xs">{info.emoji}</span>
                  <span
                    className="text-lg font-black"
                    style={{ color: info.color }}
                  >
                    {count}
                  </span>
                </div>
                <div className="mt-1">
                  <div
                    className="text-xs font-bold leading-tight truncate"
                    style={{ color: info.color }}
                  >
                    {info.name}
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
                    Cấp {lvl}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
