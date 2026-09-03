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
  Mic,
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
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800/90 border border-[#E4E0EC] dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-2xl text-sm font-medium focus:outline-hidden focus:border-[#FF9F1C] focus:ring-2 focus:ring-[#FF9F1C]/20 transition-all"
          />
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            onClick={onImportDeck}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 bg-white dark:bg-slate-800/90 hover:bg-slate-50 dark:hover:bg-slate-700 border border-[#DCD6E8] dark:border-slate-700 text-[#554640] dark:text-slate-200 font-bold text-sm rounded-2xl shadow-xs transition-all hover:scale-105 active:scale-95"
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
        <div className="text-center py-16 bg-white dark:bg-slate-800/90 rounded-3xl border border-dashed border-[#DDD6EB] dark:border-slate-700 p-8">
          <div className="text-5xl mb-3">📦</div>
          <h3 className="text-lg font-bold text-[#4A3B32] dark:text-slate-100">Chưa tìm thấy bộ thẻ nào</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
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
              className="px-5 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 font-bold text-sm text-slate-700 dark:text-slate-200 rounded-2xl"
            >
              Nhập từ Anki
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {activeFolder && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:p-5 bg-white/95 dark:bg-slate-900/95 rounded-3xl border-2 border-amber-200 dark:border-slate-700 shadow-sm backdrop-blur-md">
              <div className="flex items-center gap-3.5">
                <button
                  onClick={() => setActiveFolder(null)}
                  className="p-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-amber-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-2xl shadow-xs transition-colors cursor-pointer"
                  title="Quay lại danh sách thư mục"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                  <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <FolderOpen className="w-6 h-6 text-amber-500 fill-amber-300 dark:fill-amber-900/60" />
                    <span>{activeFolder.replace(/[\x00-\x1f\x7f-\x9f\ufffd]/g, ' - ').replace(/::/g, ' - ').replace(/\s+-\s+/g, ' - ').trim()}</span>
                  </h2>
                  <div className="text-xs font-bold text-slate-500 dark:text-slate-300 mt-0.5">
                    Đang hiển thị {folders[activeFolder]?.length || 0} bộ thẻ trong thư mục này
                  </div>
                </div>
              </div>

              <button
                onClick={(e) => handleDeleteFolder(activeFolder, e)}
                className="px-4 py-2 flex items-center justify-center gap-1.5 bg-rose-50 dark:bg-rose-950/80 hover:bg-rose-100 text-rose-600 dark:text-rose-200 border border-rose-200 dark:border-rose-800 rounded-2xl text-xs font-extrabold transition-all cursor-pointer hover:scale-105 active:scale-95 shadow-xs"
              >
                <Trash2 className="w-4 h-4" />
                <span>Xóa Toàn Bộ Thư Mục</span>
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
                    className="bg-white dark:bg-slate-800/95 rounded-3xl border-2 border-amber-200/90 dark:border-slate-700 p-5 sm:p-6 shadow-sm hover:shadow-xl hover:border-amber-400 dark:hover:border-amber-500 transition-all duration-300 hover:-translate-y-1 cursor-pointer flex flex-col justify-between group relative overflow-hidden"
                  >
                    {/* Top gradient highlight bar */}
                    <div
                      className="absolute top-0 left-0 right-0 h-2 bg-linear-to-r from-amber-400 via-orange-400 to-amber-500"
                    />

                    <div>
                      {/* Header with Icon, Title, and Direct Delete Button */}
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="flex items-center gap-3.5 flex-1 min-w-0">
                          <div className="w-13 h-13 rounded-2xl bg-linear-to-br from-amber-100 to-orange-100 dark:from-amber-950/80 dark:to-orange-950/60 border border-amber-300 dark:border-amber-700/60 flex items-center justify-center text-3xl shadow-xs group-hover:scale-108 group-hover:rotate-2 transition-transform shrink-0">
                            📁
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3
                              title={folderName}
                              className="font-black text-base sm:text-lg text-slate-900 dark:text-slate-100 leading-snug line-clamp-1 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors"
                            >
                              {folderName}
                            </h3>
                            <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                              <span className="px-2.5 py-0.5 rounded-lg bg-amber-50 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 font-extrabold text-[11px] border border-amber-200 dark:border-amber-800/70 flex items-center gap-1">
                                <span>📚</span> {totalDecks} bộ thẻ
                              </span>
                              <span className="px-2.5 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-750 text-slate-700 dark:text-slate-300 font-extrabold text-[11px] border border-slate-200 dark:border-slate-700 flex items-center gap-1">
                                <span>🏷️</span> {totalCards} từ vựng
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Direct Delete Folder Button */}
                        <button
                          onClick={(e) => handleDeleteFolder(folderName, e)}
                          title="Xóa toàn bộ thư mục này cùng các bộ thẻ bên trong"
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 rounded-xl transition-all cursor-pointer opacity-70 group-hover:opacity-100 shrink-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-2 font-medium">
                        Bấm vào để mở và ôn luyện tất cả {totalDecks} bộ thẻ bên trong thư mục này.
                      </p>
                    </div>

                    {/* Bottom Action Indicator */}
                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-750 flex items-center justify-between text-xs font-black text-amber-600 dark:text-amber-400 group-hover:text-orange-600">
                      <span>Mở Thư Mục Khám Phá</span>
                      <span className="group-hover:translate-x-1.5 transition-transform font-bold text-sm">
                        ➔
                      </span>
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
                          <h3 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white leading-snug line-clamp-1 group-hover:text-amber-500 transition-colors">
                            {deck.title.replace(/[\x00-\x1f\x7f-\x9f\ufffd]/g, ' - ').replace(/::/g, ' - ').replace(/\s+-\s+/g, ' - ').trim()}
                          </h3>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs font-bold text-[#8A7E76] dark:text-slate-400">
                              {total} từ vựng
                            </span>
                            {dueCards.length > 0 && (
                              <span className="px-2 py-0.5 rounded-full text-[11px] font-black bg-[#FFE3E8] dark:bg-rose-950/60 text-[#E03131] dark:text-rose-300 border border-[#FFA8B6] dark:border-rose-800 animate-mochi-pulse shrink-0">
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
                            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                          >
                            <BookOpen className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onEditDeck(deck)}
                            title="Chỉnh sửa bộ thẻ"
                            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onDeleteDeck(deck.id)}
                            title="Xóa bộ thẻ"
                            className="p-1.5 hover:bg-red-50 dark:hover:bg-rose-950/60 rounded-lg text-slate-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>

                    {!isListMode && (
                      <p className="text-xs text-[#7A6E66] dark:text-slate-400 line-clamp-2 mt-3 font-medium min-h-[32px]">
                        {deck.description || 'Không có mô tả cho bộ thẻ này.'}
                      </p>
                    )}

                    {/* Mini Level Breakdown */}
                    <div className={isListMode ? "w-full md:w-32 lg:w-48 xl:w-64 shrink-0 mt-3 md:mt-0" : "mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/80"}>
                      <div className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden flex gap-0.5">
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
                      onClick={() => onStartStudy(deck.id, 'mochi')}
                      className={`flex items-center justify-center gap-2 py-2.5 bg-linear-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 disabled:opacity-50 text-white font-black text-sm rounded-2xl shadow-md hover:shadow-lg transition-all hover:scale-[1.02] active:scale-95 cursor-pointer ring-2 ring-amber-400/60 drop-shadow-xs ${isListMode ? 'px-6' : 'w-full'}`}
                    >
                      <span className="text-base">🐻</span>
                      <span>Học We Bare Bears (3 Bước) {dueCards.length > 0 ? `(${dueCards.length})` : `(${total})`}</span>
                    </button>

                    <div className={isListMode ? "flex items-center gap-1 opacity-80 hover:opacity-100 ml-2 border-l pl-2 border-slate-200 dark:border-slate-700" : "grid grid-cols-2 gap-2"}>
                      {isListMode ? (
                        <>
                          <button
                            onClick={() => onViewDeckDetail(deck.id)}
                            title="Mở chi tiết thẻ"
                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                          >
                            <BookOpen className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onEditDeck(deck)}
                            title="Chỉnh sửa bộ thẻ"
                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onDeleteDeck(deck.id)}
                            title="Xóa bộ thẻ"
                            className="p-2 hover:bg-red-50 dark:hover:bg-rose-950/60 rounded-lg text-slate-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <div className="grid grid-cols-3 gap-1.5 w-full">
                          <button
                            disabled={total < 4}
                            onClick={() => onStartStudy(deck.id, 'quiz')}
                            title={total < 4 ? 'Cần ít nhất 4 thẻ để chơi trắc nghiệm' : 'Luyện trắc nghiệm 4 đáp án'}
                            className="flex items-center justify-center gap-1 py-2 bg-[#F3F0FA] dark:bg-purple-950/40 hover:bg-[#E9E4F5] dark:hover:bg-purple-900/50 disabled:opacity-40 text-[#593F7D] dark:text-purple-300 font-bold text-[11px] rounded-xl transition-all"
                          >
                            <ListOrdered className="w-3 h-3" />
                            <span>Trắc Nghiệm</span>
                          </button>

                          <button
                            disabled={total === 0}
                            onClick={() => onStartStudy(deck.id, 'typing')}
                            title="Luyện gõ từ và chính tả"
                            className="flex items-center justify-center gap-1 py-2 bg-[#EBF7EE] dark:bg-emerald-950/40 hover:bg-[#D8F0DE] dark:hover:bg-emerald-900/50 disabled:opacity-40 text-[#2B783E] dark:text-emerald-300 font-bold text-[11px] rounded-xl transition-all"
                          >
                            <Keyboard className="w-3 h-3" />
                            <span>Luyện Gõ</span>
                          </button>

                          <button
                            disabled={total === 0}
                            onClick={() => onStartStudy(deck.id, 'speaking')}
                            title="Luyện nói & chấm điểm phát âm AI"
                            className="flex items-center justify-center gap-1 py-2 bg-cyan-50 dark:bg-cyan-950/40 hover:bg-cyan-100 dark:hover:bg-cyan-900/50 disabled:opacity-40 text-cyan-700 dark:text-cyan-300 font-bold text-[11px] rounded-xl transition-all"
                          >
                            <Mic className="w-3 h-3 text-cyan-600 dark:text-cyan-400" />
                            <span>Luyện Nói</span>
                          </button>
                        </div>
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
