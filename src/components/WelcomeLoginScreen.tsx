import React, { useState } from 'react';
import { UserAccount } from '../types';
import { storage } from '../utils/storage';
import { soundManager } from '../utils/sounds';
import { User, LogIn, UserPlus, Sparkles, Check, ArrowRight, BookOpen, Brain, Headphones } from 'lucide-react';

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
  const [tab, setTab] = useState<'register' | 'login'>('register');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('/gojo.png');
  const [existingUsers, setExistingUsers] = useState<UserAccount[]>(storage.getUsers());
  const [error, setError] = useState('');

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setError('Vui lòng nhập tên của bạn');
      return;
    }

    soundManager.playCorrect();
    const newUser = storage.register(username, selectedAvatar, email);
    onLoginSuccess(newUser);
  };

  const handleSelectUser = (userId: string) => {
    soundManager.playCorrect();
    const logged = storage.login(userId);
    if (logged) {
      onLoginSuccess(logged);
    }
  };

  const handleQuickGuest = () => {
    soundManager.playVictory();
    const guestUser = storage.register('Học Viên Mới', '/gojo.png');
    onLoginSuccess(guestUser);
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 bg-linear-to-b from-[#FFF9E6] via-[#F8F9FE] to-[#EFF2FE] dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-slate-800 dark:text-slate-100 relative overflow-hidden selection:bg-amber-300">
      
      {/* Ambient background glow */}
      <div className="absolute top-0 -left-40 w-96 h-96 bg-purple-400/20 dark:bg-purple-900/30 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute top-1/2 -right-40 w-96 h-96 bg-cyan-400/20 dark:bg-cyan-900/30 rounded-full blur-3xl pointer-events-none animate-pulse [animation-delay:2s]" />
      <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-amber-400/20 dark:bg-amber-900/30 rounded-full blur-3xl pointer-events-none animate-pulse [animation-delay:4s]" />

      <div className="w-full max-w-xl mx-auto space-y-6 relative z-10 animate-scaleUp">
        
        {/* Top Hero Brand & Gojo Mascot */}
        <div className="text-center space-y-3">
          <div className="relative inline-block group">
            <div className="absolute inset-0 bg-cyan-400/30 dark:bg-cyan-400/40 rounded-full blur-xl scale-125 animate-pulse" />
            <img
              src="/gojo.png"
              alt="Gojo Satoru App Mascot"
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl object-cover border-4 border-white dark:border-slate-800 shadow-xl relative z-10 mx-auto transition-transform hover:scale-105 animate-mochi-float"
            />
            <span className="absolute -bottom-2 right-1/2 translate-x-8 bg-amber-400 text-amber-950 text-[10px] font-black uppercase px-2 py-0.5 rounded-full shadow-xs border border-white z-20">
              GOJO AI
            </span>
          </div>

          <div>
            <div className="flex items-center justify-center gap-2">
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-[#2E241E] dark:text-white">
                Learning<span className="text-[#FF708F]"> English</span>
              </h1>
              <span className="text-xs uppercase tracking-wider font-black px-2 py-0.5 rounded-full bg-linear-to-r from-amber-400 to-orange-500 text-white shadow-xs">
                PRO
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-semibold mt-1 max-w-md mx-auto">
              Hệ thống học từ vựng thông minh theo Thời Điểm Vàng Spaced Repetition (Anki + Mochi)
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
                setTab('register');
                setError('');
              }}
              className={`flex-1 py-2.5 text-xs sm:text-sm font-black rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                tab === 'register'
                  ? 'bg-white dark:bg-slate-700 shadow-xs text-amber-600 dark:text-amber-400'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span>Tạo Tài Khoản Mới</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setTab('login');
                setError('');
              }}
              className={`flex-1 py-2.5 text-xs sm:text-sm font-black rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                tab === 'login'
                  ? 'bg-white dark:bg-slate-700 shadow-xs text-amber-600 dark:text-amber-400'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <LogIn className="w-4 h-4" />
              <span>Đăng Nhập ({existingUsers.length})</span>
            </button>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-300 text-xs font-bold rounded-xl animate-shake">
              {error}
            </div>
          )}

          {tab === 'register' ? (
            /* Register Form */
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase text-slate-500 dark:text-slate-400 mb-1.5">
                  Tên của bạn / Biệt danh: *
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Ví dụ: Triết, Gojo Học Bá, Satoru..."
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl text-sm font-bold focus:outline-hidden focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 text-slate-800 dark:text-slate-100 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-slate-500 dark:text-slate-400 mb-1.5">
                  Email (Tùy chọn để lưu tiến độ):
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl text-sm font-medium focus:outline-hidden focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 text-slate-800 dark:text-slate-100 transition-all"
                />
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
                            ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 shadow-xs scale-105'
                            : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700'
                        }`}
                      >
                        {av.isImg ? (
                          <img src={av.src} alt={av.label} className="w-9 h-9 rounded-xl object-cover" />
                        ) : (
                          <span className="text-2xl">{av.emoji}</span>
                        )}
                        {isSelected && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center text-white text-[10px] shadow-xs">
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
                className="w-full py-4 bg-linear-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 text-white font-black text-base rounded-2xl shadow-lg shadow-amber-500/25 transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Bắt Đầu Hành Trình Học Tập</span>
                <ArrowRight className="w-5 h-5" />
              </button>

              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={handleQuickGuest}
                  className="text-xs font-bold text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" /> Bỏ qua và vào nhanh với tư cách Khách
                </button>
              </div>
            </form>
          ) : (
            /* Login Form */
            <div className="space-y-3">
              {existingUsers.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs sm:text-sm space-y-2">
                  <p>Chưa có tài khoản nào được lưu trên thiết bị này.</p>
                  <button
                    onClick={() => setTab('register')}
                    className="inline-block text-amber-600 dark:text-amber-400 font-bold underline cursor-pointer"
                  >
                    Bấm vào đây để tạo tài khoản mới ngay
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                  {existingUsers.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => handleSelectUser(user.id)}
                      className="w-full p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-amber-400 dark:hover:border-amber-500 hover:bg-amber-50/50 dark:hover:bg-slate-800/80 flex items-center justify-between text-left transition-all group cursor-pointer"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-2xl overflow-hidden bg-white dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700 shadow-2xs">
                          {user.avatar.startsWith('/') ? (
                            <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-2xl">{user.avatar}</span>
                          )}
                        </div>
                        <div>
                          <div className="text-sm font-black text-slate-800 dark:text-slate-100 group-hover:text-amber-600 transition-colors">
                            {user.username}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {user.email || `Tạo ngày ${new Date(user.createdAt).toLocaleDateString('vi-VN')}`}
                          </div>
                        </div>
                      </div>
                      <span className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-black shadow-xs transition-transform group-hover:scale-105">
                        Vào Học
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* App Highlight Badges */}
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="p-3 bg-white/70 dark:bg-slate-800/60 rounded-2xl border border-slate-200/60 dark:border-slate-800/80 backdrop-blur-xs">
            <Brain className="w-5 h-5 mx-auto text-amber-500 mb-1" />
            <div className="text-[11px] font-black text-slate-700 dark:text-slate-300">Spaced Repetition</div>
            <div className="text-[10px] text-slate-400">Thời điểm vàng</div>
          </div>
          <div className="p-3 bg-white/70 dark:bg-slate-800/60 rounded-2xl border border-slate-200/60 dark:border-slate-800/80 backdrop-blur-xs">
            <Headphones className="w-5 h-5 mx-auto text-rose-500 mb-1" />
            <div className="text-[11px] font-black text-slate-700 dark:text-slate-300">Video Lofi & Audio</div>
            <div className="text-[10px] text-slate-400">Phát âm chuẩn TTS</div>
          </div>
          <div className="p-3 bg-white/70 dark:bg-slate-800/60 rounded-2xl border border-slate-200/60 dark:border-slate-800/80 backdrop-blur-xs">
            <BookOpen className="w-5 h-5 mx-auto text-cyan-500 mb-1" />
            <div className="text-[11px] font-black text-slate-700 dark:text-slate-300">Nhập Anki .apkg</div>
            <div className="text-[10px] text-slate-400">Đầy đủ hình ảnh</div>
          </div>
        </div>

      </div>
    </div>
  );
};
