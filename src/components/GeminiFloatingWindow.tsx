import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Minus,
  Maximize2,
  Minimize2,
  ExternalLink,
  Send,
  Sparkles,
  RotateCcw,
  Globe,
  MessageSquare,
  Bot,
  User as UserIcon,
  HelpCircle,
  Volume2,
} from 'lucide-react';
import { UserSettings } from '../types';
import { storage } from '../utils/storage';
import { soundManager } from '../utils/sounds';
import { ttsService } from '../utils/tts';

interface GeminiFloatingWindowProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
}

interface ChatMsg {
  id: string;
  sender: 'user' | 'gemini';
  text: string;
  time: string;
}

export const GeminiFloatingWindow: React.FC<GeminiFloatingWindowProps> = ({
  isOpen,
  onClose,
  settings,
}) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [activeTab, setActiveTab] = useState<'web' | 'chat'>('web');
  const [iframeError, setIframeError] = useState(false);

  // In-window direct chat state
  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      id: 'welcome',
      sender: 'gemini',
      text: 'Xin chào! Tôi là Google Gemini. Tôi có thể giải thích ngữ pháp, từ vựng, dịch thuật hoặc trò chuyện tiếng Anh cùng bạn ngay tại đây. Bạn muốn hỏi gì?',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeTab === 'chat') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping, activeTab]);

  if (!isOpen) return null;

  // Open real Gemini window as a dedicated compact floating popup
  const handleOpenGeminiPopup = () => {
    soundManager.playClick();
    const width = 500;
    const height = 750;
    const left = window.screen.width ? window.screen.width - width - 20 : 100;
    const top = 80;
    window.open(
      'https://gemini.google.com/app',
      'GoogleGeminiWebWindow',
      `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes,status=no,toolbar=no,menubar=no`
    );
  };

  // Send message in the in-window chat
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = inputMessage.trim();
    if (!text || isTyping) return;

    soundManager.playClick();
    setInputMessage('');

    const userMsg: ChatMsg = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    try {
      const currentSettings = storage.getSettings();
      const apiKey = currentSettings.geminiApiKey?.trim();

      if (apiKey) {
        // Direct call to Gemini API using user's key
        const models = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
        let successText = '';

        for (const model of models) {
          try {
            const res = await fetch(
              `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  contents: [
                    {
                      parts: [
                        {
                          text: `You are Google Gemini, an expert, friendly English tutor and assistant. Answer the user's question or continue the conversation helpfully and concisely. Support Vietnamese explanation if user asks in Vietnamese or asks for translation:\n\nUser: "${text}"`,
                        },
                      ],
                    },
                  ],
                }),
              }
            );
            if (res.ok) {
              const data = await res.json();
              successText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
              if (successText) break;
            }
          } catch {
            // try next model
          }
        }

        if (successText) {
          setIsTyping(false);
          setMessages((prev) => [
            ...prev,
            {
              id: `gemini-${Date.now()}`,
              sender: 'gemini',
              text: successText,
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            },
          ]);
          return;
        }
      }

      // Friendly fallback response if no API key or network glitch
      setTimeout(() => {
        setIsTyping(false);
        setMessages((prev) => [
          ...prev,
          {
            id: `gemini-${Date.now()}`,
            sender: 'gemini',
            text: `Bạn có thể bấm nút "Mở Web Gemini Riêng ↗" ở góc trên để dùng tài khoản Google Gemini đã đăng nhập của bạn, hoặc dán API Key tại trang cài đặt để chat không giới hạn nhé!`,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      }, 700);
    } catch {
      setIsTyping(false);
    }
  };

  // Minimized Bar in bottom-right
  if (isMinimized) {
    return (
      <div className="fixed bottom-5 right-5 z-50 animate-fadeIn">
        <div
          onClick={() => {
            soundManager.playClick();
            setIsMinimized(false);
          }}
          className="flex items-center gap-3 px-4 py-2.5 bg-linear-to-r from-blue-600 via-indigo-600 to-purple-600 text-white font-black text-xs rounded-2xl shadow-2xl hover:scale-105 active:scale-95 transition-all cursor-pointer ring-2 ring-blue-400/50"
        >
          <span className="text-base">💎</span>
          <span>Cửa Sổ Gemini AI (Đang Thu Nhỏ)</span>
          <Maximize2 className="w-3.5 h-3.5 ml-1" />
        </div>
      </div>
    );
  }

  return (
    <div
      className={`fixed z-50 transition-all duration-300 flex flex-col bg-white dark:bg-slate-900 border-2 border-blue-400/80 dark:border-blue-500/80 rounded-3xl shadow-2xl overflow-hidden animate-scaleUp ${
        isMaximized
          ? 'inset-4 sm:inset-8 w-auto h-auto'
          : 'bottom-5 right-4 sm:right-6 w-[95vw] sm:w-[480px] md:w-[520px] h-[650px] max-h-[85vh]'
      }`}
    >
      {/* Window Header Bar */}
      <div className="px-4 py-3 bg-linear-to-r from-blue-900 via-indigo-900 to-slate-900 text-white flex items-center justify-between gap-2 select-none border-b border-blue-700/60 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-500/20 border border-blue-400/50 flex items-center justify-center text-lg shrink-0">
            💎
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-black text-xs sm:text-sm tracking-tight">
                Cửa Sổ Google Gemini AI
              </h3>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-blue-500/30 text-blue-200 border border-blue-400/40">
                Web & Chat
              </span>
            </div>
            <div className="text-[10px] text-blue-200/80 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Sẵn sàng hỗ trợ học tập</span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleOpenGeminiPopup}
            title="Mở ra cửa sổ nổi riêng (đăng nhập tài khoản Google của bạn)"
            className="p-1.5 hover:bg-white/20 text-blue-200 hover:text-white rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-[11px] font-bold"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Cửa sổ nổi</span>
          </button>

          <button
            type="button"
            onClick={() => setIsMinimized(true)}
            title="Thu nhỏ cửa sổ"
            className="p-1.5 hover:bg-white/20 text-slate-300 hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => setIsMaximized(!isMaximized)}
            title={isMaximized ? 'Thu nhỏ lại' : 'Phóng to'}
            className="p-1.5 hover:bg-white/20 text-slate-300 hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            {isMaximized ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>

          <button
            type="button"
            onClick={onClose}
            title="Đóng cửa sổ"
            className="p-1.5 hover:bg-rose-500 text-slate-300 hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tabs Selector */}
      <div className="px-4 py-2 bg-slate-100 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-700/80 flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              soundManager.playClick();
              setActiveTab('web');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'web'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Trang Web Gemini</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundManager.playClick();
              setActiveTab('chat');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'chat'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Chat Trực Tiếp Trong Web</span>
          </button>
        </div>

        <button
          type="button"
          onClick={handleOpenGeminiPopup}
          className="text-[11px] font-black text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
          title="Mở cửa sổ rời bên cạnh để tự động dùng tài khoản Google đang đăng nhập"
        >
          <span>Mở Cửa Sổ Rời</span>
          <span>↗</span>
        </button>
      </div>

      {/* Body Content */}
      <div className="flex-1 overflow-hidden relative flex flex-col">
        {/* TAB 1: GEMINI WEB VIEW */}
        {activeTab === 'web' && (
          <div className="w-full h-full flex flex-col">
            {/* Top address & security helper bar */}
            <div className="px-3.5 py-2 bg-blue-50/70 dark:bg-blue-950/40 border-b border-blue-100 dark:border-blue-900/50 flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-medium truncate">
                <span className="text-emerald-500">🔒</span>
                <span className="font-mono text-[11px] text-blue-700 dark:text-blue-300">
                  /gemini-proxy/app (Reverse Proxy Gỡ X-Frame-Options)
                </span>
              </div>

              <button
                type="button"
                onClick={handleOpenGeminiPopup}
                className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-black rounded-lg shadow-xs transition-all flex items-center gap-1 cursor-pointer shrink-0"
              >
                <span>Mở Cửa Sổ Rời (Dự phòng)</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>

            {/* Iframe with Google Security Fallback notice */}
            <div className="flex-1 w-full relative bg-slate-50 dark:bg-slate-900">
              <iframe
                src="/gemini-proxy/app"
                title="Google Gemini Web App (Proxy Embedded)"
                className="w-full h-full border-0"
                allow="microphone; camera; clipboard-write; clipboard-read; payment; geolocation"
                onError={() => setIframeError(true)}
              />

              {/* Friendly guidance overlay / helper box */}
              <div className="absolute bottom-3 left-3 right-3 p-3 bg-white/95 dark:bg-slate-800/95 backdrop-blur-md rounded-2xl border border-blue-200 dark:border-blue-800 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-2.5">
                <div className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed text-center sm:text-left">
                  <strong>💡 Mẹo:</strong> Nếu trình duyệt hiện <em>&quot;Từ chối kết nối&quot;</em> (do Google chặn nhúng iframe), bạn chỉ cần bấm nút <strong>Mở Cửa Sổ Nổi ↗</strong> để mở cửa sổ Gemini tự động nhận tài khoản Google của bạn!
                </div>
                <button
                  type="button"
                  onClick={handleOpenGeminiPopup}
                  className="px-4 py-2 bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-xs rounded-xl shadow-md transition-all hover:scale-105 active:scale-95 shrink-0 cursor-pointer flex items-center gap-1.5"
                >
                  <span>Mở Cửa Sổ Gemini Nổi</span>
                  <span>↗</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: IN-WINDOW INSTANT CHAT */}
        {activeTab === 'chat' && (
          <div className="w-full h-full flex flex-col bg-slate-50 dark:bg-slate-900">
            {/* Messages Feed */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex gap-2.5 ${m.sender === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}
                >
                  {m.sender === 'gemini' && (
                    <div className="w-8 h-8 rounded-xl bg-linear-to-tr from-blue-600 to-indigo-700 text-white flex items-center justify-center font-black text-sm shrink-0 shadow-xs">
                      💎
                    </div>
                  )}

                  <div className="max-w-[85%] space-y-1">
                    <div
                      className={`p-3 rounded-2xl text-xs sm:text-sm font-medium leading-relaxed whitespace-pre-wrap ${
                        m.sender === 'user'
                          ? 'bg-blue-600 text-white rounded-tr-xs shadow-xs'
                          : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-xs border border-slate-200 dark:border-slate-700 shadow-2xs'
                      }`}
                    >
                      {m.text}
                    </div>
                    <div className={`text-[10px] text-slate-400 px-1 ${m.sender === 'user' ? 'text-right' : 'text-left'}`}>
                      {m.time}
                    </div>
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex gap-2.5 justify-start animate-fadeIn">
                  <div className="w-8 h-8 rounded-xl bg-linear-to-tr from-blue-600 to-indigo-700 text-white flex items-center justify-center font-black text-sm shrink-0 shadow-xs">
                    💎
                  </div>
                  <div className="p-3 bg-white dark:bg-slate-800 rounded-2xl rounded-tl-xs border border-slate-200 dark:border-slate-700 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" />
                    <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.2s]" />
                    <span className="w-2 h-2 rounded-full bg-purple-500 animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* Quick Prompt Ideas */}
            <div className="px-3 py-1.5 bg-white dark:bg-slate-800/90 border-t border-slate-200 dark:border-slate-700/80 flex items-center gap-1.5 overflow-x-auto select-none">
              <span className="text-[10px] font-black uppercase text-slate-400 shrink-0">
                Gợi ý:
              </span>
              {[
                'Giải thích ngữ pháp câu này',
                'Phân biệt Like và As',
                'Viết lại câu cho tự nhiên hơn',
                'Đặt câu ví dụ từ này',
              ].map((s, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setInputMessage(s);
                  }}
                  className="px-2.5 py-1 bg-slate-100 dark:bg-slate-700 hover:bg-blue-50 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-[11px] font-semibold rounded-lg shrink-0 transition-colors cursor-pointer"
                >
                  {s}
                </button>
              ))}
            </div>

            {/* Input Bar */}
            <form onSubmit={handleSendMessage} className="p-3 bg-white dark:bg-slate-800/90 border-t border-slate-200 dark:border-slate-700/80 flex items-center gap-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Hỏi Gemini bất kỳ câu hỏi ngữ pháp hay trò chuyện..."
                className="flex-1 px-3.5 py-2.5 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <button
                type="submit"
                disabled={!inputMessage.trim() || isTyping}
                className="px-4 py-2.5 bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-40 text-white font-black text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1 shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Gửi</span>
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
