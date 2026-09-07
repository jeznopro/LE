import React from 'react';
import { UserStats, UserSettings, UserAccount } from '../types';
import { Flame, Sparkles, BarChart2, Settings, Volume2, VolumeX, UploadCloud, Moon, Sun, User, Mic } from 'lucide-react';

interface NavbarProps {
  stats: UserStats;
  settings: UserSettings;
  currentUser: UserAccount | null;
  onOpenAuth: () => void;
  onOpenAIChat: () => void;
  onOpenSpeaking: () => void;
  onOpenStats: () => void;
  onOpenSettings: () => void;
  onToggleSound: () => void;
  onToggleTheme: () => void;
  onOpenImporter: () => void;
  onOpenNewDeck: () => void;
  onGoHome: () => void;
  currentView: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  stats,
  settings,
  currentUser,
  onOpenAuth,
  onOpenAIChat,
  onOpenSpeaking,
  onOpenStats,
  onOpenSettings,
  onToggleSound,
  onToggleTheme,
  onOpenImporter,
  onOpenNewDeck: _onOpenNewDeck,
  onGoHome,
  currentView,
}) => {
  return (
    <header className="sticky top-2 sm:top-3 z-30 max-w-6xl w-[96%] sm:w-full mx-auto px-2 sm:px-4 transition-all duration-300">
      <div className="liquid-glass rounded-2xl sm:rounded-full px-3 sm:px-6 py-2 sm:py-2.5 flex items-center justify-between gap-2 shadow-xl border border-white/80 dark:border-white/12 transition-all">
        {/* Brand Logo */}
        <div
          onClick={onGoHome}
          className="flex items-center gap-2.5 cursor-pointer group select-none py-0.5 px-1 rounded-2xl hover:bg-white/30 dark:hover:bg-white/5 transition-all"
        >
          <div className="relative">
            <img 
              src="./gojo.png" 
              alt="Gojo Satoru Icon" 
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl object-cover shadow-sm group-hover:scale-105 transition-transform border border-white/80 dark:border-amber-400/30" 
            />
            <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-400 border-2 border-white dark:border-slate-900 rounded-full animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-base sm:text-lg tracking-tight text-slate-900 dark:text-slate-100 group-hover:text-amber-500 transition-colors">
                Learning<span className="text-[#FF708F]"> English</span>
              </span>
              <span className="text-[9px] uppercase tracking-wider font-black px-1.5 py-0.2 rounded-full bg-white/70 dark:bg-white/10 text-rose-500 border border-rose-200/60 dark:border-rose-500/30 shadow-2xs">
                PRO
              </span>
            </div>
            <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 hidden md:block">
              Học từ vựng thông minh theo Thời điểm vàng
            </p>
          </div>
        </div>

        {/* Gamification Stats & Quick Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          {/* Speaking Part 1, 2, 3 Button */}
          <button
            onClick={onOpenSpeaking}
            title="Luyện nói phản xạ IELTS Speaking Part 1, Part 2, Part 3"
            className={`liquid-glass-pill flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-full font-black text-xs cursor-pointer border ${
              currentView === 'roadmap'
                ? 'bg-gradient-to-r from-rose-500 via-amber-500 to-orange-500 text-white border-white/80 shadow-md shadow-rose-500/25 ring-2 ring-rose-400/50'
                : 'bg-gradient-to-r from-rose-500/85 to-amber-500/85 hover:from-rose-600 hover:to-amber-600 text-white border-white/50'
            }`}
          >
            <Mic className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">🎙️ Luyện Nói Part 1, 2, 3</span>
            <span className="sm:hidden">🎙️ Nói</span>
          </button>

          {/* Gemini AI Conversation Button */}
          <button
            onClick={onOpenAIChat}
            title="Trò chuyện và luyện tiếng Anh cùng Google Gemini AI"
            className={`liquid-glass-pill flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-full font-black text-xs cursor-pointer border ${
              currentView === 'ai-chat'
                ? 'bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-700 text-white border-white/80 shadow-md shadow-indigo-500/30 ring-2 ring-purple-400/50'
                : 'bg-gradient-to-r from-blue-600/85 via-indigo-600/85 to-purple-600/85 hover:from-blue-700 hover:to-purple-700 text-white border-white/50'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 fill-blue-200" />
            <span className="hidden sm:inline">💎 Chat Gemini AI</span>
            <span className="sm:hidden">💎 AI</span>
          </button>

          {/* Streak Badge */}
          <div
            onClick={onOpenStats}
            title="Chuỗi ngày học liên tiếp"
            className="liquid-glass-subtle flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full cursor-pointer transition-all hover:scale-105 border border-amber-300/60 dark:border-amber-500/30"
          >
            <Flame className="w-4 h-4 text-orange-500 fill-amber-400 animate-mochi-pulse" />
            <span className="font-black text-xs sm:text-sm text-orange-600 dark:text-orange-400">
              {stats.streak} <span className="text-[11px] font-bold hidden md:inline">ngày</span>
            </span>
          </div>

          {/* XP Badge */}
          <div
            onClick={onOpenStats}
            title="Tổng điểm kinh nghiệm XP"
            className="liquid-glass-subtle flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full cursor-pointer transition-all hover:scale-105 border border-yellow-300/60 dark:border-yellow-500/30"
          >
            <Sparkles className="w-4 h-4 text-amber-500 fill-yellow-400" />
            <span className="font-black text-xs sm:text-sm text-amber-600 dark:text-amber-400">
              {stats.xp} <span className="text-[11px] font-bold hidden md:inline">XP</span>
            </span>
          </div>

          {/* Action Quick Buttons */}
          <div className="flex items-center gap-1 pl-1 border-l border-white/60 dark:border-white/10">
            {/* Audio Toggle */}
            <button
              onClick={onToggleSound}
              title={settings.soundEffects ? 'Tắt âm thanh hiệu ứng' : 'Bật âm thanh hiệu ứng'}
              className="p-1.5 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-white/40 dark:hover:bg-white/10 rounded-full transition-colors cursor-pointer"
            >
              {settings.soundEffects ? (
                <Volume2 className="w-4 h-4 text-emerald-500" />
              ) : (
                <VolumeX className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {/* Theme Toggle */}
            <button
              onClick={onToggleTheme}
              title={settings.theme === 'dark' ? 'Chuyển sang nền sáng' : 'Chuyển sang nền tối'}
              className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-amber-500 dark:hover:text-amber-300 hover:bg-white/40 dark:hover:bg-white/10 rounded-full transition-colors cursor-pointer"
            >
              {settings.theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </button>

            {/* Stats */}
            <button
              onClick={onOpenStats}
              title="Xem thống kê trí nhớ & tiến độ"
              className="p-1.5 text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white/40 dark:hover:bg-white/10 rounded-full transition-colors cursor-pointer hidden sm:flex"
            >
              <BarChart2 className="w-4 h-4" />
            </button>

            {/* Settings */}
            <button
              onClick={onOpenSettings}
              title="Cài đặt giọng đọc & học tập"
              className="p-1.5 text-slate-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-white/40 dark:hover:bg-white/10 rounded-full transition-colors cursor-pointer hidden sm:flex"
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* User Profile / Login Button */}
            <button
              onClick={onOpenAuth}
              title={currentUser ? `Hồ sơ: ${currentUser.username}` : 'Đăng nhập / Tạo tài khoản'}
              className="liquid-glass-subtle flex items-center gap-1.5 p-1 sm:px-2.5 sm:py-1 rounded-full cursor-pointer hover:scale-105 transition-all border border-white/60 dark:border-white/10"
            >
              {currentUser ? (
                <>
                  <div className="w-6 h-6 rounded-full overflow-hidden flex items-center justify-center bg-white/80 dark:bg-slate-800 shadow-xs border border-white/50">
                    {currentUser.avatar && (currentUser.avatar.startsWith('http') || currentUser.avatar.startsWith('data:')) ? (
                      <img src={currentUser.avatar} alt="avatar" className="w-full h-full object-cover" />
                    ) : currentUser.avatar && (currentUser.avatar.includes('.png') || currentUser.avatar.includes('.jpg') || currentUser.avatar.includes('.jpeg')) ? (
                      <img
                        src={currentUser.avatar.startsWith('/') ? '.' + currentUser.avatar : currentUser.avatar}
                        alt="avatar"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <span className="text-xs">{currentUser.avatar || '👤'}</span>
                    )}
                  </div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-100 hidden lg:inline max-w-[85px] truncate">
                    {currentUser.username}
                  </span>
                </>
              ) : (
                <div className="flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-400 px-1">
                  <User className="w-4 h-4" />
                  <span className="hidden sm:inline">Tài khoản</span>
                </div>
              )}
            </button>

            {/* Import Anki / CSV Deck Button */}
            <button
              onClick={onOpenImporter}
              className="liquid-glass-pill hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-[#FF6B8B] to-[#FF8E53] hover:from-[#FF5277] hover:to-[#FF7A3D] text-white font-bold text-xs rounded-full shadow-sm cursor-pointer border border-white/40"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>Nhập Deck</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
