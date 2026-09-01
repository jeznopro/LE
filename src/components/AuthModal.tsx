import React, { useState } from 'react';
import { UserAccount } from '../types';
import { storage } from '../utils/storage';
import { soundManager } from '../utils/sounds';
import { User, LogIn, UserPlus, X, Check, Sparkles, LogOut, ShieldCheck } from 'lucide-react';

const AVATAR_OPTIONS = [
  { id: 'gojo', label: 'Gojo Satoru', src: '/gojo.png', isImg: true },
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
  const [tab, setTab] = useState<'login' | 'register'>('register');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('/gojo.png');
  const [existingUsers, setExistingUsers] = useState<UserAccount[]>(storage.getUsers());
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setError('Vui lòng nhập tên tài khoản của bạn');
      return;
    }

    soundManager.playCorrect();
    const newUser = storage.register(username, selectedAvatar, email);
    setExistingUsers(storage.getUsers());
    onUserChange(newUser);
    onClose();
  };

  const handleSelectUser = (userId: string) => {
    soundManager.playClick();
    const logged = storage.login(userId);
    if (logged) {
      onUserChange(logged);
      onClose();
    }
  };

  const handleLogout = () => {
    soundManager.playClick();
    storage.logout();
    onUserChange(null);
    onClose();
  };

  const handleQuickGuest = () => {
    soundManager.playVictory();
    const guestUser = storage.register('Học Viên Mới', '/gojo.png');
    setExistingUsers(storage.getUsers());
    onUserChange(guestUser);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-md p-6 sm:p-7 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-5 animate-scaleUp text-slate-800 dark:text-slate-100 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 flex items-center justify-center font-black">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-black">
                {currentUser ? 'Hồ Sơ Của Bạn' : 'Tài Khoản Học Tập'}
              </h3>
              <p className="text-xs text-slate-400 font-semibold">
                {currentUser ? `Đang đăng nhập: ${currentUser.username}` : 'Lưu tiến độ và đồng bộ thẻ học'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* If logged in */}
        {currentUser ? (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-linear-to-r from-amber-50 to-orange-50 dark:from-slate-700 dark:to-slate-700/60 border border-amber-200 dark:border-slate-600 flex items-center gap-3.5">
              <div className="w-14 h-14 rounded-2xl overflow-hidden bg-white shadow-xs border border-amber-300 flex items-center justify-center shrink-0">
                {currentUser.avatar.startsWith('/') ? (
                  <img src={currentUser.avatar} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl">{currentUser.avatar}</span>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-1.5">
                  <h4 className="font-black text-lg text-slate-800 dark:text-slate-100">
                    {currentUser.username}
                  </h4>
                  <ShieldCheck className="w-4 h-4 text-emerald-500 fill-emerald-100" />
                </div>
                {currentUser.email && (
                  <p className="text-xs text-slate-500 font-semibold">{currentUser.email}</p>
                )}
                <p className="text-[11px] text-amber-700 dark:text-amber-300 font-bold mt-0.5">
                  ✨ Thành viên Learning English PRO
                </p>
              </div>
            </div>

            {/* Other Profiles list */}
            {existingUsers.length > 1 && (
              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-slate-400 tracking-wider">
                  Chuyển đổi hồ sơ khác:
                </label>
                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {existingUsers
                    .filter((u) => u.id !== currentUser.id)
                    .map((user) => (
                      <button
                        key={user.id}
                        onClick={() => handleSelectUser(user.id)}
                        className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center justify-between text-left transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg overflow-hidden bg-slate-100 flex items-center justify-center">
                            {user.avatar.startsWith('/') ? (
                              <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-base">{user.avatar}</span>
                            )}
                          </div>
                          <span className="text-xs font-bold">{user.username}</span>
                        </div>
                        <span className="text-[11px] text-amber-600 font-bold">Chọn</span>
                      </button>
                    ))}
                </div>
              </div>
            )}

            {/* Logout button */}
            <div className="pt-2 flex items-center gap-3">
              <button
                onClick={handleLogout}
                className="flex-1 py-3 px-4 bg-rose-50 hover:bg-rose-100 text-rose-600 font-black text-xs rounded-2xl border border-rose-200 flex items-center justify-center gap-1.5 transition-all"
              >
                <LogOut className="w-4 h-4" />
                <span>Đăng Xuất</span>
              </button>
              <button
                onClick={onClose}
                className="flex-1 py-3 px-4 bg-slate-900 hover:bg-black text-white font-black text-xs rounded-2xl shadow-md transition-all"
              >
                Tiếp Tục Học
              </button>
            </div>
          </div>
        ) : (
          /* Not logged in: Show Register / Login Form */
          <div className="space-y-4">
            {/* Tabs */}
            <div className="flex bg-slate-100 dark:bg-slate-700/60 p-1 rounded-2xl">
              <button
                type="button"
                onClick={() => {
                  setTab('register');
                  setError('');
                }}
                className={`flex-1 py-2 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                  tab === 'register'
                    ? 'bg-white dark:bg-slate-800 shadow-xs text-amber-600'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Tạo Tài Khoản</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setTab('login');
                  setError('');
                }}
                className={`flex-1 py-2 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                  tab === 'login'
                    ? 'bg-white dark:bg-slate-800 shadow-xs text-amber-600'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Đăng Nhập ({existingUsers.length})</span>
              </button>
            </div>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-600 text-xs font-bold rounded-xl">
                {error}
              </div>
            )}

            {tab === 'register' ? (
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="block text-xs font-black uppercase text-slate-500 mb-1.5">
                    Tên hiển thị / Biệt danh: *
                  </label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Ví dụ: Triết Pro, Gojo Học Bá..."
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl text-sm font-semibold focus:outline-hidden focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase text-slate-500 mb-1.5">
                    Email (Tùy chọn):
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl text-sm font-semibold focus:outline-hidden focus:border-amber-500"
                  />
                </div>

                {/* Avatar Selection */}
                <div>
                  <label className="block text-xs font-black uppercase text-slate-500 mb-2">
                    Chọn Avatar Nhân Vật:
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    {AVATAR_OPTIONS.map((av) => {
                      const isSelected = selectedAvatar === (av.isImg ? av.src : av.emoji);
                      return (
                        <button
                          key={av.id}
                          type="button"
                          onClick={() => setSelectedAvatar(av.isImg ? av.src! : av.emoji!)}
                          className={`h-12 rounded-2xl border-2 flex items-center justify-center transition-all hover:scale-105 relative ${
                            isSelected
                              ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 shadow-xs scale-105'
                              : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100'
                          }`}
                        >
                          {av.isImg ? (
                            <img src={av.src} alt={av.label} className="w-8 h-8 rounded-lg object-cover" />
                          ) : (
                            <span className="text-xl">{av.emoji}</span>
                          )}
                          {isSelected && (
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center text-white text-[10px]">
                              <Check className="w-2.5 h-2.5 stroke-[3]" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-linear-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black text-sm rounded-2xl shadow-md transition-all active:scale-95"
                >
                  Tạo Tài Khoản & Bắt Đầu Học 🚀
                </button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={handleQuickGuest}
                    className="text-xs font-bold text-slate-400 hover:text-amber-600 transition-colors inline-flex items-center gap-1"
                  >
                    <Sparkles className="w-3.5 h-3.5" /> Vào nhanh với tư cách Khách
                  </button>
                </div>
              </form>
            ) : (
              /* Login tab */
              <div className="space-y-3">
                {existingUsers.length === 0 ? (
                  <div className="text-center py-6 text-slate-400 text-xs">
                    Chưa có tài khoản nào được lưu trên máy này.
                    <button
                      onClick={() => setTab('register')}
                      className="block mx-auto mt-2 text-amber-600 font-bold underline"
                    >
                      Bấm vào đây để tạo tài khoản mới
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-56 overflow-y-auto">
                    {existingUsers.map((user) => (
                      <button
                        key={user.id}
                        onClick={() => handleSelectUser(user.id)}
                        className="w-full p-3 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-amber-400 hover:bg-amber-50/50 dark:hover:bg-slate-700 flex items-center justify-between text-left transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-100 flex items-center justify-center border border-slate-200">
                            {user.avatar.startsWith('/') ? (
                              <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-xl">{user.avatar}</span>
                            )}
                          </div>
                          <div>
                            <div className="text-sm font-black text-slate-800 dark:text-slate-100">
                              {user.username}
                            </div>
                            <div className="text-[11px] text-slate-400">
                              Tạo ngày {new Date(user.createdAt).toLocaleDateString('vi-VN')}
                            </div>
                          </div>
                        </div>
                        <span className="px-3 py-1 rounded-xl bg-amber-500 text-white text-xs font-black">
                          Vào Học
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
