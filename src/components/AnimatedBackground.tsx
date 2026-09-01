import React from 'react';

export const AnimatedBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10 select-none">
      {/* Soft Ambient Floating Light Blobs */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-purple-300/25 dark:bg-purple-900/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute top-1/3 -right-40 w-96 h-96 bg-cyan-300/25 dark:bg-cyan-900/20 rounded-full blur-3xl animate-pulse [animation-delay:2s]" />
      <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-amber-200/30 dark:bg-amber-900/20 rounded-full blur-3xl animate-pulse [animation-delay:4s]" />

      {/* Floating Sparkles / Particles */}
      <div className="absolute top-1/4 left-1/6 w-2 h-2 bg-amber-400 rounded-full opacity-60 animate-ping [animation-duration:3s]" />
      <div className="absolute top-3/4 left-3/4 w-2.5 h-2.5 bg-cyan-400 rounded-full opacity-50 animate-ping [animation-duration:4s]" />
      <div className="absolute top-1/2 right-1/5 w-2 h-2 bg-purple-400 rounded-full opacity-50 animate-ping [animation-duration:3.5s]" />
      <div className="absolute top-1/6 right-1/3 w-1.5 h-1.5 bg-pink-400 rounded-full opacity-60 animate-ping [animation-duration:2.5s]" />
    </div>
  );
};
