import React, { useState, useRef } from 'react';
import { UserAccount } from '../types';
import { storage } from '../utils/storage';
import { soundManager } from '../utils/sounds';
import {
  X,
  UserPlus,
  LogOut,
  Download,
  Upload,
  Laptop,
  Check,
  Users,
  Lock,
  ArrowRight,
  Sparkles,
  Trash2,
} from 'lucide-react';

const AVATAR_OPTIONS = [
  { id: 'gojo', label: 'Gojo Satoru', src: './gojo.png', isImg: true },
  { id: 'ninja', label: 'Ninja', emoji: '🥷' },
  { id: 'samurai', label: 'Samurai', emoji: '⚔️' },
  { id: 'wizard', label: 'Phù Thủy', emoji: '🧙‍♂️' },
  { id: 'fox', label: 'Cáo Tuyết', emoji: '🦊' },
  { id: 'cat', label: 'Mèo Lofi', emoji: '🐱' },
  { id: 'star', label: 'Ngôi Sao', emoji: '⭐' },
  { id: 'rocket', label: 'Phi Hành', emoji: '🚀' },
  { id: 'fire', label: 'Chiến Binh', emoji: '🔥' },
  { id: 'crown', label: 'Quán Quân', emoji: '👑' },
];

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserAccount | null;
  onUserChange: (user: UserAccount | null) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUserChange,
}) => {
  const [mode, setMode] = useState<'view' | 'create-profile'>('view');
  const [newUsername, setNewUsername] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('./gojo.png');
  const [newPin, setNewPin] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const users = storage.getUsers();

  // Switch profile
  const handleSwitchUser = (user: UserAccount) => {
    soundManager.playVictory();
    storage.setCurrentUser(user);
    onUserChange(user);
    onClose();
  };

  // Logout / Switch account screen
  const handleLogout = () => {
    soundManager.playClick();
    storage.logout();
    onUserChange(null);
    onClose();
  };

  // Create new profile inside modal
  const handleCreateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmed = newUsername.trim();
    if (!trimmed) {
      setError('Vui lòng nhập tên hồ sơ');
      return;
    }

    soundManager.playVictory();
    const newUser = storage.createProfile(trimmed, selectedAvatar, newPin.trim() || undefined);
    onUserChange(newUser);
    setSuccessMsg('Đã tạo hồ sơ mới thành công!');
    setTimeout(() => {
      onClose();
    }, 800);
  };

  // Export current user data to JSON
  const handleExportData = () => {
    if (!currentUser) return;
    soundManager.playVictory();
    const jsonString = storage.exportUserData(currentUser.id);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `MochiAnki_${currentUser.username.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setSuccessMsg('Đã tải xuống file sao lưu thành công!');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  // Import JSON data
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const jsonStr = event.target?.result as string;
        const importedUser = storage.importUserData(jsonStr);
        if (importedUser) {
          soundManager.playVictory();
          onUserChange(importedUser);
          setSuccessMsg('Đã nhập và chuyển sang hồ sơ sao lưu thành công!');
          setTimeout(() => onClose(), 1000);
        } else {
          setError('File sao lưu không hợp lệ.');
        }
      } catch (err: any) {
        setError('Lỗi khi đọc file: ' + err.message);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fadeIn select-none"
      onClick={onClose}
    >
      <div
        className="liquid-glass-modal rounded-3xl w-full max-w-lg p-6 sm:p-7 shadow-2xl space-y-5 animate-scaleUp text-slate-800 dark:text-slate-100 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center font-black shadow-inner border border-rose-400/30">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white">
                {mode === 'view' ? 'Hồ Sơ & Quản Lý Tài Khoản' : 'Tạo Hồ Sơ Học Tập Mới'}
              </h3>
              <p className="text-xs text-slate-400 font-semibold">
                Dữ liệu lưu an toàn 100% trên thiết bị của bạn
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="liquid-glass-subtle p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl transition-all cursor-pointer hover:scale-105"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-2xl bg-rose-500/15 text-rose-600 dark:text-rose-300 text-xs font-bold border border-rose-400/30">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="p-3 rounded-2xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-xs font-bold border border-emerald-400/30 flex items-center gap-2">
            <Check className="w-4 h-4" /> {successMsg}
          </div>
        )}

        {/* MODE 1: Profile Overview & Switcher */}
        {mode === 'view' && (
          <div className="space-y-5">
            {/* Current Active User Profile Card */}
            {currentUser && (
              <div className="p-4 rounded-2xl liquid-glass-subtle border-rose-400/30 flex items-center gap-3.5">
                <div className="w-14 h-14 rounded-2xl overflow-hidden liquid-glass-subtle shadow-inner border border-rose-300/40 flex items-center justify-center shrink-0">
                  {currentUser.avatar && (currentUser.avatar.startsWith('.') || currentUser.avatar.startsWith('/') || currentUser.avatar.startsWith('http')) ? (
                    <img
                      src={currentUser.avatar.startsWith('/') ? '.' + currentUser.avatar : currentUser.avatar}
                      alt="avatar"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : (
                    <span className="text-3xl">{currentUser.avatar || '👤'}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-base truncate text-slate-900 dark:text-white">{currentUser.username}</span>
                    <span className="liquid-glass-pill px-2 py-0.5 bg-rose-500 text-white text-[10px] font-bold">
                      Đang Học
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {storage.getCardsForUser(currentUser.id).length} thẻ từ • {storage.getDecksForUser(currentUser.id).length} bộ deck
                  </p>
                </div>
              </div>
            )}

            {/* Quick Switch to Other Profiles */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
                <span>Chuyển Sang Hồ Sơ Khác Trên Máy Này:</span>
                <button
                  onClick={() => setMode('create-profile')}
                  className="liquid-glass-pill text-rose-500 hover:text-rose-400 font-extrabold flex items-center gap-1 cursor-pointer px-2.5 py-1 text-xs"
                >
                  <UserPlus className="w-3.5 h-3.5" /> + Thêm Hồ Sơ
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                {users
                  .filter((u) => u.id !== currentUser?.id)
                  .map((u) => (
                    <button
                      key={u.id}
                      onClick={() => handleSwitchUser(u)}
                      className="p-3 rounded-2xl liquid-glass-subtle hover:border-rose-400/50 flex items-center gap-2.5 text-left transition-all hover:scale-[1.02] cursor-pointer"
                    >
                      <div className="w-9 h-9 rounded-xl overflow-hidden liquid-glass-subtle shrink-0 flex items-center justify-center border border-white/40 dark:border-white/10 shadow-inner">
                        {u.avatar.startsWith('.') || u.avatar.startsWith('/') || u.avatar.startsWith('http') ? (
                          <img
                            src={u.avatar.startsWith('/') ? '.' + u.avatar : u.avatar}
                            alt="avatar"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        ) : (
                          <span className="text-xl">{u.avatar || '👤'}</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-xs font-extrabold text-slate-800 dark:text-slate-100">{u.username}</div>
                        <div className="text-[10px] text-slate-400 dark:text-slate-400">
                          {storage.getCardsForUser(u.id).length} từ vựng
                        </div>
                      </div>
                    </button>
                  ))}

                {users.length <= 1 && (
                  <div className="col-span-2 text-center py-3 text-xs text-slate-400 italic">
                    Chưa có hồ sơ nào khác trên máy này. Bấm "+ Thêm Hồ Sơ" để tạo thêm.
                  </div>
                )}
              </div>
            </div>

            {/* Backup & Restore Tools */}
            <div className="space-y-2 pt-2 border-t border-white/40 dark:border-white/10">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Sao Lưu & Di Chuyển Dữ Liệu:</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleExportData}
                  className="liquid-glass-subtle p-3 rounded-2xl text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center justify-center gap-2 transition-all cursor-pointer hover:scale-102"
                >
                  <Download className="w-4 h-4 text-emerald-500" />
                  <span>Sao Lưu Ra File JSON</span>
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="liquid-glass-subtle p-3 rounded-2xl text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center justify-center gap-2 transition-all cursor-pointer hover:scale-102"
                >
                  <Upload className="w-4 h-4 text-indigo-500" />
                  <span>Khôi Phục Từ File JSON</span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleImportFile}
                  className="hidden"
                />
              </div>
            </div>

            {/* Log out / Switch screen button */}
            <button
              onClick={handleLogout}
              className="liquid-glass-pill w-full py-3 bg-rose-500/15 hover:bg-rose-500/25 text-rose-600 dark:text-rose-300 font-bold text-xs border border-rose-400/30 rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer hover:scale-102"
            >
              <LogOut className="w-4 h-4" />
              <span>Đăng Xuất / Quay Lại Màn Hình Chọn Hồ Sơ</span>
            </button>
          </div>
        )}

        {/* MODE 2: Create Profile */}
        {mode === 'create-profile' && (
          <form onSubmit={handleCreateProfile} className="space-y-4">
            <div>
              <label className="block text-xs font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider mb-1.5">
                Tên Hồ Sơ / Người Học Mới: *
              </label>
              <input
                type="text"
                required
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                placeholder="Ví dụ: Triết, Bé Bắp, IELTS 8.0..."
                className="liquid-glass-input w-full px-4 py-3 rounded-2xl text-sm font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider mb-2">
                Chọn Ảnh Avatar:
              </label>
              <div className="grid grid-cols-5 gap-2">
                {AVATAR_OPTIONS.map((av) => {
                  const isSelected = selectedAvatar === (av.isImg ? av.src : av.emoji);
                  return (
                    <button
                      key={av.id}
                      type="button"
                      onClick={() => setSelectedAvatar(av.isImg ? av.src! : av.emoji!)}
                      className={`h-12 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                        isSelected
                          ? 'border-2 border-rose-500 bg-rose-500/20 shadow-md scale-105'
                          : 'liquid-glass-subtle'
                      }`}
                    >
                      {av.isImg ? (
                        <img
                          src={av.src}
                          alt={av.label}
                          className="w-8 h-8 rounded-lg object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      ) : (
                        <span className="text-xl">{av.emoji}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-white/40 dark:border-white/10">
              <button
                type="button"
                onClick={() => setMode('view')}
                className="liquid-glass-pill flex-1 py-3 text-slate-600 dark:text-slate-300 font-bold text-xs rounded-2xl cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="liquid-glass-pill flex-1 py-3 bg-rose-500 hover:bg-rose-600 text-white font-black text-xs rounded-2xl shadow-lg shadow-rose-500/25 cursor-pointer hover:scale-102"
              >
                Tạo Hồ Sơ Mới 🚀
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
