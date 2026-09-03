import React from 'react';
import { UserSettings } from '../types';
import { ttsService } from '../utils/tts';
import { soundManager } from '../utils/sounds';
import { X, RotateCcw } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  onSaveSettings: (newSettings: UserSettings) => void;
  onResetData: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  onResetData,
}) => {
  if (!isOpen) return null;

  const accents = ttsService.getAvailableAccents();

  const handleTestAccent = (accent: 'en-US' | 'en-GB' | 'en-AU') => {
    soundManager.playClick();
    ttsService.speak('Hello! Welcome to Mochi Anki vocabulary learning!', accent, settings.ttsSpeed);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-[#E9E4F0] shadow-2xl p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black text-[#2E241E]">
            Cài Đặt Ứng Dụng
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-5">
          {/* TTS Accent */}
          <div>
            <label className="block text-xs font-black uppercase text-slate-500 mb-2">
              Giọng Đọc Phát Âm (TTS)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {accents.map((acc) => {
                const isSelected = settings.ttsAccent === acc.value;
                return (
                  <button
                    key={acc.value}
                    type="button"
                    onClick={() => {
                      onSaveSettings({ ...settings, ttsAccent: acc.value });
                      handleTestAccent(acc.value);
                    }}
                    className={`p-3 rounded-2xl border-2 text-xs font-black transition-all flex flex-col items-center gap-1 ${
                      isSelected
                        ? 'bg-amber-50 border-amber-400 text-amber-900 shadow-2xs'
                        : 'bg-white dark:bg-slate-800 border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span>{acc.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* TTS Speed */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-black uppercase text-slate-500">
                Tốc Độ Phát Âm
              </label>
              <span className="text-xs font-black text-amber-600">
                {settings.ttsSpeed}x
              </span>
            </div>
            <input
              type="range"
              min="0.6"
              max="1.2"
              step="0.1"
              value={settings.ttsSpeed}
              onChange={(e) =>
                onSaveSettings({ ...settings, ttsSpeed: parseFloat(e.target.value) })
              }
              className="w-full accent-amber-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] font-bold text-slate-400 mt-1">
              <span>Chậm (0.6x)</span>
              <span>Bình thường (0.9x)</span>
              <span>Nhanh (1.2x)</span>
            </div>
          </div>

          {/* Sound & Auto Play Toggles */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <label className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200 cursor-pointer">
              <span className="text-xs font-bold text-slate-700">
                Tự động phát âm thanh khi lật thẻ
              </span>
              <input
                type="checkbox"
                checked={settings.autoPlayAudio}
                onChange={(e) =>
                  onSaveSettings({ ...settings, autoPlayAudio: e.target.checked })
                }
                className="w-5 h-5 accent-amber-500 rounded-md cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200 cursor-pointer">
              <span className="text-xs font-bold text-slate-700">
                Hiệu ứng âm thanh vui nhộn (Mochi Sound FX)
              </span>
              <input
                type="checkbox"
                checked={settings.soundEffects}
                onChange={(e) => {
                  soundManager.setEnabled(e.target.checked);
                  onSaveSettings({ ...settings, soundEffects: e.target.checked });
                }}
                className="w-5 h-5 accent-amber-500 rounded-md cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 cursor-pointer">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                Hiệu ứng nền động (Animated Ambient Glow)
              </span>
              <input
                type="checkbox"
                checked={settings.animatedBackground}
                onChange={(e) =>
                  onSaveSettings({ ...settings, animatedBackground: e.target.checked })
                }
                className="w-5 h-5 accent-amber-500 rounded-md cursor-pointer"
              />
            </label>

            {/* YouTube Video Background in Settings */}
            <div className="p-3.5 rounded-2xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/50 space-y-2.5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-extrabold text-rose-900 dark:text-rose-200">
                    🎥 Hình nền Video YouTube
                  </div>
                  <div className="text-[11px] text-rose-700/80 dark:text-rose-300/80">
                    Phát video lofi / anime chill trong lúc học
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.youtubeBackgroundEnabled}
                  onChange={(e) =>
                    onSaveSettings({ ...settings, youtubeBackgroundEnabled: e.target.checked })
                  }
                  className="w-5 h-5 accent-rose-500 rounded-md cursor-pointer"
                />
              </div>

              {settings.youtubeBackgroundEnabled && (
                <div className="pt-2 border-t border-rose-200/60 dark:border-rose-800/40 space-y-2">
                  <input
                    type="text"
                    value={settings.youtubeBackgroundUrl || ''}
                    onChange={(e) =>
                      onSaveSettings({ ...settings, youtubeBackgroundUrl: e.target.value })
                    }
                    placeholder="Dán link YouTube (https://www.youtube.com/watch?v=...)"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-rose-300 dark:border-slate-600 rounded-xl text-xs font-medium focus:outline-hidden focus:border-rose-500"
                  />
                  <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-300">
                    <span>Âm thanh video lofi:</span>
                    <button
                      type="button"
                      onClick={() =>
                        onSaveSettings({ ...settings, youtubeBackgroundMuted: !settings.youtubeBackgroundMuted })
                      }
                      className="px-2.5 py-1 bg-white dark:bg-slate-700 border rounded-lg text-xs font-bold"
                    >
                      {settings.youtubeBackgroundMuted ? '🔇 Đang tắt tiếng' : '🔊 Đang bật tiếng'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Google Gemini AI API Key Integration */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-slate-700/60 dark:to-slate-700/60 border border-amber-300/80 dark:border-amber-600/50 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🤖</span>
                  <div>
                    <h3 className="text-xs font-black text-amber-950 dark:text-amber-200">
                      Tích Hợp Trí Tuệ Nhân Tạo Google Gemini (Miễn Phí)
                    </h3>
                    <p className="text-[11px] text-amber-800/80 dark:text-amber-300/80">
                      Kích hoạt mô hình Gemini 2.0 Flash để Giám khảo Gojo trò chuyện như người thật
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-200 mb-1">
                  Gemini API Key:
                </label>
                <input
                  type="password"
                  value={settings.geminiApiKey || ''}
                  onChange={(e) =>
                    onSaveSettings({ ...settings, geminiApiKey: e.target.value.trim() })
                  }
                  placeholder="Dán mã API Key dạng AIzaSy... vào đây"
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-amber-300/70 dark:border-slate-600 rounded-xl text-xs font-mono font-semibold focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <a
                  href="https://aistudio.google.com/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] font-bold text-amber-700 dark:text-amber-300 hover:underline flex items-center gap-1"
                >
                  <span>👉 Lấy API Key miễn phí (Google AI Studio) ↗</span>
                </a>
                {settings.geminiApiKey?.trim() ? (
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 rounded-lg text-[10px] font-black">
                    ✓ Đã Kích Hoạt Real AI
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-400">
                    Đang dùng AI mô phỏng
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Reset button */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <button
              onClick={() => {
                if (window.confirm('Bạn có chắc muốn khôi phục dữ liệu ban đầu? Tiến độ học sẽ được làm mới.')) {
                  onResetData();
                  onClose();
                }
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-bold transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Khôi phục dữ liệu mẫu</span>
            </button>

            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-slate-900 hover:bg-black text-white font-black text-xs rounded-2xl shadow-xs"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
