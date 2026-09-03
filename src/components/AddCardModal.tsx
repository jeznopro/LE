import React, { useState, useEffect } from 'react';
import { Card } from '../types';
import { ttsService } from '../utils/tts';
import { soundManager } from '../utils/sounds';
import { X, Volume2, Image, Link2 } from 'lucide-react';

interface AddCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveCard: (cardData: Partial<Card>) => void;
  editingCard?: Card | null;
  deckId: string;
}

export const AddCardModal: React.FC<AddCardModalProps> = ({
  isOpen,
  onClose,
  onSaveCard,
  editingCard,
  deckId,
}) => {
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');
  const [phonetic, setPhonetic] = useState('');
  const [partOfSpeech, setPartOfSpeech] = useState('noun');
  const [example, setExample] = useState('');
  const [exampleMeaning, setExampleMeaning] = useState('');
  const [image, setImage] = useState('');
  const [relatedWords, setRelatedWords] = useState('');
  const [hint, setHint] = useState('');

  useEffect(() => {
    if (editingCard) {
      setFront(editingCard.front || '');
      setBack(editingCard.back || '');
      setPhonetic(editingCard.phonetic || '');
      setPartOfSpeech(editingCard.partOfSpeech || 'noun');
      setExample(editingCard.example || '');
      setExampleMeaning(editingCard.exampleMeaning || '');
      setImage(editingCard.image || '');
      setRelatedWords(editingCard.relatedWords || '');
      setHint(editingCard.hint || '');
    } else {
      setFront('');
      setBack('');
      setPhonetic('');
      setPartOfSpeech('noun');
      setExample('');
      setExampleMeaning('');
      setImage('');
      setRelatedWords('');
      setHint('');
    }
  }, [editingCard, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!front.trim() || !back.trim()) return;

    soundManager.playClick();
    onSaveCard({
      deckId,
      front: front.trim(),
      back: back.trim(),
      phonetic: phonetic.trim() || undefined,
      partOfSpeech: partOfSpeech || undefined,
      example: example.trim() || undefined,
      exampleMeaning: exampleMeaning.trim() || undefined,
      image: image.trim() || undefined,
      relatedWords: relatedWords.trim() || undefined,
      hint: hint.trim() || undefined,
    });
    onClose();
  };

  const handleTestTTS = () => {
    if (front.trim()) {
      soundManager.playClick();
      ttsService.speak(front.trim());
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-lg max-h-[92vh] overflow-y-auto border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8 text-slate-800 dark:text-slate-100 animate-scaleUp">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-black text-slate-900 dark:text-white">
            {editingCard ? 'Chỉnh Sửa Từ Vựng' : 'Thêm Từ Vựng Mới'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Word (Front) */}
          <div>
            <label className="block text-xs font-black uppercase text-slate-500 dark:text-slate-400 mb-1">
              Từ tiếng Anh (Word) *
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                required
                value={front}
                onChange={(e) => setFront(e.target.value)}
                placeholder="Ví dụ: classroom, magnificent..."
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl text-sm font-bold text-slate-800 dark:text-slate-100 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
              />
              <button
                type="button"
                onClick={handleTestTTS}
                title="Nghe phát âm thử"
                className="p-2.5 bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 text-amber-700 dark:text-amber-400 rounded-2xl border border-amber-200 dark:border-amber-800 transition-transform active:scale-95 shrink-0 cursor-pointer"
              >
                <Volume2 className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Meaning (Back) */}
          <div>
            <label className="block text-xs font-black uppercase text-slate-500 dark:text-slate-400 mb-1">
              Nghĩa tiếng Việt (Meaning) *
            </label>
            <input
              type="text"
              required
              value={back}
              onChange={(e) => setBack(e.target.value)}
              placeholder="Ví dụ: phòng học, lớp học"
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl text-sm font-bold text-slate-800 dark:text-slate-100 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
            />
          </div>

          {/* IPA & Type */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-black uppercase text-slate-500 dark:text-slate-400 mb-1">
                Phiên âm (IPA)
              </label>
              <input
                type="text"
                value={phonetic}
                onChange={(e) => setPhonetic(e.target.value)}
                placeholder="Ví dụ: / 'klɑ:s.ru:m/"
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl text-sm font-mono text-slate-800 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase text-slate-500 dark:text-slate-400 mb-1">
                Từ loại (Type)
              </label>
              <select
                value={partOfSpeech}
                onChange={(e) => setPartOfSpeech(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl text-sm font-bold text-slate-700 dark:text-slate-200"
              >
                <option value="noun">noun (Danh từ)</option>
                <option value="verb">verb (Động từ)</option>
                <option value="adjective">adjective (Tính từ)</option>
                <option value="adverb">adverb (Trạng từ)</option>
                <option value="preposition">preposition (Giới từ)</option>
                <option value="phrase">phrase (Cụm từ)</option>
                <option value="idiom">idiom (Thành ngữ)</option>
              </select>
            </div>
          </div>

          {/* Example (English) */}
          <div>
            <label className="block text-xs font-black uppercase text-slate-500 dark:text-slate-400 mb-1">
              Câu ví dụ (Example)
            </label>
            <input
              type="text"
              value={example}
              onChange={(e) => setExample(e.target.value)}
              placeholder="Ví dụ: The students entered the classroom quietly..."
              className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl text-xs font-medium text-slate-800 dark:text-slate-100"
            />
          </div>

          {/* Example Meaning (Vietnamese) */}
          <div>
            <label className="block text-xs font-black uppercase text-slate-500 dark:text-slate-400 mb-1">
              Dịch câu ví dụ (Vietnamese)
            </label>
            <input
              type="text"
              value={exampleMeaning}
              onChange={(e) => setExampleMeaning(e.target.value)}
              placeholder="Ví dụ: Học sinh bước vào lớp học một cách trật tự..."
              className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl text-xs font-medium text-slate-800 dark:text-slate-100"
            />
          </div>

          {/* Image URL */}
          <div>
            <label className="block text-xs font-black uppercase text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1.5">
              <Image className="w-3.5 h-3.5" />
              <span>Link hình ảnh minh họa (Image URL)</span>
            </label>
            <input
              type="url"
              value={image}
              onChange={(e) => setImage(e.target.value)}
              placeholder="https://images.unsplash.com/..."
              className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl text-xs font-mono text-slate-800 dark:text-slate-100"
            />
          </div>

          {/* Related Words */}
          <div>
            <label className="block text-xs font-black uppercase text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1.5">
              <Link2 className="w-3.5 h-3.5" />
              <span>Từ liên quan / Đồng nghĩa (Related words)</span>
            </label>
            <input
              type="text"
              value={relatedWords}
              onChange={(e) => setRelatedWords(e.target.value)}
              placeholder="Ví dụ: classmate, teacher, desk, school"
              className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl text-xs font-medium text-purple-700 dark:text-purple-300 bg-purple-50/40 dark:bg-purple-950/30"
            />
          </div>

          {/* Mnemonic Hint */}
          <div>
            <label className="block text-xs font-black uppercase text-slate-500 dark:text-slate-400 mb-1">
              Mẹo ghi nhớ (Hint)
            </label>
            <input
              type="text"
              value={hint}
              onChange={(e) => setHint(e.target.value)}
              placeholder="Ví dụ: Class (lớp) + Room (phòng) = Phòng học"
              className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl text-xs font-medium text-slate-800 dark:text-slate-100"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-2xl cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-linear-to-r from-[#FFD13B] to-[#FFAA00] hover:from-[#FFC61A] text-[#4A3200] font-black text-sm rounded-2xl shadow-sm hover:shadow-md transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              {editingCard ? 'Cập Nhật' : 'Lưu Từ Vựng'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
