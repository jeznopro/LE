import React, { useState } from 'react';
import { UserAccount } from '../types';
import { storage } from '../utils/storage';
import { soundManager } from '../utils/sounds';
import { supabase } from '../utils/supabase';
import { cloudSync } from '../utils/cloudSync';
import {
  LogIn,
  UserPlus,
  Check,
  Brain,
  Headphones,
  Cloud,
  Mail,
  Lock,
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

interface WelcomeLoginScreenProps {
  onLoginSuccess: (user: UserAccount) => void;
}

export const WelcomeLoginScreen: React.FC<WelcomeLoginScreenProps> = ({ onLoginSuccess }) => {
  const [tab, setTab] = useState<'cloud-login' | 'cloud-register'>('cloud-login');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('/gojo.png');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Cloud Supabase Login
  const handleCloudLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Vui lòng nhập đầy đủ Email và Mật khẩu.');
      return;
    }

    setLoading(true);
    try {
      const cleanEmail = email.trim();
      const cleanPassword = password.trim();

      // Check if user has a mapped alias on this device
      const savedAliases = JSON.parse(localStorage.getItem('user_gmail_aliases') || '{}');
      const aliasCandidate = savedAliases[cleanEmail.toLowerCase()];

      // 1. Try with alias first if known, else with cleanEmail
      let activeEmail = aliasCandidate || cleanEmail;
      let { data, error: signInErr } = await supabase.auth.signInWithPassword({
        email: activeEmail,
        password: cleanPassword,
      });

      // 2. If failed and we tried alias, retry with cleanEmail (or vice-versa)
      if (signInErr && activeEmail !== cleanEmail) {
        const retryRes = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: cleanPassword,
        });
        if (retryRes.data?.user) {
          data = retryRes.data;
          signInErr = null;
        }
      }

      if (signInErr) {
        setError(signInErr.message === 'Invalid login credentials' ? 'Email hoặc mật khẩu không chính xác.' : signInErr.message);
        setLoading(false);
        return;
      }

      if (data.user) {
        soundManager.playVictory();
        const user = data.user;
        const displayName = user.user_metadata?.username || user.email?.split('@')[0] || 'Học Viên';
        const userAvatar = user.user_metadata?.avatar || '/gojo.png';

        const userAcc: UserAccount = {
          id: user.id,
          username: displayName,
          avatar: userAvatar,
          email: user.user_metadata?.original_email || user.email,
          createdAt: new Date(user.created_at).getTime(),
        };

        // Sync user cards from cloud
        const cloudCards = await cloudSync.fetchUserCards(user.id);
        if (cloudCards && cloudCards.length > 0) {
          storage.saveCards(cloudCards);
        }

        const cloudStats = await cloudSync.fetchUserStats(user.id);
        if (cloudStats) {
          storage.saveStats(cloudStats);
        }

        const cloudDecks = await cloudSync.fetchUserDecks(user.id);
        if (cloudDecks && cloudDecks.length > 0) {
          storage.saveDecks(cloudDecks);
        }

        storage.setCurrentUser(userAcc);
        onLoginSuccess(userAcc);
      }
    } catch (err: any) {
      setError(err.message || 'Đăng nhập thất bại.');
    } finally {
      setLoading(false);
    }
  };

  // Cloud Supabase Register (Supports reusing Gmail for multiple accounts!)
  const handleCloudRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

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
      const cleanEmail = email.trim();
      const cleanPassword = password.trim();
      const displayName = username.trim() || cleanEmail.split('@')[0];

      // 1. First try regular sign up
      let targetSignUpEmail = cleanEmail;
      let { data, error: signUpErr } = await supabase.auth.signUp({
        email: targetSignUpEmail,
        password: cleanPassword,
        options: {
          data: {
            username: displayName,
            avatar: selectedAvatar,
            original_email: cleanEmail,
          },
        },
      });

      // 2. If email already registered -> Seamless Multi-Account / Auto-Login logic!
      if (signUpErr && (signUpErr.message.includes('already registered') || signUpErr.message.includes('already exists'))) {
        // A. Check if user typed the existing password -> Log in immediately!
        const { data: directSignIn, error: directSignInErr } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: cleanPassword,
        });

        if (directSignIn?.user && !directSignInErr) {
          soundManager.playVictory();
          const userAcc: UserAccount = {
            id: directSignIn.user.id,
            username: displayName,
            avatar: selectedAvatar,
            email: cleanEmail,
            createdAt: Date.now(),
          };
          storage.setCurrentUser(userAcc);
          onLoginSuccess(userAcc);
          return;
        }

        // B. User wants a NEW account with the SAME Gmail -> Auto-generate Gmail alias!
        const [localPart, domainPart] = cleanEmail.split('@');
        const aliasTag = Math.floor(1000 + Math.random() * 9000);
        targetSignUpEmail = `${localPart}+${aliasTag}@${domainPart}`;

        const aliasRes = await supabase.auth.signUp({
          email: targetSignUpEmail,
          password: cleanPassword,
          options: {
            data: {
              username: displayName,
              avatar: selectedAvatar,
              original_email: cleanEmail,
            },
          },
        });

        data = aliasRes.data;
        signUpErr = aliasRes.error;

        if (data?.user) {
          // Store alias locally so this device logs in seamlessly with the original email
          const savedAliases = JSON.parse(localStorage.getItem('user_gmail_aliases') || '{}');
          savedAliases[cleanEmail.toLowerCase()] = targetSignUpEmail;
          localStorage.setItem('user_gmail_aliases', JSON.stringify(savedAliases));
        }
      }

      if (signUpErr) {
        setError(signUpErr.message);
        setLoading(false);
        return;
      }

      if (data.user) {
        soundManager.playVictory();
        const newAcc: UserAccount = {
          id: data.user.id,
          username: displayName,
          avatar: selectedAvatar,
          email: cleanEmail,
          createdAt: Date.now(),
        };

        // Seed initial cards to cloud
        cloudSync.saveAllCards(data.user.id, storage.getCards());
        cloudSync.saveAllDecks(data.user.id, storage.getDecks());
        cloudSync.saveUserStats(data.user.id, storage.getStats());

        storage.setCurrentUser(newAcc);
        onLoginSuccess(newAcc);
      }
    } catch (err: any) {
      setError(err.message || 'Đăng ký thất bại.');
    } finally {
      setLoading(false);
    }
  };

  // Google 1-Click OAuth
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

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 bg-linear-to-b from-[#FFF9E6] via-[#F8F9FE] to-[#EFF2FE] dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-slate-800 dark:text-slate-100 relative overflow-hidden selection:bg-blue-300">
      
      {/* Ambient background glow */}
      <div className="absolute top-0 -left-40 w-96 h-96 bg-purple-400/20 dark:bg-purple-900/30 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute top-1/2 -right-40 w-96 h-96 bg-cyan-400/20 dark:bg-cyan-900/30 rounded-full blur-3xl pointer-events-none animate-pulse [animation-delay:2s]" />
      <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-blue-400/20 dark:bg-blue-900/30 rounded-full blur-3xl pointer-events-none animate-pulse [animation-delay:4s]" />

      <div className="w-full max-w-xl mx-auto space-y-6 relative z-10 animate-scaleUp">
        
        {/* Top Hero Brand & Gojo Mascot */}
        <div className="text-center space-y-3">
          <div className="relative inline-block group">
            <div className="absolute inset-0 bg-blue-400/30 dark:bg-blue-400/40 rounded-full blur-xl scale-125 animate-pulse" />
            <img
              src="/gojo.png"
              alt="Gojo Satoru App Mascot"
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl object-cover border-4 border-white dark:border-slate-800 shadow-xl relative z-10 mx-auto transition-transform hover:scale-105 animate-mochi-float"
            />
            <span className="absolute -bottom-2 right-1/2 translate-x-8 bg-blue-600 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-full shadow-xs border border-white z-20">
              CLOUD
            </span>
          </div>

          <div>
            <div className="flex items-center justify-center gap-2">
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-[#2E241E] dark:text-white">
                Learning<span className="text-[#3B82F6]"> English</span>
              </h1>
              <span className="text-xs uppercase tracking-wider font-black px-2 py-0.5 rounded-full bg-linear-to-r from-blue-600 to-indigo-600 text-white shadow-xs">
                PRO
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-semibold mt-1 max-w-md mx-auto">
              Hệ thống học từ vựng Anki Spaced Repetition đồng bộ đám mây Supabase
            </p>
          </div>
        </div>

        {/* Big Auth Box */}
        <div className="bg-white/95 dark:bg-slate-900/95 rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200/80 dark:border-slate-800 backdrop-blur-md space-y-5">
          
          {/* Tabs */}
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl">
            <button
              type="button"
              onClick={() => {
                setTab('cloud-login');
                setError('');
              }}
              className={`flex-1 py-2.5 text-xs sm:text-sm font-black rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                tab === 'cloud-login'
                  ? 'bg-white dark:bg-slate-700 shadow-xs text-blue-600 dark:text-blue-400'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <LogIn className="w-4 h-4" />
              <span>Đăng Nhập</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setTab('cloud-register');
                setError('');
              }}
              className={`flex-1 py-2.5 text-xs sm:text-sm font-black rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                tab === 'cloud-register'
                  ? 'bg-white dark:bg-slate-700 shadow-xs text-blue-600 dark:text-blue-400'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span>Tạo Tài Khoản Mới</span>
            </button>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-300 text-xs font-bold rounded-xl animate-shake">
              {error}
            </div>
          )}

          {/* TAB 1: CLOUD LOGIN */}
          {tab === 'cloud-login' && (
            <form onSubmit={handleCloudLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase text-slate-500 dark:text-slate-400 mb-1.5">
                  Email đăng nhập: *
                </label>
                <div className="relative">
                  <Mail className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ban@example.com"
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl text-sm font-medium focus:outline-hidden focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-slate-800 dark:text-slate-100 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-slate-500 dark:text-slate-400 mb-1.5">
                  Mật khẩu: *
                </label>
                <div className="relative">
                  <Lock className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl text-sm font-medium focus:outline-hidden focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-slate-800 dark:text-slate-100 transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-linear-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-black text-sm rounded-2xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Cloud className="w-4 h-4" />}
                <span>Đăng Nhập Đám Mây & Đồng Bộ</span>
              </button>

              <div className="relative my-3 text-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200 dark:border-slate-700" />
                </div>
                <span className="relative px-3 bg-white dark:bg-slate-900 text-slate-400 text-xs font-bold">
                  HOẶC
                </span>
              </div>

              <button
                type="button"
                onClick={handleGoogleLogin}
                className="w-full py-3 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-100 font-black text-xs sm:text-sm rounded-2xl border border-slate-300 dark:border-slate-700 flex items-center justify-center gap-2.5 transition-all cursor-pointer shadow-xs hover:scale-[1.01]"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" viewBox="0 0 24 24">
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
                <span>Đăng Nhập Bằng Google (1-Click)</span>
              </button>
            </form>
          )}

          {/* TAB 2: CLOUD REGISTER */}
          {tab === 'cloud-register' && (
            <form onSubmit={handleCloudRegister} className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase text-slate-500 dark:text-slate-400 mb-1.5">
                  Tên hiển thị / Biệt danh: *
                </label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Ví dụ: Triết, Hoàng, Satoru..."
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl text-sm font-bold focus:outline-hidden focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-slate-800 dark:text-slate-100 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-slate-500 dark:text-slate-400 mb-1.5">
                  Email của bạn: *
                </label>
                <div className="relative">
                  <Mail className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ban@example.com"
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl text-sm font-medium focus:outline-hidden focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-slate-800 dark:text-slate-100 transition-all"
                  />
                </div>
                <p className="mt-1.5 text-[11px] font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                  <span>💡</span>
                  <span>Bạn có thể dùng lại Gmail cũ để tạo thêm nhiều tài khoản học viên mới!</span>
                </p>
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-slate-500 dark:text-slate-400 mb-1.5">
                  Mật khẩu (ít nhất 6 ký tự): *
                </label>
                <div className="relative">
                  <Lock className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl text-sm font-medium focus:outline-hidden focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-slate-800 dark:text-slate-100 transition-all"
                  />
                </div>
              </div>

              {/* Avatar Selection */}
              <div>
                <label className="block text-xs font-black uppercase text-slate-500 dark:text-slate-400 mb-2">
                  Chọn Avatar Nhân Vật Yêu Thích:
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {AVATAR_OPTIONS.map((av) => {
                    const isSelected = selectedAvatar === (av.isImg ? av.src : av.emoji);
                    return (
                      <button
                        key={av.id}
                        type="button"
                        onClick={() => setSelectedAvatar(av.isImg ? av.src! : av.emoji!)}
                        className={`h-14 rounded-2xl border-2 flex items-center justify-center transition-all hover:scale-105 relative cursor-pointer ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40 shadow-xs scale-105'
                            : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700'
                        }`}
                      >
                        {av.isImg ? (
                          <img src={av.src} alt={av.label} className="w-9 h-9 rounded-xl object-cover" />
                        ) : (
                          <span className="text-2xl">{av.emoji}</span>
                        )}
                        {isSelected && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center text-white text-[10px] shadow-xs">
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
                className="w-full py-3.5 bg-linear-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-black text-sm rounded-2xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Cloud className="w-4 h-4" />}
                <span>Tạo Tài Khoản & Lưu Lên Đám Mây</span>
              </button>
            </form>
          )}

        </div>

        {/* Mini Feature Highlights */}
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="p-3 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 backdrop-blur-xs">
            <Brain className="w-5 h-5 text-[#FF6B8B] mx-auto mb-1" />
            <div className="text-[11px] font-black">Anki SRS 5 Cấp</div>
            <div className="text-[9px] text-slate-400">Ghi nhớ dài hạn</div>
          </div>
          <div className="p-3 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 backdrop-blur-xs">
            <Cloud className="w-5 h-5 text-blue-500 mx-auto mb-1" />
            <div className="text-[11px] font-black">Supabase Cloud</div>
            <div className="text-[9px] text-slate-400">Lưu vĩnh viễn</div>
          </div>
          <div className="p-3 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 backdrop-blur-xs">
            <Headphones className="w-5 h-5 text-[#339AF0] mx-auto mb-1" />
            <div className="text-[11px] font-black">AI & Âm Thanh</div>
            <div className="text-[9px] text-slate-400">Giao tiếp thông minh</div>
          </div>
        </div>

      </div>
    </div>
  );
};
