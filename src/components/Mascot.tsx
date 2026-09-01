import React from 'react';

export type MascotMood = 'happy' | 'cheering' | 'thinking' | 'proud' | 'sleepy' | 'surprised';

interface MascotProps {
  mood?: MascotMood;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  message?: string;
  className?: string;
  onClick?: () => void;
}

export const Mascot: React.FC<MascotProps> = ({
  mood = 'happy',
  size = 'md',
  message,
  className = '',
  onClick,
}) => {
  const sizeMap = {
    sm: 'w-12 h-12',
    md: 'w-20 h-20',
    lg: 'w-32 h-32',
    xl: 'w-44 h-44',
  };

  const getAnimation = () => {
    switch (mood) {
      case 'cheering':
        return 'animate-bounce';
      case 'thinking':
        return 'animate-pulse';
      case 'surprised':
        return 'animate-wiggle scale-110';
      default:
        return 'animate-mochi-float';
    }
  };

  return (
    <div
      className={`inline-flex flex-col items-center select-none ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
    >
      {message && (
        <div className="relative mb-2 px-3.5 py-1.5 bg-white dark:bg-slate-800 border-2 border-[#FED770] rounded-2xl shadow-md text-xs sm:text-sm font-extrabold text-[#5B3E06] dark:text-amber-300 animate-mochi-pulse max-w-[220px] text-center z-10">
          {message}
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-x-6 border-x-transparent border-t-6 border-t-[#FED770]"></div>
        </div>
      )}

      <div className={`relative ${sizeMap[size]} transition-transform duration-300 hover:scale-110 group`}>
        {/* Soft Blue Glowing Aura around Gojo */}
        <div className="absolute inset-0 bg-cyan-400/20 dark:bg-cyan-400/30 rounded-3xl blur-md scale-110 animate-pulse pointer-events-none" />
        
        {/* Gojo Chibi Avatar */}
        <img
          src="/gojo.png"
          alt="Gojo Satoru Mascot"
          className={`w-full h-full object-cover rounded-3xl drop-shadow-md border-2 border-cyan-200 dark:border-cyan-500/40 relative z-10 transition-all ${getAnimation()}`}
        />

        {/* Dynamic Badge/Mood Indicator */}
        {mood === 'cheering' && (
          <span className="absolute -top-1 -right-1 text-lg z-20 animate-ping">
            ✨
          </span>
        )}
        {mood === 'thinking' && (
          <span className="absolute -top-1 -right-1 text-lg z-20 animate-bounce">
            💭
          </span>
        )}
        {mood === 'surprised' && (
          <span className="absolute -top-1 -right-1 text-lg z-20 animate-bounce">
            ❗
          </span>
        )}
      </div>
    </div>
  );
};
