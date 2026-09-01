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
    <div className="w-full bg-white dark:bg-slate-800/90 rounded-3xl p-5 sm:p-7 border border-[#E9E4F0] shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
      <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-[#FFF9E6] opacity-60 pointer-events-none" />

      {/* Header & Golden Time Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3.5">
          <Mascot
            mood={isGoldenTime ? 'cheering' : 'proud'}
            size="sm"
            message={isGoldenTime ? 'Tới giờ ôn tập rồi nè!' : 'Trí nhớ đang rất tốt!'}
          />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black text-[#2D221D] tracking-tight">
                Thời Điểm Vàng
              </h2>
              <span className="px-2 py-0.5 rounded-full text-xs font-black uppercase bg-[#FFF4D4] text-[#B87503] border border-[#FFE28A] flex items-center gap-1">
                <Sparkles className="w-3 h-3 fill-[#F5A623]" /> SRS AI
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[#7A6E66] font-medium mt-0.5">
              Não bộ ghi nhớ sâu nhất khi ôn lại đúng thời điểm Spaced Repetition.
            </p>
          </div>
        </div>

        {/* Action Button */}
        <div>
          {isGoldenTime ? (
            <button
              onClick={onReviewDueCards}
              className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-6 py-3 bg-linear-to-r from-[#FF9F1C] via-[#FF8A00] to-[#E85D04] hover:from-[#FF8A00] hover:to-[#DC2F02] text-white font-extrabold text-base rounded-2xl shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 transition-all hover:scale-105 active:scale-95 animate-mochi-pulse"
            >
              <Zap className="w-5 h-5 fill-white" />
              <span>Ôn Tập Ngay ({dueCards.length} từ)</span>
            </button>
          ) : (
            <div className="flex items-center gap-2 px-4 py-2.5 bg-[#F0FDF4] border border-[#BBF7D0] rounded-2xl text-[#15803D] text-sm font-bold">
              <Clock className="w-4 h-4 text-[#16A34A]" />
              <span>
                {nextReviewInText
                  ? `Thời điểm vàng tiếp theo: ${nextReviewInText}`
                  : 'Đã hoàn thành xuất sắc tất cả từ!'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 5 Memory Levels Progress Dashboard */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-xs sm:text-sm font-extrabold text-[#4A3B32] uppercase tracking-wider">
            5 Cấp Độ Ghi Nhớ ({totalCards} từ vựng)
          </span>
          <span className="text-xs font-bold text-[#8C827A]">
            Cấp 5: {Math.round(((levelCounts[5] || 0) / (totalCards || 1)) * 100)}% thành thạo
          </span>
        </div>

        {/* Segmented Color Bar */}
        <div className="w-full h-3.5 bg-[#F1EFF7] rounded-full overflow-hidden flex p-0.5 gap-0.5 shadow-inner">
          {([0, 1, 2, 3, 4, 5] as MemoryLevel[]).map((lvl) => {
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
                className="h-full rounded-full transition-all duration-500 relative group cursor-pointer"
                title={`${info.name}: ${count} từ (${pct.toFixed(1)}%)`}
              />
            );
          })}
        </div>

        {/* 6 Individual Level Cards Grid */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5 mt-4">
          {([0, 1, 2, 3, 4, 5] as MemoryLevel[]).map((lvl) => {
            const count = levelCounts[lvl];
            const info = MOCHI_LEVEL_INFO[lvl];
            const isClickable = count > 0 && onReviewLevel;

            return (
              <div
                key={lvl}
                onClick={() => isClickable && onReviewLevel(lvl)}
                className={`p-3 rounded-2xl border transition-all ${
                  isClickable ? 'cursor-pointer hover:scale-105 hover:shadow-xs' : ''
                }`}
                style={{
                  backgroundColor: info.bg,
                  borderColor: info.borderColor,
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-lg">{info.emoji}</span>
                  <span
                    className="text-lg font-black"
                    style={{ color: info.color }}
                  >
                    {count}
                  </span>
                </div>
                <div className="mt-1">
                  <div
                    className="text-xs font-bold leading-tight"
                    style={{ color: info.color }}
                  >
                    {info.name}
                  </div>
                  <div className="text-[10px] text-slate-500 font-semibold">
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
