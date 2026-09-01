import React, { useState } from 'react';
import { Deck, Card, StudyMode } from '../types';
import { isCardDue, MOCHI_LEVEL_INFO } from '../utils/srs';
import {
  Plus,
  UploadCloud,
  Play,
  Edit3,
  Trash2,
  Search,
  BookOpen,
  Keyboard,
  ListOrdered,
  FolderOpen,
  ArrowLeft,
  Trash,
} from 'lucide-react';

interface DeckListProps {
  decks: Deck[];
  cards: Card[];
  onStartStudy: (deckId: string, mode: StudyMode) => void;
  onViewDeckDetail: (deckId: string) => void;
  onCreateDeck: () => void;
  onImportDeck: () => void;
  onDeleteDeck: (deckId: string) => void;
  onEditDeck: (deck: Deck) => void;
}

export const DeckList: React.FC<DeckListProps> = ({
  decks,
  cards,
  onStartStudy,
  onViewDeckDetail,
  onCreateDeck,
  onImportDeck,
  onDeleteDeck,
  onEditDeck,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFolder, setActiveFolder] = useState<string | null>(null);

  const filteredDecks = decks.filter(
    (d) =>
      d.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (d.folder && d.folder.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (d.description && d.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Group by folder
  const folders: Record<string, Deck[]> = {};
  const standaloneDecks: Deck[] = [];

  filteredDecks.forEach(d => {
    if (d.folder) {
      if (!folders[d.folder]) folders[d.folder] = [];
      folders[d.folder].push(d);
    } else {
      standaloneDecks.push(d);
    }
  });

  // Decide what to render
  const decksToRender = activeFolder ? (folders[activeFolder] || []) : standaloneDecks;

  const handleDeleteFolder = (folderName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Bạn có chắc chắn muốn xóa TOÀN BỘ thư mục "${folderName}" và tất cả bộ thẻ bên trong?`)) {
      const decksInFolder = folders[folderName] || [];
      decksInFolder.forEach(d => onDeleteDeck(d.id));
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Search & Actions Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm kiếm bộ thẻ từ vựng..."
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800/90 border border-[#E4E0EC] rounded-2xl text-sm font-medium focus:outline-hidden focus:border-[#FF9F1C] focus:ring-2 focus:ring-[#FF9F1C]/20 transition-all"
          />
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            onClick={onImportDeck}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 bg-white dark:bg-slate-800/90 hover:bg-slate-50 border border-[#DCD6E8] text-[#554640] font-bold text-sm rounded-2xl shadow-xs transition-all hover:scale-105 active:scale-95"
          >
            <UploadCloud className="w-4 h-4 text-[#FF708F]" />
            <span>Nhập Deck (.apkg/CSV)</span>
          </button>

          <button
            onClick={onCreateDeck}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-5 py-2.5 bg-linear-to-r from-[#FFD13B] to-[#FFAA00] hover:from-[#FFC61A] hover:to-[#E69900] text-[#4A3200] font-extrabold text-sm rounded-2xl shadow-sm hover:shadow-md transition-all hover:scale-105 active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Tạo Bộ Thẻ Mới</span>
          </button>
        </div>
      </div>

      {/* Decks Grid */}
      {filteredDecks.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-800/90 rounded-3xl border border-dashed border-[#DDD6EB] p-8">
          <div className="text-5xl mb-3">📦</div>
          <h3 className="text-lg font-bold text-[#4A3B32]">Chưa tìm thấy bộ thẻ nào</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
            Hãy tạo mới một bộ thẻ từ vựng hoặc nhập trực tiếp file .apkg của Anki để bắt đầu học ngay!
          </p>
          <div className="mt-5 flex justify-center gap-3">
            <button
              onClick={onCreateDeck}
              className="px-5 py-2.5 bg-[#FED770] font-extrabold text-sm text-[#5B3E06] rounded-2xl shadow-sm"
            >
              Tạo Deck Mới
            </button>
            <button
              onClick={onImportDeck}
              className="px-5 py-2.5 bg-white dark:bg-slate-800/90 border border-slate-300 font-bold text-sm text-slate-700 rounded-2xl"
            >
              Nhập từ Anki
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {activeFolder && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setActiveFolder(null)}
                  className="p-2 bg-white dark:bg-slate-800 rounded-xl shadow-xs hover:bg-slate-50 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                </button>
                <h2 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
                  <FolderOpen className="w-6 h-6 fill-amber-200 text-amber-500" /> {activeFolder}
                </h2>
              </div>
              <button
                onClick={(e) => handleDeleteFolder(activeFolder, e)}
                className="px-3 py-1.5 flex items-center gap-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-sm font-bold transition-colors"
              >
                <Trash2 className="w-4 h-4" /> Xóa Nhóm
              </button>
            </div>
          )}

          <div className={activeFolder ? "space-y-4" : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"}>
            {/* Render Folders if not inside a folder */}
            {!activeFolder &&
              Object.entries(folders).map(([folderName, folderDecks]) => {
                const totalDecks = folderDecks.length;
                const totalCards = folderDecks.reduce((sum, d) => {
                  return sum + cards.filter(c => c.deckId === d.id).length;
                }, 0);
                const firstDeck = folderDecks[0];

                return (
                  <div
                    key={`folder-${folderName}`}
                    onClick={() => setActiveFolder(folderName)}
                    className="bg-white dark:bg-slate-800/90 rounded-3xl border border-[#E9E4F0] p-5 shadow-xs hover:shadow-md hover:border-amber-300 transition-all cursor-pointer flex flex-col justify-between group relative overflow-hidden"
                  >
                    <div
                      className="absolute top-0 left-0 right-0 h-1.5"
                      style={{ backgroundColor: firstDeck?.color || '#FED770' }}
                    />
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center text-2xl shadow-xs">
                            📁
                          </div>
                          <div>
                            <h3 className="font-extrabold text-base sm:text-lg text-[#2E241E] leading-snug line-clamp-1 group-hover:text-amber-600 transition-colors">
                              {folderName}
                            </h3>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs font-bold text-[#8A7E76]">
                                {totalDecks} bộ thẻ • {totalCards} từ vựng
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-[#7A6E66] line-clamp-2 mt-3 font-medium min-h-[32px]">
                        Bấm để xem các bộ thẻ bên trong thư mục này.
                      </p>
                    </div>
                  </div>
                );
              })}

            {/* Render Decks */}
            {decksToRender.map((deck) => {
              const deckCards = cards.filter((c) => c.deckId === deck.id);
              const dueCards = deckCards.filter(isCardDue);
              const total = deckCards.length;
              const isListMode = !!activeFolder;

              return (
                <div
                  key={deck.id}
                  className={`bg-white dark:bg-slate-800/90 rounded-3xl border border-[#E9E4F0] shadow-xs hover:shadow-md transition-all group relative overflow-hidden ${
                    isListMode
                      ? 'p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4'
                      : 'p-5 flex flex-col justify-between'
                  }`}
                >
                  {/* Top color bar */}
                  <div
                    className={isListMode ? "absolute left-0 top-0 bottom-0 w-1.5" : "absolute top-0 left-0 right-0 h-1.5"}
                    style={{ backgroundColor: deck.color || '#FED770' }}
                  />

                  {/* Left Side: Deck Card Header & Progress */}
                  <div className={isListMode ? "flex-1 w-full flex flex-col md:flex-row items-start md:items-center justify-between pl-2" : ""}>
                    <div className="flex items-start justify-between gap-2 mb-2 md:mb-0 w-full md:w-auto">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-xs shrink-0"
                          style={{ backgroundColor: `${deck.color || '#FED770'}33` }}
                        >
                          {deck.emoji || '📚'}
                        </div>
                        <div>
                          <h3 className="font-extrabold text-base sm:text-lg text-[#2E241E] leading-snug line-clamp-1 group-hover:text-[#FF8A00] transition-colors">
                            {deck.title}
                          </h3>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs font-bold text-[#8A7E76]">
                              {total} từ vựng
                            </span>
                            {dueCards.length > 0 && (
                              <span className="px-2 py-0.5 rounded-full text-[11px] font-black bg-[#FFE3E8] text-[#E03131] border border-[#FFA8B6] animate-mochi-pulse shrink-0">
                                {dueCards.length} từ cần ôn
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Quick Menu (Mobile & Grid Mode) */}
                      {!isListMode && (
                        <div className="flex items-center gap-1 opacity-80 hover:opacity-100 shrink-0">
                          <button
                            onClick={() => onViewDeckDetail(deck.id)}
                            title="Mở chi tiết thẻ"
                            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition-colors"
                          >
                            <BookOpen className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onEditDeck(deck)}
                            title="Chỉnh sửa bộ thẻ"
                            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition-colors"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onDeleteDeck(deck.id)}
                            title="Xóa bộ thẻ"
                            className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>

                    {!isListMode && (
                      <p className="text-xs text-[#7A6E66] line-clamp-2 mt-3 font-medium min-h-[32px]">
                        {deck.description || 'Không có mô tả cho bộ thẻ này.'}
                      </p>
                    )}

                    {/* Mini Level Breakdown */}
                    <div className={isListMode ? "w-full md:w-32 lg:w-48 xl:w-64 shrink-0 mt-3 md:mt-0" : "mt-4 pt-3 border-t border-slate-100"}>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden flex gap-0.5">
                        {([0, 1, 2, 3, 4, 5] as const).map((lvl) => {
                          const count = deckCards.filter((c) => (c.level ?? 0) === lvl).length;
                          if (count === 0) return null;
                          const pct = (count / (total || 1)) * 100;
                          return (
                            <div
                              key={lvl}
                              style={{ width: `${pct}%`, backgroundColor: MOCHI_LEVEL_INFO[lvl].color }}
                              className="h-full transition-all"
                            />
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Right Side: Study Action Buttons */}
                  <div className={isListMode ? "w-full md:w-auto shrink-0 flex items-center gap-2 mt-4 md:mt-0" : "mt-5 space-y-2"}>
                    <button
                      disabled={total === 0}
                      onClick={() => onStartStudy(deck.id, 'flashcard')}
                      className={`flex items-center justify-center gap-2 py-2.5 bg-linear-to-r from-[#FED770] to-[#FFB703] hover:from-[#FFCA3A] hover:to-[#FB8500] disabled:opacity-50 text-[#543800] font-black text-sm rounded-2xl shadow-xs hover:shadow-md transition-all hover:scale-[1.02] active:scale-95 ${isListMode ? 'px-6' : 'w-full'}`}
                    >
                      <Play className="w-4 h-4 fill-[#543800]" />
                      <span>{isListMode ? 'Ôn Tập' : `Lật Thẻ SRS ${dueCards.length > 0 ? `(${dueCards.length})` : `(Tất cả ${total})`}`}</span>
                    </button>

                    <div className={isListMode ? "flex items-center gap-1 opacity-80 hover:opacity-100 ml-2 border-l pl-2" : "grid grid-cols-2 gap-2"}>
                      {isListMode ? (
                        <>
                          <button
                            onClick={() => onViewDeckDetail(deck.id)}
                            title="Mở chi tiết thẻ"
                            className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition-colors"
                          >
                            <BookOpen className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onEditDeck(deck)}
                            title="Chỉnh sửa bộ thẻ"
                            className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition-colors"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onDeleteDeck(deck.id)}
                            title="Xóa bộ thẻ"
                            className="p-2 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            disabled={total < 4}
                            onClick={() => onStartStudy(deck.id, 'quiz')}
                            title={total < 4 ? 'Cần ít nhất 4 thẻ để chơi trắc nghiệm' : 'Luyện trắc nghiệm 4 đáp án'}
                            className="flex items-center justify-center gap-1.5 py-2 bg-[#F3F0FA] hover:bg-[#E9E4F5] disabled:opacity-40 text-[#593F7D] font-bold text-xs rounded-xl transition-all"
                          >
                            <ListOrdered className="w-3.5 h-3.5" />
                            <span>Trắc Nghiệm</span>
                          </button>

                          <button
                            disabled={total === 0}
                            onClick={() => onStartStudy(deck.id, 'typing')}
                            title="Luyện gõ từ và chính tả"
                            className="flex items-center justify-center gap-1.5 py-2 bg-[#EBF7EE] hover:bg-[#D8F0DE] disabled:opacity-40 text-[#2B783E] font-bold text-xs rounded-xl transition-all"
                          >
                            <Keyboard className="w-3.5 h-3.5" />
                            <span>Luyện Gõ</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
