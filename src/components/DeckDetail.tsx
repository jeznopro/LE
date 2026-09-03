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
          className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800/90 hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-sm rounded-2xl shadow-2xs transition-all hover:scale-105 active:scale-95"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại danh sách</span>
        </button>

        <button
          onClick={() => onAddCard(deck.id)}
          className="flex items-center gap-2 px-5 py-2.5 bg-linear-to-r from-[#FFD13B] to-[#FFAA00] hover:from-[#FFC61A] hover:to-[#E69900] text-[#4A3200] font-black text-sm rounded-2xl shadow-sm transition-all hover:scale-105 active:scale-95"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Thêm Từ Mới</span>
        </button>
      </div>

      {/* Deck Hero Banner */}
      <div className="bg-white dark:bg-slate-900/90 rounded-3xl p-6 sm:p-8 border border-[#E9E4F0] dark:border-slate-800 shadow-xs relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl flex items-center justify-center text-4xl shadow-sm"
            style={{ backgroundColor: `${deck.color || '#FED770'}33` }}
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
              <span className="text-xs font-black px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-700 dark:text-slate-300">
                {deckCards.length} từ vựng
              </span>
              {dueCards.length > 0 && (
                <span className="text-xs font-black px-3 py-1 bg-rose-100 dark:bg-rose-950/60 rounded-full text-rose-600 dark:text-rose-300 animate-mochi-pulse">
                  {dueCards.length} từ cần ôn tập ngay
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Start Study Big Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <button
            onClick={() => onStartStudy(deck.id, 'mochi')}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3.5 bg-linear-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 text-white font-black text-sm sm:text-base rounded-2xl shadow-md hover:shadow-lg transition-all hover:scale-105 active:scale-95 cursor-pointer ring-2 ring-amber-400/60 drop-shadow-xs"
          >
            <span className="text-xl">🐻</span>
            <span>Học We Bare Bears (3 Bước)</span>
          </button>

          <button
            onClick={() => onStartStudy(deck.id, 'quiz')}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-3.5 bg-linear-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-black text-sm sm:text-base rounded-2xl shadow-md transition-all hover:scale-105 active:scale-95 cursor-pointer ring-2 ring-purple-400/50"
          >
            <span className="text-xl">🎯</span>
            <span>Trắc Nghiệm</span>
          </button>

          <button
            onClick={() => onStartStudy(deck.id, 'flashcard')}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-3.5 bg-linear-to-r from-[#FED770] to-[#FFB703] hover:from-[#FFCA3A] hover:to-[#FB8500] text-[#543800] font-black text-sm sm:text-base rounded-2xl shadow-sm transition-all hover:scale-105 active:scale-95 cursor-pointer"
          >
            <Play className="w-5 h-5 fill-[#543800]" />
            <span>Lật Thẻ SRS</span>
          </button>

          <button
            onClick={() => onStartStudy(deck.id, 'speaking')}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-3.5 bg-cyan-50 dark:bg-cyan-950/60 hover:bg-cyan-100 dark:hover:bg-cyan-900/60 text-cyan-700 dark:text-cyan-300 font-black text-sm rounded-2xl border-2 border-cyan-300 dark:border-cyan-700 shadow-sm transition-all hover:scale-105 active:scale-95 cursor-pointer"
          >
            <Mic className="w-5 h-5" />
            <span>Phát Âm AI</span>
          </button>
        </div>
      </div>

      {/* Search & Filter bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900/90 p-4 rounded-2xl border border-[#E9E4F0] dark:border-slate-800 shadow-2xs">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm kiếm từ trong bộ này..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-xl text-xs font-semibold focus:outline-hidden focus:border-amber-400"
          />
        </div>

        {/* Level Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          <button
            onClick={() => setSelectedLevel('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              selectedLevel === 'all'
                ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
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
                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                  isSelected
                    ? 'shadow-xs ring-2 ring-offset-1'
                    : 'opacity-80 hover:opacity-100'
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
        <div className="text-center py-16 bg-white dark:bg-slate-900/90 rounded-3xl border border-dashed border-[#DDD6EB] dark:border-slate-800 p-8">
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
                className="bg-white dark:bg-slate-900/90 rounded-2xl border border-[#E9E4F0] dark:border-slate-800 p-4 sm:p-5 shadow-2xs hover:shadow-sm transition-all flex flex-col justify-between group"
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
                        className="p-1.5 text-slate-400 hover:text-[#F59F00] hover:bg-[#FFF9DB] dark:hover:bg-slate-800 rounded-xl transition-colors"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>

                      {card.partOfSpeech && (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-purple-300">
                          {card.partOfSpeech}
                        </span>
                      )}
                    </div>

                    <div
                      className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black border shrink-0"
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

                  <div className="font-bold text-sm sm:text-base text-[#1E293B] dark:text-amber-200 mt-2.5 bg-[#FAF9FD] dark:bg-slate-800/80 p-2.5 rounded-xl border border-[#F0EDF5] dark:border-slate-700">
                    {card.back}
                  </div>

                  {card.example && (
                    <div className="mt-2.5 text-xs text-slate-600 dark:text-slate-300 italic bg-amber-50/50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-amber-100 dark:border-slate-700">
                      <div className="font-medium text-slate-700 dark:text-slate-200">&ldquo;{card.example}&rdquo;</div>
                      {card.exampleMeaning && (
                        <div className="text-slate-500 dark:text-slate-400 not-italic mt-0.5">
                          👉 {card.exampleMeaning}
                        </div>
                      )}
                    </div>
                  )}

                  {card.image && (
                    <div className="mt-2.5 rounded-xl overflow-hidden max-h-36 border border-slate-200 dark:border-slate-700 bg-slate-100">
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
                    <div className="mt-2 text-[11px] font-semibold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/40 px-2.5 py-1 rounded-xl border border-purple-200 dark:border-purple-800">
                      🔗 <span className="font-bold">Từ liên quan:</span> {card.relatedWords}
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      {isDue ? (
                        <strong className="text-rose-600">Đến hạn ôn tập</strong>
                      ) : (
                        `Ôn lại sau: ${formatIntervalPreview(card.interval || 1)}`
                      )}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onEditCard(card)}
                      title="Sửa từ"
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteCard(card.id)}
                      title="Xóa từ"
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
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
