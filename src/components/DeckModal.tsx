import React, { useState, useEffect } from 'react';
import { Deck } from '../types';
import { soundManager } from '../utils/sounds';
import { X } from 'lucide-react';

interface DeckModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveDeck: (deckData: Partial<Deck>) => void;
  editingDeck?: Deck | null;
}

const EMOJIS = ['🍡', '📚', '💼', '🎓', '⭐', '🔥', '🌸', '💡', '🏆', '🚀', '🐱', '☕'];
const COLORS = ['#FED770', '#FF8A8A', '#7BDCB5', '#A5D8FF', '#D0BFFF', '#FFA8A8', '#FFD43B', '#69DB7C'];

export const DeckModal: React.FC<DeckModalProps> = ({
  isOpen,
  onClose,
  onSaveDeck,
  editingDeck,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [emoji, setEmoji] = useState('🍡');
  const [color, setColor] = useState('#FED770');

  useEffect(() => {
    if (editingDeck) {
      setTitle(editingDeck.title);
      setDescription(editingDeck.description || '');
      setEmoji(editingDeck.emoji || '🍡');
      setColor(editingDeck.color || '#FED770');
    } else {
      setTitle('');
      setDescription('');
      setEmoji('🍡');
      setColor('#FED770');
    }
  }, [editingDeck, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    soundManager.playClick();
    onSaveDeck({
      id: editingDeck ? editingDeck.id : `deck-${Date.now()}`,
      title: title.trim(),
      description: description.trim(),
      emoji,
      color,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-3xl w-full max-w-md border border-[#E9E4F0] shadow-2xl p-6 sm:p-8">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-black text-[#2E241E]">
            {editingDeck ? 'Chỉnh Sửa Bộ Thẻ' : 'Tạo Bộ Thẻ Mới'}
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
              Tên Bộ Thẻ *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. 500 Từ Vựng Giao Tiếp"
              className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-2xl text-sm font-bold text-slate-800 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
            />
          </div>

          <div>
            <label className="block text-xs font-black uppercase text-slate-500 mb-1">
              Mô Tả Ngắn
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Dành cho người mới bắt đầu học tiếng Anh..."
              className="w-full px-4 py-2 bg-white border border-slate-300 rounded-2xl text-xs font-medium text-slate-800"
            />
          </div>

          {/* Emoji */}
          <div>
            <label className="block text-xs font-black uppercase text-slate-500 mb-1.5">
              Biểu Tượng (Emoji)
            </label>
            <div className="flex items-center gap-1.5 flex-wrap">
              {EMOJIS.map((em) => (
                <button
                  key={em}
                  type="button"
                  onClick={() => setEmoji(em)}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg transition-all ${
                    emoji === em
                      ? 'bg-amber-200 ring-2 ring-amber-500 scale-110'
                      : 'bg-slate-100 hover:bg-slate-200'
                  }`}
                >
                  {em}
                </button>
              ))}
            </div>
          </div>

          {/* Color */}
          <div>
            <label className="block text-xs font-black uppercase text-slate-500 mb-1.5">
              Màu Thẻ
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              {COLORS.map((col) => (
                <button
                  key={col}
                  type="button"
                  onClick={() => setColor(col)}
                  style={{ backgroundColor: col }}
                  className={`w-8 h-8 rounded-xl transition-all ${
                    color === col ? 'ring-3 ring-slate-800 scale-110' : 'opacity-80 hover:opacity-100'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Buttons */}
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
              {editingDeck ? 'Lưu Thay Đổi' : 'Tạo Bộ Thẻ'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
