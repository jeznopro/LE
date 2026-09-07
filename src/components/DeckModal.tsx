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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fadeIn">
      <div className="liquid-glass-modal rounded-3xl w-full max-w-md p-6 sm:p-8 space-y-5 animate-scaleUp shadow-2xl text-slate-800 dark:text-slate-100">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-black text-slate-900 dark:text-white">
            {editingDeck ? 'Chỉnh Sửa Bộ Thẻ' : 'Tạo Bộ Thẻ Mới'}
          </h2>
          <button
            onClick={onClose}
            className="liquid-glass-subtle p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl transition-all cursor-pointer hover:scale-105"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-black uppercase text-slate-500 dark:text-slate-400 mb-1">
              Tên Bộ Thẻ *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. 500 Từ Vựng Giao Tiếp"
              className="liquid-glass-input w-full px-4 py-2.5 rounded-2xl text-sm font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-black uppercase text-slate-500 dark:text-slate-400 mb-1">
              Mô Tả Ngắn
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Dành cho người mới bắt đầu học tiếng Anh..."
              className="liquid-glass-input w-full px-4 py-2 rounded-2xl text-xs font-medium"
            />
          </div>

          {/* Emoji */}
          <div>
            <label className="block text-xs font-black uppercase text-slate-500 dark:text-slate-400 mb-1.5">
              Biểu Tượng (Emoji)
            </label>
            <div className="flex items-center gap-1.5 flex-wrap">
              {EMOJIS.map((em) => (
                <button
                  key={em}
                  type="button"
                  onClick={() => setEmoji(em)}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg transition-all cursor-pointer ${
                    emoji === em
                      ? 'bg-amber-400/30 border-2 border-amber-400 scale-110 shadow-sm'
                      : 'liquid-glass-subtle hover:scale-105'
                  }`}
                >
                  {em}
                </button>
              ))}
            </div>
          </div>

          {/* Color */}
          <div>
            <label className="block text-xs font-black uppercase text-slate-500 dark:text-slate-400 mb-1.5">
              Màu Thẻ
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              {COLORS.map((col) => (
                <button
                  key={col}
                  type="button"
                  onClick={() => setColor(col)}
                  style={{ backgroundColor: col }}
                  className={`w-8 h-8 rounded-xl transition-all cursor-pointer ${
                    color === col ? 'ring-3 ring-amber-500 scale-110 shadow-md' : 'opacity-80 hover:opacity-100 hover:scale-105'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Buttons */}
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
              className="liquid-glass-pill px-6 py-2.5 bg-linear-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-amber-950 font-black text-sm shadow-lg shadow-amber-500/20 cursor-pointer hover:scale-105"
            >
              {editingDeck ? 'Lưu Thay Đổi' : 'Tạo Bộ Thẻ'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
