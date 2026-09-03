import React, { useState, useRef } from 'react';
import { Card, Deck } from '../types';
import { parseAnkiApkg, parseTextOrCsv, parseJsonDeck, parseExcelFile, ParsedDeckResult } from '../utils/ankiImporter';
import { soundManager } from '../utils/sounds';
import {
  UploadCloud,
  X,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ClipboardPaste,
  FileSpreadsheet,
  Layers,
  ArrowRight,
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
  const [importMode, setImportMode] = useState<'file' | 'paste'>('file');
  const [pastedContent, setPastedContent] = useState('');
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

      if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
        results = await parseExcelFile(file);
      } else if (fileName.endsWith('.apkg')) {
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
        throw new Error('Định dạng không được hỗ trợ! Vui lòng chọn file Excel (.xlsx, .xls), Anki (.apkg), hoặc (.csv, .tsv, .txt, .json)');
      }

      setParsedResults(results);
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

  const handlePasteProcess = async () => {
    if (!pastedContent.trim()) {
      setErrorMessage('Vui lòng dán nội dung bảng từ vựng vào ô bên dưới!');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    soundManager.playClick();

    try {
      const result = await parseTextOrCsv(pastedContent, 'Bo-The-Tu-Vung');
      setParsedResults([result]);
      setDeckTitle(deckTitle.trim() || 'Bộ Từ Vựng Nhập Mới');
      soundManager.playCorrect();
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err?.message || 'Không thể phân tích dữ liệu bảng đã dán. Vui lòng kiểm tra các cột!');
      soundManager.playWrong();
    } finally {
      setIsLoading(false);
    }
  };

  const handleInsertSample = () => {
    soundManager.playClick();
    const sample = [
      "#\tWord\tIPA\tType\tMeaning\tExample\tVietnamese\tImage URL\tRelated words",
      "1\tclassroom ⭐\t/ 'klɑ:s.ru:m/\tnoun\tphòng học, lớp học\tThe students entered the classroom quietly when the bell rang.\tHọc sinh bước vào lớp học một cách trật tự khi chuông reo.\thttps://images.unsplash.com/photo-1580582932707-520aed937b7b?w=600\tclassmate, teacher, desk",
      "2\tmagnificent\t/mæɡˈnɪf.ə.sənt/\tadjective\ttráng lệ, lộng lẫy, tuyệt vời\tThe view from the top was magnificent.\tKhung cảnh nhìn từ trên đỉnh núi thật tráng lệ.\thttps://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600\tsplendid, spectacular",
      "3\taccomplish\t/əˈkʌm.plɪʃ/\tverb\thoàn thành, đạt được\tShe accomplished all her goals for this year.\tCô ấy đã hoàn thành mọi mục tiêu đề ra cho năm nay.\t\tachieve, complete, success"
    ].join('\n');
    setPastedContent(sample);
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
        emoji: deckEmoji,
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

  const EMOJI_OPTIONS = ['📚', '⭐', '🔥', '🌸', '💼', '🎓', '💡', '🏆', '🚀', '🧠'];
  const COLOR_OPTIONS = ['#FED770', '#FF8A8A', '#7BDCB5', '#A5D8FF', '#D0BFFF', '#FFA8A8'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-2xl max-h-[92vh] overflow-y-auto border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8 space-y-5 animate-scaleUp text-slate-800 dark:text-slate-100">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-linear-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-white shadow-xs">
              <UploadCloud className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white">
                Nhập Bộ Thẻ Từ Vựng
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                Hỗ trợ 9 cột chuẩn: # • Word • IPA • Type • Meaning • Example • Vietnamese • Image URL • Related words
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Not parsed yet: Show Import Form */}
        {!parsedResults ? (
          <div className="space-y-4">
            
            {/* Mode Tabs */}
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl">
              <button
                type="button"
                onClick={() => {
                  setImportMode('paste');
                  setErrorMessage(null);
                }}
                className={`flex-1 py-2 text-xs sm:text-sm font-black rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  importMode === 'paste'
                    ? 'bg-white dark:bg-slate-700 shadow-xs text-amber-600 dark:text-amber-400'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <ClipboardPaste className="w-4 h-4" />
                <span>Dán Bảng Từ Excel / Google Sheets</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setImportMode('file');
                  setErrorMessage(null);
                }}
                className={`flex-1 py-2 text-xs sm:text-sm font-black rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  importMode === 'file'
                    ? 'bg-white dark:bg-slate-700 shadow-xs text-emerald-600 dark:text-emerald-400'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Kéo Thả File Excel (.xlsx, .xls) & Anki</span>
              </button>
            </div>

            {/* TAB 1: PASTE TABLE */}
            {importMode === 'paste' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black uppercase text-slate-500 dark:text-slate-400">
                    Copy các cột từ Excel / Sheets rồi dán vào đây:
                  </label>
                  <button
                    type="button"
                    onClick={handleInsertSample}
                    className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" /> Dán dữ liệu mẫu 9 cột
                  </button>
                </div>

                <textarea
                  rows={7}
                  value={pastedContent}
                  onChange={(e) => setPastedContent(e.target.value)}
                  placeholder={`Dán các cột bảng của bạn vào đây (phân cách bằng Tab hoặc Phẩy):\n#\tWord\tIPA\tType\tMeaning\tExample\tVietnamese\tImage URL\tRelated words\n1\tclassroom\t/ 'klɑ:s.ru:m/\tnoun\tphòng học, lớp học\tThe students entered the classroom quietly.\tHọc sinh bước vào...\thttps://...\tclassmate`}
                  className="w-full p-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl text-xs font-mono focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 text-slate-800 dark:text-slate-100 transition-all placeholder:text-slate-400"
                />

                <div className="p-3 bg-amber-50/80 dark:bg-slate-800/60 rounded-xl border border-amber-200/80 dark:border-slate-700 text-xs text-amber-900 dark:text-amber-200 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    Hệ thống tự động nhận dạng các cột <strong>Word, IPA, Type, Meaning, Example, Vietnamese, Image URL, Related words</strong>!
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handlePasteProcess}
                  disabled={isLoading}
                  className="w-full py-3 bg-linear-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black text-sm rounded-2xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <ArrowRight className="w-4 h-4" />
                  )}
                  <span>Phân Tích & Xem Trước Dữ Liệu</span>
                </button>
              </div>
            )}

            {/* TAB 2: UPLOAD FILE */}
            {importMode === 'file' && (
              <div
                className={`border-2 border-dashed rounded-3xl p-8 text-center transition-all cursor-pointer ${
                  isDragging
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20'
                    : 'border-slate-300 dark:border-slate-700 hover:border-emerald-400 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center mx-auto mb-3">
                  <UploadCloud className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h3 className="text-base font-black text-slate-800 dark:text-slate-100 mb-1">
                  Kéo thả file Excel (.xlsx, .xls) hoặc bấm để chọn tệp
                </h3>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Hỗ trợ file Excel <strong className="text-emerald-600 dark:text-emerald-400 font-bold">.xlsx, .xls</strong>, Anki <strong className="text-slate-700 dark:text-slate-200">.apkg</strong>, file bảng tính <strong className="text-slate-700 dark:text-slate-200">.csv, .tsv, .txt, .json</strong>
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept=".xlsx,.xls,.apkg,.csv,.tsv,.txt,.json"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      handleFileProcess(e.target.files[0]);
                    }
                  }}
                />
                {isLoading && (
                  <div className="mt-4 flex flex-col items-center gap-2">
                    <div className="w-6 h-6 border-3 border-amber-400 border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs font-bold text-amber-600">Đang đọc dữ liệu...</span>
                  </div>
                )}
              </div>
            )}

            {errorMessage && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-2xl flex items-start gap-2.5 text-rose-800 dark:text-rose-200 text-xs font-bold animate-shake">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}
          </div>
        ) : (
          /* Parsed Results Preview */
          <div className="space-y-4">
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex items-center gap-3 text-emerald-900 dark:text-emerald-200">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
              <div>
                <div className="font-black text-sm">
                  Đã nhận diện thành công {parsedResults.reduce((acc, curr) => acc + curr.totalCards, 0)} từ vựng!
                </div>
                <div className="text-xs text-emerald-700 dark:text-emerald-300 font-semibold mt-0.5">
                  Các cột Từ vựng, Phiên âm, Từ loại, Nghĩa, Ví dụ, Ảnh, Từ liên quan đã được định dạng đầy đủ.
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-black uppercase text-slate-500 dark:text-slate-400 mb-1.5">
                {parsedResults.length > 1 ? 'Tên Nhóm Bộ Thẻ (Thư mục)' : 'Tên Bộ Thẻ'}
              </label>
              <input
                type="text"
                value={deckTitle}
                onChange={(e) => setDeckTitle(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl text-sm font-bold text-slate-800 dark:text-slate-100 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black uppercase text-slate-500 dark:text-slate-400 mb-1.5">
                  Biểu Tượng
                </label>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {EMOJI_OPTIONS.map((em) => (
                    <button
                      key={em}
                      type="button"
                      onClick={() => setDeckEmoji(em)}
                      className={`w-8 h-8 rounded-xl flex items-center justify-center text-base transition-all cursor-pointer ${
                        deckEmoji === em
                          ? 'bg-amber-200 dark:bg-amber-800 ring-2 ring-amber-500 scale-110'
                          : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200'
                      }`}
                    >
                      {em}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-slate-500 dark:text-slate-400 mb-1.5">
                  Màu Sắc
                </label>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {COLOR_OPTIONS.map((col) => (
                    <button
                      key={col}
                      type="button"
                      onClick={() => setDeckColor(col)}
                      style={{ backgroundColor: col }}
                      className={`w-7 h-7 rounded-xl transition-all cursor-pointer ${
                        deckColor === col ? 'ring-3 ring-slate-800 dark:ring-white scale-110' : 'opacity-80 hover:opacity-100'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Table Preview of Parsed Cards */}
            <div>
              <label className="block text-xs font-black uppercase text-slate-500 dark:text-slate-400 mb-1.5">
                Xem Trước Các Thẻ Đã Nhận Diện:
              </label>
              <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                {parsedResults.flatMap((r) => r.cards).slice(0, 5).map((c, i) => (
                  <div
                    key={i}
                    className="p-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-sm text-slate-900 dark:text-white">
                          {c.front}
                        </span>
                        {c.phonetic && (
                          <span className="text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                            {c.phonetic}
                          </span>
                        )}
                        {c.partOfSpeech && (
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 uppercase">
                            {c.partOfSpeech}
                          </span>
                        )}
                      </div>
                      {c.image && (
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                          📷 Có ảnh
                        </span>
                      )}
                    </div>

                    <div className="font-bold text-slate-700 dark:text-slate-200">
                      👉 {c.back}
                    </div>

                    {c.example && (
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                        &ldquo;{c.example}&rdquo;
                        {c.exampleMeaning && <span className="not-italic text-slate-600 dark:text-slate-300 block">↪ {c.exampleMeaning}</span>}
                      </div>
                    )}

                    {c.relatedWords && (
                      <div className="text-[10px] font-semibold text-purple-600 dark:text-purple-300">
                        🔗 Từ liên quan: {c.relatedWords}
                      </div>
                    )}
                  </div>
                ))}

                {parsedResults.reduce((acc, r) => acc + r.cards.length, 0) > 5 && (
                  <div className="text-center text-[11px] font-bold text-slate-400 py-1">
                    ... và {parsedResults.reduce((acc, r) => acc + r.cards.length, 0) - 5} từ vựng khác
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setParsedResults(null)}
                className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-2xl transition-colors cursor-pointer"
              >
                Nhập lại
              </button>

              <button
                type="button"
                onClick={handleConfirmImport}
                className="px-6 py-2.5 bg-linear-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black text-sm rounded-2xl shadow-md transition-all hover:scale-105 active:scale-95 cursor-pointer"
              >
                Lưu Vào Học ({parsedResults.reduce((acc, r) => acc + r.cards.length, 0)} từ)
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
