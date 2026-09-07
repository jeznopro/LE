import React, { useState } from 'react';
import { Deck, Card, MemoryLevel, StudyMode } from '../types';
import { MOCHI_LEVEL_INFO, isCardDue, formatIntervalPreview } from '../utils/srs';
import { ttsService } from '../utils/tts';
import { soundManager } from '../utils/sounds';
import {
  ArrowLeft,
  Plus,
  Volume2,
  Edit2,
  Trash2,
  Search,
  Play,
  Clock,
  Mic,
} from 'lucide-react';

interface DeckDetailProps {
  deck: Deck;
  cards: Card[];
  onBack: () => void;
  onStartStudy: (deckId: string, mode: StudyMode) => void;
  onAddCard: (deckId: string) => void;
  onEditCard: (card: Card) => void;
  onDeleteCard: (cardId: string) => void;
}

export const DeckDetail: React.FC<DeckDetailProps> = ({
  deck,
  cards,
  onBack,
  onStartStudy,
  onAddCard,
  onEditCard,
  onDeleteCard,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<number | 'all'>('all');

  const deckCards = cards.filter((c) => c.deckId === deck.id);
  const dueCards = deckCards.filter(isCardDue);

  const filteredCards = deckCards.filter((c) => {
    const matchSearch =
      c.front.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.back.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.example && c.example.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchLevel = selectedLevel === 'all' || c.level === selectedLevel;

    return matchSearch && matchLevel;
  });

  const handleSpeak = (text: string, e: React.MouseEvent) => {
    e.stopPropagation();
    soundManager.playClick();
    ttsService.speak(text);
  };

  return (
    <div className="w-full space-y-6">
      {/* Top Header & Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="liquid-glass-pill flex items-center gap-2 px-4 py-2 text-slate-700 dark:text-slate-200 font-bold text-sm hover:scale-105 active:scale-95 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại danh sách</span>
        </button>

        <button
          onClick={() => onAddCard(deck.id)}
          className="liquid-glass-pill flex items-center gap-2 px-5 py-2.5 bg-linear-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-amber-950 font-black text-sm shadow-lg shadow-amber-500/20 hover:scale-105 active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Thêm Từ Mới</span>
        </button>
      </div>

      {/* Deck Hero Banner */}
      <div className="liquid-glass-card rounded-3xl p-6 sm:p-8 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-5 relative z-10">
          <div
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl flex items-center justify-center text-4xl shadow-inner border border-white/40 dark:border-white/10 shrink-0"
            style={{ backgroundColor: `${deck.color || '#FED770'}40` }}
          >
            {deck.emoji || '📚'}
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#2E241E] dark:text-white tracking-tight">
              {deck.title}
            </h1>
            <p className="text-sm text-[#7A6E66] dark:text-slate-300 font-medium mt-1">
              {deck.description || 'Bộ thẻ học từ vựng'}
            </p>
            <div className="flex items-center gap-3 mt-2.5">
              <span className="liquid-glass-pill text-xs font-black px-3 py-1 text-slate-700 dark:text-slate-300">
                {deckCards.length} từ vựng
              </span>
              {dueCards.length > 0 && (
                <span className="liquid-glass-pill text-xs font-black px-3 py-1 text-rose-600 dark:text-rose-400 bg-rose-500/15 border-rose-400/30 animate-mochi-pulse">
                  {dueCards.length} từ cần ôn tập ngay
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Start Study Big Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto relative z-10">
          <button
            onClick={() => onStartStudy(deck.id, 'mochi')}
            className="liquid-glass-pill flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3.5 bg-linear-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-500 text-white font-black text-sm sm:text-base rounded-2xl shadow-lg shadow-amber-500/25 transition-all hover:scale-105 active:scale-95 cursor-pointer"
          >
            <span className="text-xl">🐻</span>
            <span>Học We Bare Bears (3 Bước)</span>
          </button>

          <button
            onClick={() => onStartStudy(deck.id, 'quiz')}
            className="liquid-glass-pill flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-3.5 bg-linear-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white font-black text-sm sm:text-base rounded-2xl shadow-lg shadow-indigo-500/25 transition-all hover:scale-105 active:scale-95 cursor-pointer"
          >
            <span className="text-xl">🎯</span>
            <span>Trắc Nghiệm</span>
          </button>

          <button
            onClick={() => onStartStudy(deck.id, 'flashcard')}
            className="liquid-glass-pill flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-3.5 bg-linear-to-r from-amber-300 to-amber-400 hover:from-amber-200 hover:to-amber-300 text-amber-950 font-black text-sm sm:text-base rounded-2xl shadow-md shadow-amber-500/20 transition-all hover:scale-105 active:scale-95 cursor-pointer"
          >
            <Play className="w-5 h-5 fill-amber-950" />
            <span>Lật Thẻ SRS</span>
          </button>

          <button
            onClick={() => onStartStudy(deck.id, 'speaking')}
            className="liquid-glass-pill flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-3.5 bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-700 dark:text-cyan-300 border border-cyan-400/30 font-black text-sm rounded-2xl shadow-sm transition-all hover:scale-105 active:scale-95 cursor-pointer"
          >
            <Mic className="w-5 h-5" />
            <span>Phát Âm AI</span>
          </button>
        </div>
      </div>

      {/* Search & Filter bar */}
      <div className="liquid-glass-subtle flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-3xl">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm kiếm từ trong bộ này..."
            className="liquid-glass-input w-full pl-9 pr-4 py-2 text-xs font-semibold rounded-2xl"
          />
        </div>

        {/* Level Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          <button
            onClick={() => setSelectedLevel('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedLevel === 'all'
                ? 'liquid-glass-pill shadow-xs ring-2 ring-amber-400/40 text-slate-900 dark:text-white font-black'
                : 'liquid-glass-subtle text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Tất cả ({deckCards.length})
          </button>

          {([0, 1, 2, 3, 4, 5] as MemoryLevel[]).map((lvl) => {
            const count = deckCards.filter((c) => (c.level ?? 0) === lvl).length;
            const info = MOCHI_LEVEL_INFO[lvl];
            const isSelected = selectedLevel === lvl;

            return (
              <button
                key={lvl}
                onClick={() => setSelectedLevel(lvl)}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                  isSelected
                    ? 'shadow-md ring-2 ring-white/60 dark:ring-white/20'
                    : 'opacity-80 hover:opacity-100 hover:scale-105'
                }`}
                style={{
                  backgroundColor: isSelected ? info.color : info.bg,
                  color: isSelected ? '#FFFFFF' : info.color,
                }}
              >
                <span>{info.emoji}</span>
                <span>Cấp {lvl}</span>
                <span className="text-[10px] opacity-90">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Cards List */}
      {filteredCards.length === 0 ? (
        <div className="liquid-glass-card text-center py-16 rounded-3xl p-8">
          <div className="text-4xl mb-2">🔍</div>
          <p className="font-bold text-slate-700 dark:text-slate-300">Không tìm thấy từ vựng nào phù hợp bộ lọc.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredCards.map((card) => {
            const lvlInfo = MOCHI_LEVEL_INFO[card.level || 1];
            const isDue = isCardDue(card);

            return (
              <div
                key={card.id}
                className="liquid-glass-card rounded-3xl p-4 sm:p-5 flex flex-col justify-between group transition-all duration-300 hover:scale-[1.01]"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-black text-lg sm:text-xl text-[#2D221D] dark:text-white">
                        {card.front}
                      </span>

                      <button
                        onClick={(e) => handleSpeak(card.front, e)}
                        title="Phát âm từ này"
                        className="liquid-glass-subtle p-1.5 text-slate-500 hover:text-amber-500 rounded-xl transition-all hover:scale-110 cursor-pointer"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>

                      {card.partOfSpeech && (
                        <span className="liquid-glass-subtle text-[11px] font-bold px-2 py-0.5 rounded-lg text-slate-600 dark:text-purple-300">
                          {card.partOfSpeech}
                        </span>
                      )}
                    </div>

                    <div
                      className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black border shrink-0 backdrop-blur-md"
                      style={{
                        backgroundColor: lvlInfo.bg,
                        color: lvlInfo.color,
                        borderColor: lvlInfo.borderColor,
                      }}
                    >
                      <span>{lvlInfo.emoji}</span>
                      <span>{lvlInfo.name}</span>
                    </div>
                  </div>

                  {card.phonetic && (
                    <div className="text-xs font-mono text-slate-500 dark:text-slate-400 mt-0.5">
                      {card.phonetic}
                    </div>
                  )}

                  <div className="liquid-glass-subtle font-bold text-sm sm:text-base text-slate-800 dark:text-amber-100 mt-2.5 p-2.5 rounded-2xl border border-white/40 dark:border-white/10">
                    {card.back}
                  </div>

                  {card.example && (
                    <div className="mt-2.5 text-xs text-slate-600 dark:text-slate-300 italic bg-amber-500/10 dark:bg-amber-400/10 backdrop-blur-md p-2.5 rounded-2xl border border-amber-300/20 dark:border-amber-400/20">
                      <div className="font-medium text-slate-800 dark:text-slate-200">&ldquo;{card.example}&rdquo;</div>
                      {card.exampleMeaning && (
                        <div className="text-slate-500 dark:text-slate-400 not-italic mt-0.5">
                          👉 {card.exampleMeaning}
                        </div>
                      )}
                    </div>
                  )}

                  {card.image && (
                    <div className="mt-2.5 rounded-2xl overflow-hidden max-h-36 border border-white/30 dark:border-white/10 bg-slate-900/10 dark:bg-black/20">
                      <img
                        src={card.image}
                        alt={card.front}
                        loading="lazy"
                        className="w-full h-full object-cover max-h-36 hover:scale-105 transition-transform"
                        onError={(e) => {
                          (e.currentTarget as HTMLElement).style.display = 'none';
                        }}
                      />
                    </div>
                  )}

                  {card.relatedWords && (
                    <div className="mt-2 text-[11px] font-semibold text-purple-700 dark:text-purple-300 bg-purple-500/10 dark:bg-purple-400/10 backdrop-blur-md px-2.5 py-1 rounded-xl border border-purple-300/20 dark:border-purple-800/30">
                      🔗 <span className="font-bold">Từ liên quan:</span> {card.relatedWords}
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-white/40 dark:border-white/10 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      {isDue ? (
                        <strong className="text-rose-500 font-bold">Đến hạn ôn tập</strong>
                      ) : (
                        `Ôn lại sau: ${formatIntervalPreview(card.interval || 1)}`
                      )}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onEditCard(card)}
                      title="Sửa từ"
                      className="liquid-glass-subtle p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-xl transition-all hover:scale-110 cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteCard(card.id)}
                      title="Xóa từ"
                      className="liquid-glass-subtle p-1.5 text-slate-500 hover:text-rose-500 rounded-xl transition-all hover:scale-110 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
