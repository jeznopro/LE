import React from 'react';

export const AnimatedBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10 select-none">
      {/* 1. Organic Fluid Liquid Glowing Orbs */}
      {/* Orb 1: Deep Indigo / Violet (Top Left) */}
      <div className="absolute -top-32 -left-32 w-[34rem] h-[34rem] bg-gradient-to-tr from-indigo-400/35 via-purple-400/30 to-pink-300/30 dark:from-indigo-600/25 dark:via-purple-700/25 dark:to-violet-900/20 rounded-full blur-3xl animate-liquid-orb-1" />

      {/* Orb 2: Cyan / Sky Blue / Turquoise (Top Right) */}
      <div className="absolute -top-20 -right-32 w-[32rem] h-[32rem] bg-gradient-to-bl from-sky-400/35 via-cyan-300/30 to-blue-300/30 dark:from-cyan-500/25 dark:via-sky-700/25 dark:to-blue-950/20 rounded-full blur-3xl animate-liquid-orb-2" />

      {/* Orb 3: Warm Amber / Sunset Glow (Center) */}
      <div className="absolute top-1/3 left-1/4 w-[28rem] h-[28rem] bg-gradient-to-r from-amber-300/30 via-orange-300/25 to-rose-300/25 dark:from-amber-600/18 dark:via-orange-700/18 dark:to-rose-900/15 rounded-full blur-3xl animate-liquid-orb-3" />

      {/* Orb 4: Rose / Magenta Flare (Bottom Right) */}
      <div className="absolute -bottom-28 -right-28 w-[36rem] h-[36rem] bg-gradient-to-tl from-rose-400/35 via-pink-400/30 to-purple-300/30 dark:from-rose-600/25 dark:via-pink-800/22 dark:to-purple-950/20 rounded-full blur-3xl animate-liquid-orb-4" />

      {/* Orb 5: Mint / Emerald Fresh Light (Bottom Left) */}
      <div className="absolute -bottom-36 left-1/6 w-[30rem] h-[30rem] bg-gradient-to-tr from-emerald-300/25 via-teal-300/25 to-sky-300/20 dark:from-emerald-700/20 dark:via-teal-800/20 dark:to-slate-900/15 rounded-full blur-3xl animate-liquid-orb-1 [animation-delay:4s]" />

      {/* 2. Soft Ambient Micro-Particles */}
      <div className="absolute top-1/5 left-1/5 w-2 h-2 bg-amber-300 rounded-full opacity-60 animate-ping [animation-duration:4s]" />
      <div className="absolute top-2/3 right-1/4 w-2.5 h-2.5 bg-cyan-300 rounded-full opacity-50 animate-ping [animation-duration:5s]" />
      <div className="absolute top-1/2 left-3/4 w-2 h-2 bg-purple-300 rounded-full opacity-50 animate-ping [animation-duration:4.5s]" />
      <div className="absolute bottom-1/4 left-1/3 w-1.5 h-1.5 bg-rose-300 rounded-full opacity-60 animate-ping [animation-duration:3.5s]" />
    </div>
  );
};
