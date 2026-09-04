import React, { useState, useRef } from 'react';
import { UserAccount } from '../types';
import { storage } from '../utils/storage';
import { soundManager } from '../utils/sounds';
import { INITIAL_CARDS, INITIAL_DECKS } from '../data/sampleDecks';
import {
  UserPlus,
  Check,
  Brain,
  Headphones,
  Upload,
  Lock,
  Trash2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Laptop,
  Users,
  KeyRound,
  FileUp,
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

interface WelcomeLoginScreenProps {
  onLoginSuccess: (user: UserAccount) => void;
}

export const WelcomeLoginScreen: React.FC<WelcomeLoginScreenProps> = ({ onLoginSuccess }) => {
  const [users, setUsers] = useState<UserAccount[]>(() => storage.getUsers());
  const [isCreating, setIsCreating] = useState<boolean>(() => storage.getUsers().length === 0);
  const [newUsername, setNewUsername] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('./gojo.png');
  const [newPin, setNewPin] = useState('');
  const [seedSampleCards, setSeedSampleCards] = useState(false);
  const [error, setError] = useState('');

  // PIN prompt modal state
  const [pinTargetUser, setPinTargetUser] = useState<UserAccount | null>(null);
  const [enteredPin, setEnteredPin] = useState('');
  const [pinError, setPinError] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle select profile
  const handleSelectUser = (user: UserAccount) => {
    soundManager.playClick();
    if (user.pin) {
      setPinTargetUser(user);
      setEnteredPin('');
      setPinError('');
      return;
    }
    soundManager.playVictory();
    storage.setCurrentUser(user);
    onLoginSuccess(user);
  };

  // Submit PIN for protected profile
  const handleVerifyPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pinTargetUser) return;
    if (pinTargetUser.pin !== enteredPin.trim()) {
      setPinError('Mã PIN không chính xác. Vui lòng thử lại!');
      return;
    }
    soundManager.playVictory();
    storage.setCurrentUser(pinTargetUser);
    onLoginSuccess(pinTargetUser);
  };

  // Create new local profile
  const handleCreateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedName = newUsername.trim();
    if (!trimmedName) {
      setError('Vui lòng nhập tên người học hoặc biệt danh.');
      return;
    }

    soundManager.playVictory();
    const newUser = storage.createProfile(trimmedName, selectedAvatar, newPin.trim() || undefined);

    if (seedSampleCards) {
      storage.saveDecksForUser(newUser.id, INITIAL_DECKS);
      storage.saveCardsForUser(newUser.id, INITIAL_CARDS);
    }

    const updatedUsers = storage.getUsers();
    setUsers(updatedUsers);
    onLoginSuccess(newUser);
  };

  // Delete profile
  const handleDeleteUser = (e: React.MouseEvent, user: UserAccount) => {
    e.stopPropagation();
    soundManager.playClick();
    if (window.confirm(`Bạn có chắc chắn muốn xóa hồ sơ "${user.username}" và toàn bộ dữ liệu thẻ trên máy này?`)) {
      storage.deleteProfile(user.id);
      const updated = storage.getUsers();
      setUsers(updated);
      if (updated.length === 0) {
        setIsCreating(true);
      }
    }
  };

  // Import JSON backup
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
          setUsers(storage.getUsers());
          onLoginSuccess(importedUser);
        } else {
          setError('File sao lưu không đúng định dạng Mochi Anki JSON.');
        }
      } catch (err: any) {
        setError('Không thể đọc file sao lưu: ' + err.message);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen bg-animated-gradient flex flex-col items-center justify-center p-4 sm:p-6 select-none relative overflow-hidden">
      {/* Ambient background glow circles */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-purple-300/30 dark:bg-purple-900/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-amber-300/30 dark:bg-amber-900/20 rounded-full blur-3xl pointer-events-none" />

      {/* Brand Header */}
      <div className="text-center mb-6 z-10 animate-fadeIn">
        <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-md shadow-md border border-slate-200/80 dark:border-slate-700 mb-3">
          <img
            src="./gojo.png"
            alt="Gojo Logo"
            className="w-8 h-8 rounded-xl object-cover border border-amber-300"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
          <span className="font-black text-lg tracking-tight text-slate-800 dark:text-white">
            Learning <span className="text-rose-500">English</span> <span className="text-xs uppercase bg-rose-100 dark:bg-rose-950/60 text-rose-600 px-2 py-0.5 rounded-md font-bold">PRO</span>
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-white tracking-tight">
          Học Từ Vựng Thông Minh Theo Thời Điểm Vàng
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-semibold mt-1">
          💾 Toàn bộ dữ liệu thẻ & tiến độ học lưu an toàn 100% trên thiết bị của bạn
        </p>
      </div>

      {/* Main Card Container */}
      <div className="w-full max-w-xl bg-white/95 dark:bg-slate-850/95 rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-700/80 backdrop-blur-xl p-6 sm:p-8 z-10 animate-scaleUp">
        {/* VIEW 1: Profile Selector (When profiles already exist) */}
        {!isCreating && users.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-rose-500" />
                <h2 className="text-lg font-black text-slate-800 dark:text-white">
                  Chọn Hồ Sơ Học Tập Trên Máy Này
                </h2>
              </div>
              <button
                onClick={() => {
                  soundManager.playClick();
                  setIsCreating(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-300 font-bold text-xs rounded-xl border border-rose-200 dark:border-rose-900/40 transition-all active:scale-95 cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>+ Thêm Hồ Sơ Mới</span>
              </button>
            </div>

            {/* Profile Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {users.map((u) => {
                const userCards = storage.getCardsForUser(u.id);
                const userStats = storage.getStatsForUser(u.id);

                return (
                  <div
                    key={u.id}
                    onClick={() => handleSelectUser(u)}
                    className="group relative p-4 rounded-2xl border-2 border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/60 hover:border-rose-500 dark:hover:border-rose-400 hover:bg-white dark:hover:bg-slate-800 transition-all hover:scale-[1.03] hover:shadow-lg cursor-pointer flex flex-col items-center text-center select-none"
                  >
                    {/* Delete button (hover) */}
                    <button
                      onClick={(e) => handleDeleteUser(e, u)}
                      title="Xóa hồ sơ này khỏi máy"
                      className="absolute top-2 right-2 p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    {/* Avatar with glow */}
                    <div className="w-16 h-16 rounded-2xl overflow-hidden bg-white shadow-md border-2 border-white dark:border-slate-700 flex items-center justify-center mb-2.5 group-hover:border-rose-400 transition-colors">
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
                        <span className="text-3xl">{u.avatar || '👤'}</span>
                      )}
                    </div>

                    {/* Name */}
                    <div className="font-extrabold text-sm text-slate-800 dark:text-slate-100 group-hover:text-rose-600 dark:group-hover:text-rose-400 truncate max-w-full">
                      {u.username}
                    </div>

                    {/* Card & XP badge */}
                    <div className="text-[10px] text-slate-400 dark:text-slate-400 mt-1 font-semibold">
                      {userCards.length} từ • {userStats.streak || 0} ngày 🔥
                    </div>

                    {u.pin && (
                      <div className="mt-1.5 flex items-center gap-1 text-[10px] text-amber-500 font-bold">
                        <Lock className="w-3 h-3" /> Có mã PIN
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Bottom Actions: Backup / Import */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl transition-all cursor-pointer"
              >
                <FileUp className="w-4 h-4 text-indigo-500" />
                <span>Nhập File Sao Lưu (.json)</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleImportFile}
                className="hidden"
              />

              <div className="text-[11px] text-slate-400 text-center sm:text-right font-medium">
                Mỗi người học một hồ sơ riêng biệt • 100% bảo mật
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: Profile Creator (When creating or no profiles exist) */}
        {isCreating && (
          <form onSubmit={handleCreateProfile} className="space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-rose-500" />
                <h2 className="text-lg font-black text-slate-800 dark:text-white">
                  Tạo Hồ Sơ Học Tập Mới Trên Máy
                </h2>
              </div>
              {users.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    soundManager.playClick();
                    setIsCreating(false);
                  }}
                  className="text-xs font-bold text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                >
                  ← Quay lại
                </button>
              )}
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-300 text-xs font-bold border border-rose-200 dark:border-rose-900">
                {error}
              </div>
            )}

            {/* Input Name */}
            <div className="space-y-1.5">
              <label className="block text-xs font-black uppercase text-slate-500 tracking-wider">
                Tên Người Học / Biệt Danh: *
              </label>
              <input
                type="text"
                required
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                placeholder="Ví dụ: Triết, Học Viên IELTS, Bé Bắp..."
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl text-sm font-semibold focus:outline-hidden focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 text-slate-800 dark:text-slate-100"
              />
            </div>

            {/* Choose Avatar */}
            <div className="space-y-2">
              <label className="block text-xs font-black uppercase text-slate-500 tracking-wider">
                Chọn Ảnh Đại Diện (Avatar):
              </label>
              <div className="grid grid-cols-5 gap-2">
                {AVATAR_OPTIONS.map((av) => {
                  const isSelected = selectedAvatar === (av.isImg ? av.src : av.emoji);
                  return (
                    <button
                      key={av.id}
                      type="button"
                      onClick={() => {
                        soundManager.playClick();
                        setSelectedAvatar(av.isImg ? av.src! : av.emoji!);
                      }}
                      className={`h-14 rounded-2xl border-2 flex items-center justify-center transition-all hover:scale-105 relative cursor-pointer ${
                        isSelected
                          ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/40 scale-105 shadow-md'
                          : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800'
                      }`}
                    >
                      {av.isImg ? (
                        <img
                          src={av.src}
                          alt={av.label}
                          className="w-9 h-9 rounded-xl object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      ) : (
                        <span className="text-2xl">{av.emoji}</span>
                      )}
                      {isSelected && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 rounded-full flex items-center justify-center text-white text-[10px] shadow-xs">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Optional PIN */}
            <div className="space-y-1.5">
              <label className="block text-xs font-black uppercase text-slate-500 tracking-wider flex items-center justify-between">
                <span>Mã PIN 4 Số (Tùy Chọn):</span>
                <span className="text-[10px] text-slate-400 font-normal">Để bảo mật nếu dùng chung máy tính</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  maxLength={6}
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  placeholder="Để trống nếu không cần mã khóa"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-semibold focus:outline-hidden focus:border-rose-500 text-slate-800 dark:text-slate-100"
                />
              </div>
            </div>

            {/* Sample Deck Checkbox */}
            <label className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={seedSampleCards}
                onChange={(e) => setSeedSampleCards(e.target.checked)}
                className="mt-0.5 rounded-md accent-rose-500 w-4 h-4"
              />
              <div className="text-xs">
                <span className="font-black text-slate-800 dark:text-slate-100">
                  Cài đặt sẵn bộ thẻ mẫu (100 Từ Vựng Giao Tiếp Mochi)
                </span>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Bỏ chọn nếu bạn muốn tạo tài khoản trống 0 từ vựng để tự tạo bộ thẻ riêng của mình.
                </p>
              </div>
            </label>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full py-3.5 bg-linear-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white font-black text-sm rounded-2xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Hoàn Tất & Bắt Đầu Học Ngay</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Import Backup Alternative */}
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center justify-center gap-1 mx-auto cursor-pointer"
              >
                <FileUp className="w-3.5 h-3.5" />
                <span>Hoặc nhập dữ liệu từ file sao lưu (.json) cũ</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleImportFile}
                className="hidden"
              />
            </div>
          </form>
        )}
      </div>

      {/* Feature Highlights Footer */}
      <div className="mt-8 grid grid-cols-3 gap-3 sm:gap-6 max-w-xl w-full text-center z-10 animate-fadeIn">
        <div className="p-3 rounded-2xl bg-white/70 dark:bg-slate-900/70 border border-slate-200/60 dark:border-slate-800 backdrop-blur-md">
          <Brain className="w-5 h-5 text-rose-500 mx-auto mb-1" />
          <div className="text-xs font-black text-slate-800 dark:text-slate-100">SRS 5 Cấp Độ</div>
          <div className="text-[10px] text-slate-400">Thời điểm vàng</div>
        </div>
        <div className="p-3 rounded-2xl bg-white/70 dark:bg-slate-900/70 border border-slate-200/60 dark:border-slate-800 backdrop-blur-md">
          <Laptop className="w-5 h-5 text-indigo-500 mx-auto mb-1" />
          <div className="text-xs font-black text-slate-800 dark:text-slate-100">Lưu Trữ Cục Bộ</div>
          <div className="text-[10px] text-slate-400">0đ chi phí máy chủ</div>
        </div>
        <div className="p-3 rounded-2xl bg-white/70 dark:bg-slate-900/70 border border-slate-200/60 dark:border-slate-800 backdrop-blur-md">
          <ShieldCheck className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
          <div className="text-xs font-black text-slate-800 dark:text-slate-100">Riêng Tư 100%</div>
          <div className="text-[10px] text-slate-400">Không lo lộ dữ liệu</div>
        </div>
      </div>

      {/* PIN Prompt Modal */}
      {pinTargetUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
          onClick={() => setPinTargetUser(null)}
        >
          <div
            className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-sm p-6 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-4 animate-scaleUp text-slate-800 dark:text-slate-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-100 dark:bg-amber-950/50 text-amber-600 rounded-2xl">
                <KeyRound className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-black text-base">Nhập Mã PIN Hồ Sơ</h3>
                <p className="text-xs text-slate-400">Hồ sơ: {pinTargetUser.username}</p>
              </div>
            </div>

            {pinError && (
              <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600 text-xs font-bold">
                {pinError}
              </div>
            )}

            <form onSubmit={handleVerifyPin} className="space-y-4">
              <input
                type="password"
                autoFocus
                required
                maxLength={6}
                value={enteredPin}
                onChange={(e) => setEnteredPin(e.target.value)}
                placeholder="Nhập mã PIN..."
                className="w-full text-center tracking-widest text-xl px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-2xl font-bold focus:outline-hidden focus:border-rose-500"
              />

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPinTargetUser(null)}
                  className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-rose-500 text-white font-black text-xs rounded-xl shadow-md cursor-pointer"
                >
                  Mở Khóa 🔓
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
