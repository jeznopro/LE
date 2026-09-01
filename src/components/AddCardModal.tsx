import React, { useState, useEffect } from 'react';
import { Card } from '../types';
import { ttsService } from '../utils/tts';
import { soundManager } from '../utils/sounds';
import { X, Volume2 } from 'lucide-react';

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
  const [hint, setHint] = useState('');

  useEffect(() => {
    if (editingCard) {
      setFront(editingCard.front || '');
      setBack(editingCard.back || '');
      setPhonetic(editingCard.phonetic || '');
      setPartOfSpeech(editingCard.partOfSpeech || 'noun');
      setExample(editingCard.example || '');
      setExampleMeaning(editingCard.exampleMeaning || '');
      setHint(editingCard.hint || '');
    } else {
      setFront('');
      setBack('');
      setPhonetic('');
      setPartOfSpeech('noun');
      setExample('');
      setExampleMeaning('');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-[#E9E4F0] shadow-2xl p-6 sm:p-8">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-black text-[#2E241E]">
            {editingCard ? 'Chỉnh Sửa Từ Vựng' : 'Thêm Từ Vựng Mới'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-black uppercase text-slate-500 mb-1">
              Từ tiếng Anh (Front) *
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                required
                value={front}
                onChange={(e) => setFront(e.target.value)}
                placeholder="e.g. Magnificent"
                className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-2xl text-sm font-bold text-slate-800 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
              />
              <button
                type="button"
                onClick={handleTestTTS}
                title="Nghe phát âm thử"
                className="p-2.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-2xl border border-amber-200 transition-transform active:scale-95 shrink-0"
              >
                <Volume2 className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-black uppercase text-slate-500 mb-1">
              Nghĩa tiếng Việt (Back) *
            </label>
            <input
              type="text"
              required
              value={back}
              onChange={(e) => setBack(e.target.value)}
              placeholder="e.g. Tuyệt vời, lộng lẫy, tráng lệ"
              className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-2xl text-sm font-bold text-slate-800 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-black uppercase text-slate-500 mb-1">
                Phiên âm (IPA)
              </label>
              <input
                type="text"
                value={phonetic}
                onChange={(e) => setPhonetic(e.target.value)}
                placeholder="e.g. /mæɡˈnɪf.ə.sənt/"
                className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-2xl text-sm font-mono text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase text-slate-500 mb-1">
                Từ loại
              </label>
              <select
                value={partOfSpeech}
                onChange={(e) => setPartOfSpeech(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-2xl text-sm font-bold text-slate-700"
              >
                <option value="noun">Danh từ (n)</option>
                <option value="verb">Động từ (v)</option>
                <option value="adjective">Tính từ (adj)</option>
                <option value="adverb">Trạng từ (adv)</option>
                <option value="phrase">Cụm từ (phrase)</option>
                <option value="idiom">Thành ngữ (idiom)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-black uppercase text-slate-500 mb-1">
              Câu ví dụ (English)
            </label>
            <input
              type="text"
              value={example}
              onChange={(e) => setExample(e.target.value)}
              placeholder="e.g. The view from the top was magnificent."
              className="w-full px-4 py-2 bg-white border border-slate-300 rounded-2xl text-xs font-medium text-slate-800"
            />
          </div>

          <div>
            <label className="block text-xs font-black uppercase text-slate-500 mb-1">
              Dịch nghĩa câu ví dụ
            </label>
            <input
              type="text"
              value={exampleMeaning}
              onChange={(e) => setExampleMeaning(e.target.value)}
              placeholder="e.g. Khung cảnh nhìn từ trên đỉnh núi thật tráng lệ."
              className="w-full px-4 py-2 bg-white border border-slate-300 rounded-2xl text-xs font-medium text-slate-800"
            />
          </div>

          <div>
            <label className="block text-xs font-black uppercase text-slate-500 mb-1">
              Mẹo ghi nhớ (Mnemonic Hint)
            </label>
            <input
              type="text"
              value={hint}
              onChange={(e) => setHint(e.target.value)}
              placeholder="e.g. 'Magni' giống 'magnet' hút mọi ánh nhìn vì quá đẹp"
              className="w-full px-4 py-2 bg-white border border-slate-300 rounded-2xl text-xs font-medium text-purple-700 bg-purple-50/50"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-2xl"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-linear-to-r from-[#FFD13B] to-[#FFAA00] hover:from-[#FFC61A] text-[#4A3200] font-black text-sm rounded-2xl shadow-sm hover:shadow-md transition-all hover:scale-105"
            >
              {editingCard ? 'Cập Nhật' : 'Lưu Từ Vựng'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
