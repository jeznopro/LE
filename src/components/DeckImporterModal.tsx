import React, { useState, useRef } from 'react';
import { Card, Deck } from '../types';
import { parseAnkiApkg, parseTextOrCsv, parseJsonDeck, ParsedDeckResult } from '../utils/ankiImporter';
import { soundManager } from '../utils/sounds';
import {
  UploadCloud,
  X,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

interface DeckImporterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: (newDecks: Deck[], newCards: Card[]) => void;
  existingDecks: Deck[];
}

export const DeckImporterModal: React.FC<DeckImporterModalProps> = ({
  isOpen,
  onClose,
  onImportComplete,
  existingDecks: _existingDecks,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [parsedResults, setParsedResults] = useState<ParsedDeckResult[] | null>(null);
  const [deckTitle, setDeckTitle] = useState('');
  const [deckEmoji, setDeckEmoji] = useState('📦');
  const [deckColor, setDeckColor] = useState('#FED770');

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileProcess = async (file: File) => {
    setIsLoading(true);
    setErrorMessage(null);
    setParsedResults(null);
    soundManager.playClick();

    try {
      const fileName = file.name.toLowerCase();
      let results: ParsedDeckResult[] = [];

      if (fileName.endsWith('.apkg')) {
        const apkgResults = await parseAnkiApkg(file);
        if (!apkgResults || apkgResults.length === 0) {
          throw new Error('Không tìm thấy nội dung trong file Anki .apkg');
        }
        results = apkgResults;
      } else if (fileName.endsWith('.json')) {
        const text = await file.text();
        results = [parseJsonDeck(text, file.name)];
      } else if (fileName.endsWith('.csv') || fileName.endsWith('.tsv') || fileName.endsWith('.txt')) {
        const text = await file.text();
        results = [await parseTextOrCsv(text, file.name)];
      } else {
        throw new Error('Định dạng không được hỗ trợ! Vui lòng chọn file .apkg, .csv, .tsv, .txt, hoặc .json');
      }

      setParsedResults(results);
      // For multiple decks, we show the first one's title or a general group title
      setDeckTitle(results.length > 1 ? file.name.replace(/\.[^/.]+$/, "") : results[0].deckTitle);
      soundManager.playCorrect();
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err?.message || 'Có lỗi xảy ra khi phân tích tệp!');
      soundManager.playWrong();
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleConfirmImport = () => {
    if (!parsedResults || parsedResults.length === 0) return;

    soundManager.playClick();
    
    const newDecks: Deck[] = [];
    const newCards: Card[] = [];
    const timestamp = Date.now();

    parsedResults.forEach((parsedResult, deckIdx) => {
      const newDeckId = `deck-${timestamp}-${deckIdx}`;
      let finalTitle = parsedResult.deckTitle;
      let finalFolder = parsedResult.folder;

      if (parsedResults.length === 1) {
        finalTitle = deckTitle.trim() || parsedResult.deckTitle || 'Bộ Thẻ Mới';
      } else {
        finalFolder = deckTitle.trim() || parsedResult.folder || 'Bộ Thẻ Nhập';
      }

      newDecks.push({
        id: newDeckId,
        title: finalTitle,
        folder: finalFolder,
        description: parsedResult.description || `Đã nhập ${parsedResult.cards.length} từ`,
        emoji: deckEmoji, // All subdecks will share the selected emoji/color
        color: deckColor,
        createdAt: timestamp,
        updatedAt: timestamp,
      });

      parsedResult.cards.forEach((c, cardIdx) => {
        newCards.push({
          ...c,
          id: `card-${timestamp}-${deckIdx}-${cardIdx}`,
          deckId: newDeckId,
        });
      });
    });

    onImportComplete(newDecks, newCards);
    onClose();
  };

  const EMOJI_OPTIONS = ['📚', '🍡', '⭐', '🔥', '🌸', '💼', '🎓', '💡', '🏆', '🚀'];
  const COLOR_OPTIONS = ['#FED770', '#FF8A8A', '#7BDCB5', '#A5D8FF', '#D0BFFF', '#FFA8A8'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-3xl w-full max-w-xl max-h-[90vh] overflow-y-auto border border-[#E9E4F0] shadow-2xl p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-700">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-[#2E241E]">
                Nhập Deck (Anki / CSV / JSON)
              </h2>
              <p className="text-xs text-slate-500 font-semibold">
                Tương thích 100% với file .apkg của Anki & định dạng bảng
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Upload Zone */}
        {!parsedResults ? (
          <div className="space-y-4">
            <div
              className={`border-2 border-dashed rounded-3xl p-10 text-center transition-all cursor-pointer ${
                isDragging
                  ? 'border-[#FF9F1C] bg-amber-50'
                  : 'border-slate-300 hover:border-slate-400 bg-slate-50/50 hover:bg-slate-50'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
                <UploadCloud className="w-8 h-8 text-amber-600" />
              </div>
              <h3 className="text-lg font-black text-[#2E241E] mb-2">
                Kéo thả file vào đây hoặc bấm để chọn tệp
              </h3>
              <p className="text-sm font-semibold text-slate-500">
                Hỗ trợ <strong className="text-slate-700">.apkg</strong> (Anki Deck),{' '}
                <strong className="text-slate-700">.csv, .tsv, .txt, .json</strong>
              </p>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".apkg,.csv,.tsv,.txt,.json"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    handleFileProcess(e.target.files[0]);
                  }
                }}
              />
              {isLoading && (
                <div className="mt-4 flex flex-col items-center gap-2">
                  <div className="w-8 h-8 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs font-bold text-amber-600">Đang đọc dữ liệu...</span>
                </div>
              )}
            </div>

            {errorMessage && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2.5 text-rose-800 text-xs font-bold">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600 space-y-2">
              <div className="font-extrabold text-slate-700 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Mẹo nhập file nhanh:</span>
              </div>
              <ul className="list-disc pl-5 space-y-1 font-medium text-[11px]">
                <li><strong>Anki Package (.apkg)</strong>: Mở Anki &rarr; File &rarr; Export &rarr; Chọn file .apkg để nhập toàn bộ.</li>
                <li><strong>File CSV/Excel/Text</strong>: Mỗi dòng gồm <code>Từ tiếng Anh [Tab hoặc Phẩy] Nghĩa tiếng Việt</code>.</li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-900">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
              <div>
                <div className="font-black text-sm">
                  Đã nhận diện thành công {parsedResults.length} bộ thẻ!
                </div>
                <div className="text-xs text-emerald-700 font-semibold mt-0.5">
                  Tổng cộng {parsedResults.reduce((acc, curr) => acc + curr.totalCards, 0)} từ vựng đã sẵn sàng để nhập.
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-black uppercase text-slate-500 mb-1.5">
                {parsedResults.length > 1 ? 'Tên Nhóm Bộ Thẻ (Thư mục)' : 'Tên Bộ Thẻ'}
              </label>
              <input
                type="text"
                value={deckTitle}
                onChange={(e) => setDeckTitle(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-2xl text-sm font-bold text-slate-800 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black uppercase text-slate-500 mb-1.5">
                  Biểu Tượng
                </label>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {EMOJI_OPTIONS.map((em) => (
                    <button
                      key={em}
                      type="button"
                      onClick={() => setDeckEmoji(em)}
                      className={`w-8 h-8 rounded-xl flex items-center justify-center text-base transition-all ${
                        deckEmoji === em
                          ? 'bg-amber-200 ring-2 ring-amber-500 scale-110'
                          : 'bg-slate-100 hover:bg-slate-200'
                      }`}
                    >
                      {em}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-slate-500 mb-1.5">
                  Màu Sắc
                </label>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {COLOR_OPTIONS.map((col) => (
                    <button
                      key={col}
                      type="button"
                      onClick={() => setDeckColor(col)}
                      style={{ backgroundColor: col }}
                      className={`w-7 h-7 rounded-xl transition-all ${
                        deckColor === col ? 'ring-3 ring-slate-800 scale-110' : 'opacity-80 hover:opacity-100'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-black uppercase text-slate-500 mb-1.5">
                Xem Trước Vài Thẻ Mẫu:
              </label>
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {parsedResults.flatMap(r => r.cards).slice(0, 4).map((c, i) => (
                  <div
                    key={i}
                    className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs"
                  >
                    <span className="font-bold text-slate-800 line-clamp-1">{c.front}</span>
                    <span className="text-slate-500 max-w-[50%] line-clamp-1 text-right">
                      {c.back}
                    </span>
                  </div>
                ))}
                {parsedResults.reduce((acc, r) => acc + r.cards.length, 0) > 4 && (
                  <div className="text-center text-[11px] font-bold text-slate-400 py-1">
                    ... và {parsedResults.reduce((acc, r) => acc + r.cards.length, 0) - 4} từ khác
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 mt-6 border-t border-slate-100">
              <button
                onClick={() => setParsedResults(null)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-2xl transition-colors"
              >
                Chọn file khác
              </button>

              <button
                onClick={handleConfirmImport}
                className="px-6 py-2.5 bg-linear-to-r from-[#FFD13B] to-[#FFAA00] hover:from-[#FFC61A] text-[#4A3200] font-black text-sm rounded-2xl shadow-sm hover:shadow-md transition-all hover:scale-105"
              >
                Nhập Ngay ({parsedResults.reduce((acc, r) => acc + r.cards.length, 0)} từ)
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
