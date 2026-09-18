import React, { useState, useEffect, useRef } from 'react';
import { soundManager } from '../utils/sounds';
import { Lock, ShieldCheck, Delete } from 'lucide-react';

const MASTER_PIN = '1727';
export const PIN_STORAGE_KEY = 'bears_master_unlocked_device';

interface MasterPinLockScreenProps {
  onUnlockSuccess: () => void;
}

export const MasterPinLockScreen: React.FC<MasterPinLockScreenProps> = ({ onUnlockSuccess }) => {
  const [pin, setPin] = useState('');
  const [isShaking, setIsShaking] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [rememberDevice, setRememberDevice] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);
  const inputContainerRef = useRef<HTMLDivElement>(null);

  // Focus and listen to global keyboard
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isSuccess) return;

      if (/^[0-9]$/.test(e.key)) {
        e.preventDefault();
        handleAddDigit(e.key);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleDeleteDigit();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setPin('');
        setErrorMessage('');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pin, isSuccess, rememberDevice]);

  // Handle adding digit
  const handleAddDigit = (digit: string) => {
    if (pin.length >= 4) return;
    soundManager.playClick();
    const nextPin = pin + digit;
    setPin(nextPin);
    setErrorMessage('');

    if (nextPin.length === 4) {
      verifyPin(nextPin);
    }
  };

  // Handle delete digit
  const handleDeleteDigit = () => {
    if (pin.length === 0) return;
    soundManager.playClick();
    setPin((prev) => prev.slice(0, -1));
    setErrorMessage('');
  };

  // Verify PIN
  const verifyPin = (entered: string) => {
    if (entered === MASTER_PIN) {
      soundManager.playVictory();
      setIsSuccess(true);
      if (rememberDevice) {
        localStorage.setItem(PIN_STORAGE_KEY, JSON.stringify({ unlocked: true, timestamp: Date.now() }));
      } else {
        sessionStorage.setItem(PIN_STORAGE_KEY, JSON.stringify({ unlocked: true, timestamp: Date.now() }));
      }
      setTimeout(() => {
        onUnlockSuccess();
      }, 600);
    } else {
      soundManager.playWrong();
      setIsShaking(true);
      setErrorMessage('Mã PIN không chính xác! Ứng dụng này chỉ dành cho chủ sở hữu.');
      setTimeout(() => {
        setIsShaking(false);
        setPin('');
      }, 600);
    }
  };

  return (
    <div className="min-h-screen bg-animated-gradient flex flex-col items-center justify-center p-4 sm:p-6 select-none relative overflow-hidden">
      {/* Ambient glow backgrounds */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-amber-400/20 dark:bg-amber-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-purple-500/20 dark:bg-purple-900/20 rounded-full blur-3xl pointer-events-none" />

      <div
        ref={inputContainerRef}
        className={`liquid-glass-modal max-w-md w-full p-6 sm:p-8 rounded-3xl shadow-2xl border border-white/80 dark:border-white/10 text-center relative z-10 transition-all duration-300 ${
          isShaking ? 'animate-shake' : 'animate-fadeIn'
        }`}
      >
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-6">
          <div className="relative mb-3">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl overflow-hidden border-2 border-amber-300 dark:border-amber-500/40 shadow-xl bg-linear-to-tr from-amber-400 to-orange-500 flex items-center justify-center p-1 animate-mochi-float">
              <img
                src="./we_bare_bears_avatar.png"
                alt="We Bare Bears"
                className="w-full h-full object-cover rounded-2xl"
              />
            </div>
            <div className="absolute -bottom-1.5 -right-1.5 p-1.5 bg-emerald-500 text-white rounded-full shadow-md border-2 border-white dark:border-slate-900">
              <Lock className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-300/40 text-[11px] font-black mb-1.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>KHO DỮ LIỆU RIÊNG TƯ CHỦ SỞ HỮU</span>
          </div>

          <h1 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-white tracking-tight">
            We Bare Bears <span className="text-[#FF708F]">Anki</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-1">
            Vui lòng nhập mã PIN bảo mật để mở khóa học tập & sao lưu
          </p>
        </div>

        {/* 4 PIN Dots Indicator */}
        <div className="flex items-center justify-center gap-4 my-6">
          {[0, 1, 2, 3].map((index) => {
            const isFilled = pin.length > index;
            return (
              <div
                key={index}
                className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full transition-all duration-300 border-2 ${
                  isSuccess
                    ? 'bg-emerald-500 border-emerald-400 scale-110 shadow-lg shadow-emerald-500/50'
                    : isFilled
                    ? 'bg-amber-500 border-amber-400 scale-110 shadow-md shadow-amber-500/40'
                    : 'bg-white/40 dark:bg-slate-700/60 border-slate-300 dark:border-slate-600'
                }`}
              />
            );
          })}
        </div>

        {/* Error Feedback */}
        {errorMessage && (
          <div className="mb-4 text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-500/10 border border-rose-500/20 py-2 px-3 rounded-2xl animate-shake">
            {errorMessage}
          </div>
        )}

        {/* Numeric Keypad */}
        <div className="grid grid-cols-3 gap-2.5 max-w-xs mx-auto mb-5">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleAddDigit(digit)}
              className="liquid-glass-subtle py-3 sm:py-3.5 rounded-2xl font-black text-lg sm:text-xl text-slate-800 dark:text-white hover:bg-white dark:hover:bg-slate-700 hover:scale-105 active:scale-95 transition-all shadow-xs cursor-pointer border border-white/60 dark:border-white/10"
            >
              {digit}
            </button>
          ))}
          <button
            type="button"
            onClick={() => {
              soundManager.playClick();
              setPin('');
              setErrorMessage('');
            }}
            title="Xóa tất cả"
            className="liquid-glass-subtle py-3 sm:py-3.5 rounded-2xl font-bold text-xs text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700 hover:scale-105 active:scale-95 transition-all cursor-pointer border border-white/60 dark:border-white/10"
          >
            Xóa hết
          </button>
          <button
            type="button"
            onClick={() => handleAddDigit('0')}
            className="liquid-glass-subtle py-3 sm:py-3.5 rounded-2xl font-black text-lg sm:text-xl text-slate-800 dark:text-white hover:bg-white dark:hover:bg-slate-700 hover:scale-105 active:scale-95 transition-all shadow-xs cursor-pointer border border-white/60 dark:border-white/10"
          >
            0
          </button>
          <button
            type="button"
            onClick={handleDeleteDigit}
            title="Xóa ký tự vừa nhập"
            className="liquid-glass-subtle py-3 sm:py-3.5 rounded-2xl font-bold text-sm text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 hover:scale-105 active:scale-95 transition-all flex items-center justify-center cursor-pointer border border-white/60 dark:border-white/10"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>

        {/* Remember this device & Hint */}
        <div className="flex flex-col items-center gap-2 pt-2 border-t border-white/40 dark:border-white/10 text-xs">
          <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-600 dark:text-slate-300">
            <input
              type="checkbox"
              checked={rememberDevice}
              onChange={(e) => setRememberDevice(e.target.checked)}
              className="w-4 h-4 rounded-md accent-amber-500 cursor-pointer"
            />
            <span>Ghi nhớ mở khóa trên thiết bị này</span>
          </label>
          <p className="text-[11px] text-slate-400 dark:text-slate-500">
            💡 Bạn có thể bấm phím số trực tiếp trên bàn phím máy tính
          </p>
        </div>
      </div>
    </div>
  );
};
