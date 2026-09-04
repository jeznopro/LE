import React, { useState } from 'react';
import { UserSettings } from '../types';
import { Video, Volume2, VolumeX, Sliders, X, Sparkles, Check } from 'lucide-react';

export const getYouTubeVideoId = (url?: string): string | null => {
  if (!url) return null;
  const trimmed = url.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|shorts\/|live\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = trimmed.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
};

const PRESETS = [
  {
    name: '🌌 Gojo Satoru Aesthetic',
    url: 'https://www.youtube.com/watch?v=k1BneeJTDcU',
    desc: 'Không gian Jujutsu Kaisen cực chill',
  },
  {
    name: '☕ Lofi Girl Study Beats',
    url: 'https://www.youtube.com/watch?v=jfKfPfyJRdk',
    desc: 'Nhạc lofi học bài kinh điển',
  },
  {
    name: '🌧️ Tokyo Rain & Coffee',
    url: 'https://www.youtube.com/watch?v=lTRiuFIWV54',
    desc: 'Tiếng mưa rơi êm dịu góc phố Nhật',
  },
  {
    name: '🌸 Anime Sakura Lofi',
    url: 'https://www.youtube.com/watch?v=5wRWniH6PoA',
    desc: 'Hoa anh đào rơi thư thái',
  },
];

interface YouTubeBackgroundProps {
  settings: UserSettings;
  onUpdateSettings: (newSettings: UserSettings) => void;
}

export const YouTubeBackground: React.FC<YouTubeBackgroundProps> = ({
  settings,
  onUpdateSettings,
}) => {
  const [isOpenModal, setIsOpenModal] = useState(false);
  const [customInput, setCustomInput] = useState(settings.youtubeBackgroundUrl || '');

  const videoId = getYouTubeVideoId(settings.youtubeBackgroundUrl);
  const isEnabled = Boolean(settings.youtubeBackgroundEnabled && videoId);
  const opacity = settings.youtubeBackgroundOpacity ?? 0.35;
  const isMuted = settings.youtubeBackgroundMuted ?? true;

  const handleToggleEnabled = () => {
    onUpdateSettings({
      ...settings,
      youtubeBackgroundEnabled: !settings.youtubeBackgroundEnabled,
    });
  };

  const handleApplyUrl = (url: string) => {
    const validId = getYouTubeVideoId(url);
    if (validId) {
      onUpdateSettings({
        ...settings,
        youtubeBackgroundUrl: url,
        youtubeBackgroundEnabled: true,
      });
      setCustomInput(url);
    }
  };

  const handleToggleMute = () => {
    onUpdateSettings({
      ...settings,
      youtubeBackgroundMuted: !isMuted,
    });
  };

  const handleOpacityChange = (val: number) => {
    onUpdateSettings({
      ...settings,
      youtubeBackgroundOpacity: val,
    });
  };

  return (
    <>
      {/* 1. Fullscreen Video Background Layer */}
      {isEnabled && videoId && (
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute inset-0 w-full h-full scale-135 sm:scale-125 flex items-center justify-center pointer-events-none">
            <iframe
              title="YouTube Background Wallpaper"
              src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=${
                isMuted ? 1 : 0
              }&controls=0&loop=1&playlist=${videoId}&playsinline=1&enablejsapi=1&origin=${encodeURIComponent(
                typeof window !== 'undefined' && window.location.origin.startsWith('http')
                  ? window.location.origin
                  : 'https://www.youtube.com'
              )}`}
              className="w-screen h-[56.25vw] min-h-screen min-w-[177.77vh] object-cover pointer-events-none border-0"
              referrerPolicy="strict-origin-when-cross-origin"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            />
          </div>

          {/* Dark / Glassmorphism Overlay to keep text crystal-clear readable */}
          <div
            className="absolute inset-0 transition-opacity duration-300 pointer-events-none backdrop-blur-[2px]"
            style={{
              backgroundColor: settings.theme === 'dark' ? '#0f172a' : '#ffffff',
              opacity: opacity,
            }}
          />
        </div>
      )}

      {/* 2. Floating Quick Controls Button (Bottom-Right) */}
      <div className="fixed bottom-5 right-5 z-40 flex items-center gap-2 select-none">
        {isEnabled && (
          <>
            <button
              onClick={handleToggleMute}
              title={isMuted ? 'Bật âm thanh video' : 'Tắt âm thanh video'}
              className="p-3 bg-white/90 dark:bg-slate-800/90 hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-2xl shadow-lg border border-slate-200/80 dark:border-slate-700 backdrop-blur-md transition-all hover:scale-105 active:scale-95"
            >
              {isMuted ? <VolumeX className="w-5 h-5 text-rose-500" /> : <Volume2 className="w-5 h-5 text-emerald-500 animate-pulse" />}
            </button>
            <button
              onClick={handleToggleEnabled}
              title="Tắt video hình nền (khôi phục giao diện gốc)"
              className="p-3 bg-white/90 dark:bg-slate-800/90 hover:bg-rose-50 dark:hover:bg-rose-950/50 text-rose-500 rounded-2xl shadow-lg border border-rose-200 dark:border-rose-900/50 backdrop-blur-md transition-all hover:scale-105 active:scale-95"
            >
              <X className="w-5 h-5" />
            </button>
          </>
        )}

        <button
          onClick={() => setIsOpenModal(true)}
          className={`flex items-center gap-2 px-4 py-3 rounded-2xl shadow-lg border backdrop-blur-md font-bold text-xs sm:text-sm transition-all hover:scale-105 active:scale-95 ${
            isEnabled
              ? 'bg-linear-to-r from-red-500 to-rose-600 text-white border-rose-400'
              : 'bg-white/90 dark:bg-slate-800/90 text-slate-700 dark:text-slate-200 border-slate-200/80 dark:border-slate-700 hover:bg-white'
          }`}
          title="Tùy chỉnh hình nền video YouTube"
        >
          <Video className={`w-4 h-4 ${isEnabled ? 'animate-pulse' : ''}`} />
          <span className="hidden sm:inline">{isEnabled ? 'Đổi Nền Video' : 'Nền YouTube'}</span>
        </button>
      </div>

      {/* 3. Wallpaper Settings Modal */}
      {isOpenModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
          onClick={() => setIsOpenModal(false)}
        >
          <div
            className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-lg p-6 sm:p-7 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-5 animate-scaleUp text-slate-800 dark:text-slate-100 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-300 rounded-2xl">
                  <Video className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black">Hình Nền Video YouTube</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                    Học tập thư thái cùng video chill & lofi yêu thích
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpenModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Toggle Enable Switch */}
            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-2xl border border-slate-200/80 dark:border-slate-600">
              <div>
                <div className="font-extrabold text-sm">Bật hình nền YouTube</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Phát video mượt mà ở chế độ lặp vô tận phía sau
                </div>
              </div>
              <button
                onClick={handleToggleEnabled}
                className={`w-14 h-8 rounded-full transition-colors relative flex items-center p-1 ${
                  isEnabled ? 'bg-rose-500' : 'bg-slate-300 dark:bg-slate-600'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full bg-white shadow-md transition-transform duration-300 transform ${
                    isEnabled ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Custom URL Input */}
            <div className="space-y-2">
              <label className="text-xs font-black uppercase text-slate-500 tracking-wider">
                Dán link YouTube bất kỳ:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="flex-1 px-4 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl text-sm font-semibold focus:outline-hidden focus:border-rose-500"
                />
                <button
                  onClick={() => handleApplyUrl(customInput)}
                  className="px-4 py-2.5 bg-rose-500 hover:bg-rose-600 text-white font-black text-xs rounded-xl shadow-md transition-transform active:scale-95"
                >
                  Áp Dụng
                </button>
              </div>
            </div>

            {/* Quick Presets */}
            <div className="space-y-2">
              <label className="text-xs font-black uppercase text-slate-500 tracking-wider flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Gợi ý hình nền chill có sẵn:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {PRESETS.map((preset) => {
                  const isSelected = settings.youtubeBackgroundUrl === preset.url && isEnabled;
                  return (
                    <button
                      key={preset.name}
                      onClick={() => handleApplyUrl(preset.url)}
                      className={`p-3 rounded-2xl border text-left transition-all hover:scale-[1.02] flex items-center justify-between ${
                        isSelected
                          ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-400 text-rose-800 dark:text-rose-200 font-bold'
                          : 'bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600 hover:bg-slate-100 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div>
                        <div className="text-xs font-extrabold">{preset.name}</div>
                        <div className="text-[10px] text-slate-400 dark:text-slate-400 mt-0.5">{preset.desc}</div>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-rose-500 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Opacity Adjustment Slider */}
            {isEnabled && (
              <div className="space-y-2 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-2xl border border-slate-200/80 dark:border-slate-600">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="flex items-center gap-1.5">
                    <Sliders className="w-4 h-4 text-slate-500" />
                    Độ mờ phủ chữ (Dễ đọc):
                  </span>
                  <span className="text-rose-500 font-extrabold">{Math.round(opacity * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="0.85"
                  step="0.05"
                  value={opacity}
                  onChange={(e) => handleOpacityChange(parseFloat(e.target.value))}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-600 rounded-lg appearance-none cursor-pointer accent-rose-500"
                />
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>Nhìn rõ video (10%)</span>
                  <span>Rõ chữ thẻ học (85%)</span>
                </div>
              </div>
            )}

            {/* Reset / Disable Video Button */}
            {isEnabled && (
              <button
                type="button"
                onClick={() => {
                  onUpdateSettings({ ...settings, youtubeBackgroundEnabled: false });
                  setIsOpenModal(false);
                }}
                className="w-full py-2.5 bg-slate-100 hover:bg-rose-50 dark:bg-slate-700/60 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-300 font-bold text-xs rounded-2xl border border-rose-200/80 dark:border-rose-900/50 transition-colors flex items-center justify-center gap-1.5"
              >
                <X className="w-4 h-4" /> Tắt Nền Video (Dùng Nền Mặc Định Của Ứng Dụng)
              </button>
            )}

            {/* Done Button */}
            <button
              onClick={() => setIsOpenModal(false)}
              className="w-full py-3 bg-linear-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white font-black text-sm rounded-2xl shadow-md transition-all active:scale-95"
            >
              Hoàn Tất & Bắt Đầu Học 🎧
            </button>
          </div>
        </div>
      )}
    </>
  );
};
