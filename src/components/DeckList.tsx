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
  onClearAllDecks?: () => void;
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
  onClearAllDecks,
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
            className="liquid-glass-input w-full pl-10 pr-4 py-2.5 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-2xl text-sm font-medium focus:outline-hidden transition-all"
          />
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          {decks.length > 0 && onClearAllDecks && (
            <button
              onClick={onClearAllDecks}
              title="Xóa tất cả các bộ thẻ hiện tại để làm mới hoàn toàn"
              className="liquid-glass-pill px-3.5 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-300 border border-rose-400/40 dark:border-rose-500/30 font-bold text-xs sm:text-sm rounded-2xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden sm:inline">Xóa Sạch Bộ Thẻ</span>
            </button>
          )}

          <button
            onClick={onImportDeck}
            className="liquid-glass-pill flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 bg-white/70 dark:bg-slate-800/70 hover:bg-white/90 dark:hover:bg-slate-700/80 border border-white/60 dark:border-white/10 text-slate-700 dark:text-slate-200 font-bold text-sm rounded-2xl shadow-xs transition-all cursor-pointer"
          >
            <UploadCloud className="w-4 h-4 text-[#FF708F]" />
            <span>Nhập Deck (.apkg/CSV)</span>
          </button>

          <button
            onClick={onCreateDeck}
            className="liquid-glass-pill flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-5 py-2.5 bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 hover:from-amber-500 hover:to-orange-500 text-slate-950 font-black text-sm rounded-2xl shadow-md hover:shadow-orange-400/30 transition-all cursor-pointer border border-white/50"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Tạo Bộ Thẻ Mới</span>
          </button>
        </div>
      </div>

      {/* Decks Grid */}
      {filteredDecks.length === 0 ? (
        <div className="liquid-glass-card text-center py-16 rounded-3xl p-8 border-dashed border-2 border-amber-300/40 dark:border-slate-700">
          <div className="text-5xl mb-3 animate-mochi-float">📦</div>
          <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">Chưa tìm thấy bộ thẻ nào</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto font-medium">
            Hãy tạo mới một bộ thẻ từ vựng hoặc nhập trực tiếp file .apkg của Anki để bắt đầu học ngay!
          </p>
          <div className="mt-5 flex justify-center gap-3">
            <button
              onClick={onCreateDeck}
              className="liquid-glass-pill px-5 py-2.5 bg-gradient-to-r from-amber-400 to-orange-400 text-slate-950 font-black text-sm rounded-2xl shadow-md cursor-pointer border border-white/50"
            >
              Tạo Deck Mới
            </button>
            <button
              onClick={onImportDeck}
              className="liquid-glass-pill px-5 py-2.5 bg-white/80 dark:bg-slate-800/80 border border-white/60 dark:border-white/10 font-bold text-sm text-slate-700 dark:text-slate-200 rounded-2xl cursor-pointer"
            >
              Nhập từ Anki
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {activeFolder && (
            <div className="liquid-glass-card flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:p-5 rounded-3xl shadow-md backdrop-blur-md">
              <div className="flex items-center gap-3.5">
                <button
                  onClick={() => setActiveFolder(null)}
                  className="liquid-glass-subtle p-2.5 hover:bg-amber-100/60 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-2xl shadow-xs transition-colors cursor-pointer border border-white/60 dark:border-white/10"
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
                className="liquid-glass-pill px-4 py-2 flex items-center justify-center gap-1.5 bg-rose-500/10 dark:bg-rose-950/60 hover:bg-rose-500/20 text-rose-600 dark:text-rose-300 border border-rose-400/40 dark:border-rose-700/50 rounded-2xl text-xs font-extrabold transition-all cursor-pointer shadow-xs"
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

                return (
                  <div
                    key={`folder-${folderName}`}
                    onClick={() => setActiveFolder(folderName)}
                    className="liquid-glass-card rounded-3xl p-5 sm:p-6 shadow-md hover:shadow-2xl cursor-pointer flex flex-col justify-between group relative overflow-hidden"
                  >
                    {/* Top gradient highlight bar */}
                    <div
                      className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500"
                    />

                    <div>
                      {/* Header with Icon, Title, and Direct Delete Button */}
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="flex items-center gap-3.5 flex-1 min-w-0">
                          <div className="liquid-glass-subtle w-12 h-12 rounded-2xl border border-white/60 dark:border-white/10 flex items-center justify-center text-2xl shadow-xs group-hover:scale-108 group-hover:rotate-2 transition-transform shrink-0">
                            📁
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3
                              title={folderName}
                              className="font-black text-base sm:text-lg text-slate-900 dark:text-slate-100 leading-snug line-clamp-1 group-hover:text-amber-500 transition-colors"
                            >
                              {folderName}
                            </h3>
                            <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                              <span className="liquid-glass-subtle px-2.5 py-0.5 rounded-lg text-amber-700 dark:text-amber-300 font-extrabold text-[11px] border border-amber-300/40 dark:border-amber-500/30 flex items-center gap-1">
                                <span>📚</span> {totalDecks} bộ thẻ
                              </span>
                              <span className="liquid-glass-subtle px-2.5 py-0.5 rounded-lg text-slate-700 dark:text-slate-300 font-extrabold text-[11px] border border-white/50 dark:border-white/10 flex items-center gap-1">
                                <span>🏷️</span> {totalCards} từ vựng
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Direct Delete Folder Button */}
                        <button
                          onClick={(e) => handleDeleteFolder(folderName, e)}
                          title="Xóa toàn bộ thư mục này cùng các bộ thẻ bên trong"
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50/50 dark:hover:bg-rose-950/60 rounded-xl transition-all cursor-pointer opacity-70 group-hover:opacity-100 shrink-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-2 font-medium">
                        Bấm vào để mở và ôn luyện tất cả {totalDecks} bộ thẻ bên trong thư mục này.
                      </p>
                    </div>

                    {/* Bottom Action Indicator */}
                    <div className="mt-4 pt-3 border-t border-white/60 dark:border-white/10 flex items-center justify-between text-xs font-black text-amber-600 dark:text-amber-400 group-hover:text-orange-500">
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
                  className={`liquid-glass-card rounded-3xl shadow-sm hover:shadow-xl group relative overflow-hidden ${
                    isListMode
                      ? 'p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4'
                      : 'p-5 flex flex-col justify-between'
                  }`}
                >
                  {/* Top glowing specular color bar */}
                  <div
                    className={isListMode ? "absolute left-0 top-0 bottom-0 w-1.5" : "absolute top-0 left-0 right-0 h-1.5"}
                    style={{ 
                      backgroundColor: deck.color || '#FED770',
                      boxShadow: `0 0 12px ${deck.color || '#FED770'}88`
                    }}
                  />

                  {/* Left Side: Deck Card Header & Progress */}
                  <div className={isListMode ? "flex-1 w-full flex flex-col md:flex-row items-start md:items-center justify-between pl-2" : ""}>
                    <div className="flex items-start justify-between gap-2 mb-2 md:mb-0 w-full md:w-auto">
                      <div className="flex items-center gap-3">
                        <div
                          className="liquid-glass-subtle w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-xs shrink-0 border border-white/60 dark:border-white/10 group-hover:scale-105 transition-transform"
                          style={{ backgroundColor: `${deck.color || '#FED770'}22` }}
                        >
                          {deck.emoji || '📚'}
                        </div>
                        <div>
                          <h3 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white leading-snug line-clamp-1 group-hover:text-amber-500 transition-colors">
                            {deck.title.replace(/[\x00-\x1f\x7f-\x9f\ufffd]/g, ' - ').replace(/::/g, ' - ').replace(/\s+-\s+/g, ' - ').trim()}
                          </h3>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                              {total} từ vựng
                            </span>
                            {dueCards.length > 0 && (
                              <span className="liquid-glass-subtle px-2 py-0.5 rounded-full text-[11px] font-black bg-rose-500/15 text-rose-600 dark:text-rose-300 border border-rose-400/40 animate-mochi-pulse shrink-0">
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
                            className="p-1.5 hover:bg-white/60 dark:hover:bg-slate-700/60 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
                          >
                            <BookOpen className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onEditDeck(deck)}
                            title="Chỉnh sửa bộ thẻ"
                            className="p-1.5 hover:bg-white/60 dark:hover:bg-slate-700/60 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onDeleteDeck(deck.id)}
                            title="Xóa bộ thẻ"
                            className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/60 rounded-xl text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>

                    {!isListMode && (
                      <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mt-3 font-medium min-h-[32px]">
                        {deck.description || 'Không có mô tả cho bộ thẻ này.'}
                      </p>
                    )}

                    {/* Mini Level Breakdown */}
                    <div className={isListMode ? "w-full md:w-32 lg:w-48 xl:w-64 shrink-0 mt-3 md:mt-0" : "mt-4 pt-3 border-t border-white/60 dark:border-white/10"}>
                      <div className="w-full h-2 liquid-glass-subtle rounded-full overflow-hidden flex gap-0.5 border border-white/40 dark:border-white/5">
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
                      className={`liquid-glass-pill flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 disabled:opacity-40 text-white font-black text-xs sm:text-sm rounded-2xl shadow-md cursor-pointer border border-white/50 ${isListMode ? 'px-6' : 'w-full'}`}
                    >
                      <span className="text-base">🐻</span>
                      <span>Học We Bare Bears (3 Bước) {dueCards.length > 0 ? `(${dueCards.length})` : `(${total})`}</span>
                    </button>

                    <div className={isListMode ? "flex items-center gap-1 opacity-80 hover:opacity-100 ml-2 border-l pl-2 border-white/60 dark:border-white/10" : "grid grid-cols-3 gap-1.5 w-full"}>
                      {isListMode ? (
                        <>
                          <button
                            onClick={() => onViewDeckDetail(deck.id)}
                            title="Mở chi tiết thẻ"
                            className="p-2 hover:bg-white/60 dark:hover:bg-slate-700/60 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
                          >
                            <BookOpen className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onEditDeck(deck)}
                            title="Chỉnh sửa bộ thẻ"
                            className="p-2 hover:bg-white/60 dark:hover:bg-slate-700/60 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onDeleteDeck(deck.id)}
                            title="Xóa bộ thẻ"
                            className="p-2 hover:bg-rose-50 dark:hover:bg-rose-950/60 rounded-xl text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
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
                            className="liquid-glass-subtle flex items-center justify-center gap-1 py-2 hover:bg-white/70 dark:hover:bg-purple-950/60 disabled:opacity-40 text-purple-700 dark:text-purple-300 font-bold text-[11px] rounded-xl transition-all cursor-pointer border border-purple-200/40 dark:border-purple-800/30"
                          >
                            <ListOrdered className="w-3 h-3" />
                            <span>Trắc Nghiệm</span>
                          </button>

                          <button
                            disabled={total === 0}
                            onClick={() => onStartStudy(deck.id, 'typing')}
                            title="Luyện gõ từ và chính tả"
                            className="liquid-glass-subtle flex items-center justify-center gap-1 py-2 hover:bg-white/70 dark:hover:bg-emerald-950/60 disabled:opacity-40 text-emerald-700 dark:text-emerald-300 font-bold text-[11px] rounded-xl transition-all cursor-pointer border border-emerald-200/40 dark:border-emerald-800/30"
                          >
                            <Keyboard className="w-3 h-3" />
                            <span>Luyện Gõ</span>
                          </button>

                          <button
                            disabled={total === 0}
                            onClick={() => onStartStudy(deck.id, 'speaking')}
                            title="Luyện nói & chấm điểm phát âm AI"
                            className="liquid-glass-subtle flex items-center justify-center gap-1 py-2 hover:bg-white/70 dark:hover:bg-cyan-950/60 disabled:opacity-40 text-cyan-700 dark:text-cyan-300 font-bold text-[11px] rounded-xl transition-all cursor-pointer border border-cyan-200/40 dark:border-cyan-800/30"
                          >
                            <Mic className="w-3 h-3 text-cyan-600 dark:text-cyan-400" />
                            <span>Luyện Nói</span>
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
