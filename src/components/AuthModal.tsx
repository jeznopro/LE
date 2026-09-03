import React, { useState } from 'react';
import { UserAccount } from '../types';
import { storage } from '../utils/storage';
import { soundManager } from '../utils/sounds';
import { supabase } from '../utils/supabase';
import { cloudSync } from '../utils/cloudSync';
import {
  LogIn,
  UserPlus,
  X,
  Check,
  LogOut,
  ShieldCheck,
  Cloud,
  Lock,
  Mail,
  RefreshCw,
} from 'lucide-react';

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
  const [tab, setTab] = useState<'cloud-login' | 'cloud-register'>('cloud-login');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('/gojo.png');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  // Supabase Cloud Registration
  const handleCloudRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!email.trim() || !password.trim()) {
      setError('Vui lòng nhập đầy đủ Email và Mật khẩu.');
      return;
    }
    if (password.length < 6) {
      setError('Mật khẩu cần ít nhất 6 ký tự.');
      return;
    }

    setLoading(true);
    try {
      const displayName = username.trim() || email.split('@')[0];
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password: password.trim(),
        options: {
          data: {
            username: displayName,
            avatar: selectedAvatar,
          },
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        setLoading(false);
        return;
      }

      if (data.user) {
        soundManager.playVictory();
        const newAcc: UserAccount = {
          id: data.user.id,
          username: displayName,
          avatar: selectedAvatar,
          email: data.user.email,
          createdAt: Date.now(),
        };

        // Seed initial cards & decks to cloud for this new user
        const initialCards = storage.getCards();
        const initialDecks = storage.getDecks();
        const initialStats = storage.getStats();

        cloudSync.saveAllCards(data.user.id, initialCards);
        cloudSync.saveAllDecks(data.user.id, initialDecks);
        cloudSync.saveUserStats(data.user.id, initialStats);

        storage.setCurrentUser(newAcc);
        onUserChange(newAcc);
        setSuccessMsg('Đăng ký tài khoản thành công! Dữ liệu đã được lưu lên đám mây.');
        setTimeout(() => onClose(), 1000);
      }
    } catch (err: any) {
      setError(err.message || 'Đăng ký thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  // Supabase Cloud Login
  const handleCloudLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!email.trim() || !password.trim()) {
      setError('Vui lòng nhập Email và Mật khẩu.');
      return;
    }

    setLoading(true);
    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
      });

      if (signInError) {
        setError(signInError.message);
        setLoading(false);
        return;
      }

      if (data.user) {
        soundManager.playVictory();
        const displayName = data.user.user_metadata?.username || data.user.email?.split('@')[0] || 'Học Viên';
        const userAvatar = data.user.user_metadata?.avatar || '/gojo.png';

        const userAcc: UserAccount = {
          id: data.user.id,
          username: displayName,
          avatar: userAvatar,
          email: data.user.email,
          createdAt: new Date(data.user.created_at).getTime(),
        };

        // Fetch cloud data and sync to local
        const cloudCards = await cloudSync.fetchUserCards(data.user.id);
        if (cloudCards && cloudCards.length > 0) {
          storage.saveCards(cloudCards);
        } else {
          cloudSync.saveAllCards(data.user.id, storage.getCards());
        }

        const cloudStats = await cloudSync.fetchUserStats(data.user.id);
        if (cloudStats) {
          storage.saveStats(cloudStats);
        } else {
          cloudSync.saveUserStats(data.user.id, storage.getStats());
        }

        storage.setCurrentUser(userAcc);
        onUserChange(userAcc);
        setSuccessMsg('Đăng nhập đám mây thành công! Tiến độ học đã được đồng bộ.');
        setTimeout(() => onClose(), 800);
      }
    } catch (err: any) {
      setError(err.message || 'Đăng nhập thất bại.');
    } finally {
      setLoading(false);
    }
  };

  // Google 1-Click Login
  const handleGoogleLogin = async () => {
    setError('');
    soundManager.playClick();
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) setError(error.message);
    } catch (err: any) {
      setError(err.message || 'Đăng nhập Google thất bại');
    }
  };

  const handleLogout = async () => {
    soundManager.playClick();
    await supabase.auth.signOut();
    storage.logout();
    onUserChange(null);
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
            <div className="w-10 h-10 rounded-2xl bg-linear-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-black shadow-xs">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-black">
                {currentUser ? 'Hồ Sơ Của Bạn' : 'Tài Khoản & Đám Mây'}
              </h3>
              <p className="text-xs text-slate-400 font-semibold">
                {currentUser ? `Đang đăng nhập: ${currentUser.username}` : 'Lưu trữ tiến độ vĩnh viễn trên Supabase'}
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

        {/* If logged in */}
        {currentUser ? (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-linear-to-r from-blue-50 to-indigo-50 dark:from-slate-700 dark:to-slate-700/60 border border-blue-200 dark:border-slate-600 flex items-center gap-3.5">
              <div className="w-14 h-14 rounded-2xl overflow-hidden bg-white shadow-xs border border-blue-300 flex items-center justify-center shrink-0">
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
                <div className="flex items-center gap-1.5 text-[11px] text-blue-700 dark:text-blue-300 font-bold mt-1">
                  <Cloud className="w-3.5 h-3.5" />
                  <span>Đã kết nối Supabase Cloud Database</span>
                </div>
              </div>
            </div>

            {/* Logout button */}
            <div className="pt-2 flex items-center gap-3">
              <button
                onClick={handleLogout}
                className="flex-1 py-3 px-4 bg-rose-50 hover:bg-rose-100 text-rose-600 font-black text-xs rounded-2xl border border-rose-200 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Đăng Xuất</span>
              </button>
              <button
                onClick={onClose}
                className="flex-1 py-3 px-4 bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-xs rounded-2xl shadow-md transition-all cursor-pointer"
              >
                Tiếp Tục Học
              </button>
            </div>
          </div>
        ) : (
          /* Not logged in: Show Cloud Login & Register */
          <div className="space-y-4">
            {/* Tabs */}
            <div className="flex bg-slate-100 dark:bg-slate-700/60 p-1 rounded-2xl">
              <button
                type="button"
                onClick={() => {
                  setTab('cloud-login');
                  setError('');
                }}
                className={`flex-1 py-2 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  tab === 'cloud-login'
                    ? 'bg-white dark:bg-slate-800 shadow-xs text-blue-600 dark:text-blue-400'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Đăng Nhập</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setTab('cloud-register');
                  setError('');
                }}
                className={`flex-1 py-2 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  tab === 'cloud-register'
                    ? 'bg-white dark:bg-slate-800 shadow-xs text-blue-600 dark:text-blue-400'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Tạo Tài Khoản</span>
              </button>
            </div>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-600 text-xs font-bold rounded-xl animate-fadeIn">
                {error}
              </div>
            )}

            {successMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold rounded-xl animate-fadeIn">
                {successMsg}
              </div>
            )}

            {/* TAB 1: CLOUD LOGIN */}
            {tab === 'cloud-login' && (
              <form onSubmit={handleCloudLogin} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-black uppercase text-slate-500 mb-1.5">
                    Email đăng nhập:
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="ban@example.com"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl text-xs sm:text-sm font-semibold focus:outline-hidden focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase text-slate-500 mb-1.5">
                    Mật khẩu:
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl text-xs sm:text-sm font-semibold focus:outline-hidden focus:border-blue-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-linear-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-black text-xs sm:text-sm rounded-2xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Cloud className="w-4 h-4" />}
                  <span>Đăng Nhập Đám Mây</span>
                </button>

                <div className="relative my-4 text-center">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200 dark:border-slate-700" />
                  </div>
                  <span className="relative px-3 bg-white dark:bg-slate-800 text-slate-400 text-xs font-bold">
                    HOẶC
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  className="w-full py-2.5 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-100 font-black text-xs rounded-2xl border border-slate-300 dark:border-slate-600 flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Đăng Nhập Bằng Tài Khoản Google</span>
                </button>
              </form>
            )}

            {/* TAB 2: CLOUD REGISTER */}
            {tab === 'cloud-register' && (
              <form onSubmit={handleCloudRegister} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-black uppercase text-slate-500 mb-1">
                    Tên hiển thị / Biệt danh: *
                  </label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Ví dụ: Triết Pro, Minh Hoàng..."
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl text-xs sm:text-sm font-semibold focus:outline-hidden focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase text-slate-500 mb-1">
                    Email của bạn: *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ban@example.com"
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl text-xs sm:text-sm font-semibold focus:outline-hidden focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase text-slate-500 mb-1">
                    Mật khẩu (ít nhất 6 ký tự): *
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl text-xs sm:text-sm font-semibold focus:outline-hidden focus:border-blue-500"
                  />
                </div>

                {/* Avatar Selection */}
                <div>
                  <label className="block text-xs font-black uppercase text-slate-500 mb-1.5">
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
                          className={`h-11 rounded-2xl border-2 flex items-center justify-center transition-all hover:scale-105 relative cursor-pointer ${
                            isSelected
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40 shadow-xs scale-105'
                              : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100'
                          }`}
                        >
                          {av.isImg ? (
                            <img src={av.src} alt={av.label} className="w-7 h-7 rounded-lg object-cover" />
                          ) : (
                            <span className="text-lg">{av.emoji}</span>
                          )}
                          {isSelected && (
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center text-white text-[10px]">
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
                  disabled={loading}
                  className="w-full py-3 bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-xs sm:text-sm rounded-2xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Cloud className="w-4 h-4" />}
                  <span>Tạo Tài Khoản & Lưu Lên Đám Mây</span>
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
