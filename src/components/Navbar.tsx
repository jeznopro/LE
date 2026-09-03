import React from 'react';
import { UserStats, UserSettings, UserAccount } from '../types';
import { Flame, Sparkles, BarChart2, Settings, Volume2, VolumeX, UploadCloud, Moon, Sun, User, MessageSquare } from 'lucide-react';

interface NavbarProps {
  stats: UserStats;
  settings: UserSettings;
  currentUser: UserAccount | null;
  onOpenAuth: () => void;
  onOpenAIChat: () => void;
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
  onOpenStats,
  onOpenSettings,
  onToggleSound,
  onToggleTheme,
  onOpenImporter,
  onOpenNewDeck: _onOpenNewDeck,
  onGoHome,
  currentView: _currentView,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-[#F0EDF5] dark:border-slate-800 shadow-xs px-4 sm:px-8 py-3 transition-colors duration-300">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-2">
        {/* Brand Logo */}
        <div
          onClick={onGoHome}
          className="flex items-center gap-2.5 cursor-pointer group select-none"
        >
          <img 
            src="/gojo.png" 
            alt="Gojo Satoru Icon" 
            className="w-10 h-10 rounded-2xl object-cover shadow-xs group-hover:scale-105 transition-transform border border-amber-200" 
          />
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-xl tracking-tight text-[#3A2D28] group-hover:text-[#F5A623] transition-colors">
                Learning<span className="text-[#FF708F]"> English</span>
              </span>
              <span className="text-[10px] uppercase tracking-wider font-black px-1.5 py-0.5 rounded-full bg-[#FFF0F5] text-[#FF4D80] border border-[#FFD0DE]">
                PRO
              </span>
            </div>
            <p className="text-[11px] font-semibold text-[#8C827A] hidden sm:block">
              Học từ vựng thông minh theo Thời điểm vàng
            </p>
          </div>
        </div>

        {/* Gamification Stats */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Gemini AI Conversation Button */}
          <button
            onClick={onOpenAIChat}
            title="Trò chuyện và luyện tiếng Anh cùng Google Gemini AI"
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-linear-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-black text-xs rounded-full shadow-sm transition-all hover:scale-105 active:scale-95 cursor-pointer ring-2 ring-blue-400/40"
          >
            <Sparkles className="w-3.5 h-3.5 fill-blue-200" />
            <span>💎 Chat Gemini AI</span>
          </button>

          {/* Streak */}
          <div
            onClick={onOpenStats}
            title="Chuỗi ngày học liên tiếp"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FFF4E5] hover:bg-[#FFE8CC] border border-[#FFD8A8] rounded-full cursor-pointer transition-all hover:scale-105 shadow-xs"
          >
            <Flame className="w-4 h-4 text-[#F76707] fill-[#FFA94D] animate-mochi-pulse" />
            <span className="font-black text-sm text-[#D9480F]">
              {stats.streak} <span className="text-xs font-bold text-[#E8590C] hidden sm:inline">ngày</span>
            </span>
          </div>

          {/* XP */}
          <div
            onClick={onOpenStats}
            title="Tổng điểm kinh nghiệm XP"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FFF9DB] hover:bg-[#FFF3BF] border border-[#FFE066] rounded-full cursor-pointer transition-all hover:scale-105 shadow-xs"
          >
            <Sparkles className="w-4 h-4 text-[#F59F00] fill-[#FFD43B]" />
            <span className="font-black text-sm text-[#E67700]">
              {stats.xp} <span className="text-xs font-bold text-[#F59F00] hidden sm:inline">XP</span>
            </span>
          </div>

          {/* Action Quick Buttons */}
          <div className="flex items-center gap-1.5 pl-1 border-l border-slate-200">
            {/* Audio Toggle */}
            <button
              onClick={onToggleSound}
              title={settings.soundEffects ? 'Tắt âm thanh hiệu ứng' : 'Bật âm thanh hiệu ứng'}
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
            >
              {settings.soundEffects ? (
                <Volume2 className="w-5 h-5 text-[#51CF66]" />
              ) : (
                <VolumeX className="w-5 h-5 text-slate-400" />
              )}
            </button>

            {/* Theme Toggle */}
            <button
              onClick={onToggleTheme}
              title={settings.theme === 'dark' ? 'Chuyển sang nền sáng' : 'Chuyển sang nền tối'}
              className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-amber-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              {settings.theme === 'dark' ? (
                <Sun className="w-5 h-5 text-amber-400" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </button>

            {/* Stats */}
            <button
              onClick={onOpenStats}
              title="Xem thống kê trí nhớ & tiến độ"
              className="p-2 text-slate-600 hover:text-[#4C6EF5] hover:bg-[#EDF2FF] rounded-xl transition-colors"
            >
              <BarChart2 className="w-5 h-5" />
            </button>

            {/* Settings */}
            <button
              onClick={onOpenSettings}
              title="Cài đặt giọng đọc & học tập"
              className="p-2 text-slate-600 dark:text-slate-400 hover:text-[#AE3EC9] hover:bg-[#F8F0FC] dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              <Settings className="w-5 h-5" />
            </button>

            {/* User Profile / Login Button */}
            <button
              onClick={onOpenAuth}
              title={currentUser ? `Hồ sơ: ${currentUser.username}` : 'Đăng nhập / Tạo tài khoản'}
              className="flex items-center gap-1.5 p-1 sm:px-2.5 sm:py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-all border border-slate-200 dark:border-slate-700"
            >
              {currentUser ? (
                <>
                  <div className="w-6 h-6 rounded-lg overflow-hidden flex items-center justify-center bg-white shadow-2xs">
                    {currentUser.avatar.startsWith('/') ? (
                      <img src={currentUser.avatar} alt="avatar" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-sm">{currentUser.avatar}</span>
                    )}
                  </div>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200 hidden lg:inline max-w-[90px] truncate">
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
              className="hidden md:flex items-center gap-1.5 px-3.5 py-1.5 bg-linear-to-r from-[#FF6B8B] to-[#FF8E53] hover:from-[#FF5277] hover:to-[#FF7A3D] text-white font-bold text-xs sm:text-sm rounded-xl shadow-md hover:shadow-lg transition-all hover:scale-105 active:scale-95"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Nhập Anki Deck</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
