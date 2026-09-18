import React from 'react';
import { UserStats, UserSettings, UserAccount } from '../types';
import { Flame, Sparkles, BarChart2, Settings, Volume2, VolumeX, UploadCloud, Moon, Sun, User, Lock, Cloud, CloudOff, Check } from 'lucide-react';

interface NavbarProps {
  stats: UserStats;
  settings: UserSettings;
  currentUser: UserAccount | null;
  cloudStatus?: 'synced' | 'syncing' | 'offline';
  onOpenAuth: () => void;
  onOpenStats: () => void;
  onOpenSettings: () => void;
  onToggleSound: () => void;
  onToggleTheme: () => void;
  onOpenImporter: () => void;
  onOpenNewDeck: () => void;
  onLockApp?: () => void;
  onGoHome: () => void;
  currentView: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  stats,
  settings,
  currentUser,
  cloudStatus = 'synced',
  onOpenAuth,
  onOpenStats,
  onOpenSettings,
  onToggleSound,
  onToggleTheme,
  onOpenImporter,
  onOpenNewDeck: _onOpenNewDeck,
  onLockApp,
  onGoHome,
  currentView: _currentView,
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
              src="./we_bare_bears_avatar.png" 
              alt="We Bare Bears Icon" 
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

            {/* Real-time Cloud Sync Status Indicator */}
            <div
              title={
                cloudStatus === 'syncing'
                  ? 'Đang đồng bộ dữ liệu với đám mây Supabase...'
                  : cloudStatus === 'synced'
                  ? 'Đã đồng bộ tự động thời gian thực (Supabase Cloud Live)'
                  : 'Chế độ Offline (Dữ liệu đã lưu an toàn trên máy)'
              }
              className="liquid-glass-subtle hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border border-white/60 dark:border-white/10 select-none"
            >
              {cloudStatus === 'syncing' ? (
                <>
                  <div className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                  <span className="text-amber-600 dark:text-amber-400">Đang lưu...</span>
                </>
              ) : cloudStatus === 'synced' ? (
                <>
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-emerald-700 dark:text-emerald-300 font-black">Cloud Live</span>
                </>
              ) : (
                <>
                  <div className="w-2 h-2 rounded-full bg-slate-400" />
                  <span className="text-slate-500">Offline</span>
                </>
              )}
            </div>

            {/* Lock App Button (PIN 1727) */}
            {onLockApp && (
              <button
                onClick={onLockApp}
                title="Khóa ứng dụng (Yêu cầu mã PIN 1727 để mở lại)"
                className="p-1.5 text-slate-500 hover:text-rose-500 dark:text-slate-400 dark:hover:text-rose-400 hover:bg-rose-500/10 rounded-full transition-colors cursor-pointer"
              >
                <Lock className="w-4 h-4" />
              </button>
            )}

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
