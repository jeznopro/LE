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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn select-none"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-lg p-6 sm:p-7 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-5 animate-scaleUp text-slate-800 dark:text-slate-100 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center font-black shadow-xs">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-black">
                {mode === 'view' ? 'Hồ Sơ & Quản Lý Tài Khoản' : 'Tạo Hồ Sơ Học Tập Mới'}
              </h3>
              <p className="text-xs text-slate-400 font-semibold">
                Dữ liệu lưu an toàn 100% trên thiết bị của bạn
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 text-rose-600 text-xs font-bold border border-rose-200">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200 flex items-center gap-2">
            <Check className="w-4 h-4" /> {successMsg}
          </div>
        )}

        {/* MODE 1: Profile Overview & Switcher */}
        {mode === 'view' && (
          <div className="space-y-5">
            {/* Current Active User Profile Card */}
            {currentUser && (
              <div className="p-4 rounded-2xl bg-linear-to-r from-rose-50 to-orange-50 dark:from-slate-700 dark:to-slate-700/60 border border-rose-200 dark:border-slate-600 flex items-center gap-3.5">
                <div className="w-14 h-14 rounded-2xl overflow-hidden bg-white shadow-xs border border-rose-300 flex items-center justify-center shrink-0">
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
                    <span className="font-black text-base truncate">{currentUser.username}</span>
                    <span className="px-2 py-0.5 rounded-md bg-rose-500 text-white text-[10px] font-bold">
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
              <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                <span>Chuyển Sang Hồ Sơ Khác Trên Máy Này:</span>
                <button
                  onClick={() => setMode('create-profile')}
                  className="text-rose-500 hover:text-rose-600 font-extrabold flex items-center gap-1 cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" /> + Thêm Hồ Sơ
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
                {users
                  .filter((u) => u.id !== currentUser?.id)
                  .map((u) => (
                    <button
                      key={u.id}
                      onClick={() => handleSwitchUser(u)}
                      className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-750 hover:border-rose-400 flex items-center gap-2 text-left transition-all hover:scale-[1.02] cursor-pointer"
                    >
                      <div className="w-8 h-8 rounded-lg overflow-hidden bg-white shrink-0 flex items-center justify-center">
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
                          <span className="text-base">{u.avatar || '👤'}</span>
                        )}
                      </div>
                      <div className="truncate text-xs font-bold">{u.username}</div>
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
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-700">
              <span className="text-xs font-bold text-slate-500">Sao Lưu & Di Chuyển Dữ Liệu:</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleExportData}
                  className="p-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4 text-emerald-500" />
                  <span>Sao Lưu Ra File JSON</span>
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center justify-center gap-2 transition-all cursor-pointer"
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
              className="w-full py-3 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-300 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
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
              <label className="block text-xs font-black uppercase text-slate-500 tracking-wider mb-1.5">
                Tên Hồ Sơ / Người Học Mới: *
              </label>
              <input
                type="text"
                required
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                placeholder="Ví dụ: Triết, Bé Bắp, IELTS 8.0..."
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl text-sm font-semibold focus:outline-hidden focus:border-rose-500"
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase text-slate-500 tracking-wider mb-2">
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
                      className={`h-12 rounded-xl border-2 flex items-center justify-center transition-all cursor-pointer ${
                        isSelected
                          ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/40 shadow-xs scale-105'
                          : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700'
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

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setMode('view')}
                className="flex-1 py-3 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold text-xs rounded-xl cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="flex-1 py-3 bg-rose-500 hover:bg-rose-600 text-white font-black text-xs rounded-xl shadow-md cursor-pointer"
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
