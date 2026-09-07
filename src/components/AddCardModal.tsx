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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fadeIn">
      <div className="liquid-glass-modal rounded-3xl w-full max-w-lg max-h-[92vh] overflow-y-auto p-6 sm:p-8 text-slate-800 dark:text-slate-100 animate-scaleUp shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-black text-slate-900 dark:text-white">
            {editingCard ? 'Chỉnh Sửa Từ Vựng' : 'Thêm Từ Vựng Mới'}
          </h2>
          <button
            onClick={onClose}
            className="liquid-glass-subtle p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl transition-all cursor-pointer hover:scale-105"
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
                className="liquid-glass-input w-full px-4 py-2.5 rounded-2xl text-sm font-bold"
              />
              <button
                type="button"
                onClick={handleTestTTS}
                title="Nghe phát âm thử"
                className="liquid-glass-subtle p-2.5 text-amber-600 dark:text-amber-400 rounded-2xl transition-all active:scale-95 shrink-0 cursor-pointer hover:scale-105"
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
              className="liquid-glass-input w-full px-4 py-2.5 rounded-2xl text-sm font-bold"
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
                className="liquid-glass-input w-full px-4 py-2.5 rounded-2xl text-sm font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase text-slate-500 dark:text-slate-400 mb-1">
                Từ loại (Type)
              </label>
              <select
                value={partOfSpeech}
                onChange={(e) => setPartOfSpeech(e.target.value)}
                className="liquid-glass-input w-full px-4 py-2.5 rounded-2xl text-sm font-bold"
              >
                <option value="noun" className="bg-slate-900 text-white">noun (Danh từ)</option>
                <option value="verb" className="bg-slate-900 text-white">verb (Động từ)</option>
                <option value="adjective" className="bg-slate-900 text-white">adjective (Tính từ)</option>
                <option value="adverb" className="bg-slate-900 text-white">adverb (Trạng từ)</option>
                <option value="preposition" className="bg-slate-900 text-white">preposition (Giới từ)</option>
                <option value="phrase" className="bg-slate-900 text-white">phrase (Cụm từ)</option>
                <option value="idiom" className="bg-slate-900 text-white">idiom (Thành ngữ)</option>
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
              className="liquid-glass-input w-full px-4 py-2 rounded-2xl text-xs font-medium"
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
              className="liquid-glass-input w-full px-4 py-2 rounded-2xl text-xs font-medium"
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
              className="liquid-glass-input w-full px-4 py-2 rounded-2xl text-xs font-mono"
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
              className="liquid-glass-input w-full px-4 py-2 rounded-2xl text-xs font-medium text-purple-700 dark:text-purple-300"
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
              className="liquid-glass-input w-full px-4 py-2 rounded-2xl text-xs font-medium"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/40 dark:border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="liquid-glass-pill px-4 py-2.5 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer hover:scale-105"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="liquid-glass-pill px-6 py-2.5 bg-linear-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-amber-950 font-black text-sm shadow-lg shadow-amber-500/20 cursor-pointer hover:scale-105 active:scale-95"
            >
              {editingCard ? 'Cập Nhật' : 'Lưu Từ Vựng'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
