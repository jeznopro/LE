import React, { useState, useEffect, useRef } from 'react';
import { AIChatMessage, ConversationScenario, UserSettings } from '../types';
import { CONVERSATION_SCENARIOS, generateAIResponse } from '../utils/aiTutor';
import { ttsService } from '../utils/tts';
import { soundManager } from '../utils/sounds';
import { speechRecognitionManager } from '../utils/speechRecognition';
import { storage } from '../utils/storage';
import { Mascot } from './Mascot';
import {
  Mic,
  Send,
  Volume2,
  ArrowLeft,
  Sparkles,
  Eye,
  EyeOff,
  RotateCcw,
  CheckCircle,
  Lightbulb,
  MessageSquare,
  Bot,
  User as UserIcon,
  BookOpen,
  Award,
  Layers,
  HelpCircle,
  Key,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface AIConversationProps {
  settings: UserSettings;
  onExit: () => void;
  onRewardXP: (xp: number) => void;
}

export const AIConversation: React.FC<AIConversationProps> = ({
  settings,
  onExit,
  onRewardXP,
}) => {
  const [localSettings, setLocalSettings] = useState<UserSettings>(settings);
  const [apiKeyInput, setApiKeyInput] = useState(settings.geminiApiKey || '');
  const [isEditingKey, setIsEditingKey] = useState(!settings.geminiApiKey);
  const [keySavedToast, setKeySavedToast] = useState(false);

  const [activeCategoryTab, setActiveCategoryTab] = useState<'ielts-part-1' | 'ielts-part-2' | 'ielts-part-3' | 'daily' | 'all'>('all');
  const [selectedScenario, setSelectedScenario] = useState<ConversationScenario | null>(null);
  const [messages, setMessages] = useState<AIChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [suggestedPrompts, setSuggestedPrompts] = useState<string[]>([]);
  const [showTranslations, setShowTranslations] = useState<Record<string, boolean>>({});
  const [autoPlayAudio, setAutoPlayAudio] = useState(true);
  const [sessionXP, setSessionXP] = useState(0);
  const [showKeyVocabModal, setShowKeyVocabModal] = useState(false);
  const [recordingSecondsElapsed, setRecordingSecondsElapsed] = useState(0);
  const [recordingSecondsLeft, setRecordingSecondsLeft] = useState(300);

  const handleSaveApiKey = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    soundManager.playClick();
    const cleanKey = apiKeyInput.trim();
    const updated = { ...localSettings, geminiApiKey: cleanKey };
    storage.saveSettings(updated);
    setLocalSettings(updated);
    setIsEditingKey(false);
    setKeySavedToast(true);
    confetti({ particleCount: 60, spread: 60, origin: { y: 0.3 } });
    setTimeout(() => setKeySavedToast(false), 3500);
  };

  const handleRemoveApiKey = () => {
    soundManager.playClick();
    const updated = { ...localSettings, geminiApiKey: '' };
    storage.saveSettings(updated);
    setLocalSettings(updated);
    setApiKeyInput('');
    setIsEditingKey(true);
  };

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom whenever messages update
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isThinking]);

  // Handle choosing a scenario
  const handleSelectScenario = (scenario: ConversationScenario) => {
    soundManager.playClick();
    setSelectedScenario(scenario);
    setSuggestedPrompts(scenario.suggestedPrompts);

    const initialMsg: AIChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'ai',
      text: scenario.initialAIMessage,
      translation: scenario.initialTranslation,
      timestamp: Date.now(),
    };

    setMessages([initialMsg]);

    if (autoPlayAudio) {
      setTimeout(() => {
        ttsService.speak(scenario.initialAIMessage, settings.ttsAccent, settings.ttsSpeed);
      }, 300);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || !selectedScenario || isThinking) return;

    soundManager.playClick();
    setInputText('');

    const userMsg: AIChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsThinking(true);

    try {
      const response = await generateAIResponse(text, selectedScenario, messages);

      const aiMsg: AIChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: response.text,
        translation: response.translation,
        correction: response.correction,
        tip: response.tip,
        evaluation: response.evaluation,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, aiMsg]);
      setSuggestedPrompts(response.suggestedPrompts || []);
      setIsThinking(false);

      // Reward XP for active conversation
      const gained = 15;
      setSessionXP((x) => x + gained);
      onRewardXP(gained);
      soundManager.playCorrect();

      if (autoPlayAudio) {
        ttsService.speak(response.text, settings.ttsAccent, settings.ttsSpeed);
      }
    } catch (err) {
      setIsThinking(false);
      const fallbackMsg: AIChatMessage = {
        id: `ai-err-${Date.now()}`,
        sender: 'ai',
        text: "That was great! Keep practicing. What else would you like to share about this topic?",
        translation: "Tuyệt vời lắm! Hãy tiếp tục luyện tập nhé. Cậu muốn chia sẻ thêm điều gì về chủ đề này nữa?",
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    }
  };

  // 5-Minute Continuous Speech Recognition
  const handleToggleListening = () => {
    if (isListening) {
      speechRecognitionManager.stopListening();
      setIsListening(false);
      return;
    }

    soundManager.playClick();
    setIsListening(true);
    setRecordingSecondsElapsed(0);
    setRecordingSecondsLeft(300);

    speechRecognitionManager.startListening(
      (interimText) => {
        setInputText(interimText);
      },
      (finalText) => {
        setIsListening(false);
        if (finalText.trim()) {
          setInputText('');
          handleSendMessage(finalText);
        }
      },
      (_err) => {
        setIsListening(false);
      },
      () => {
        setIsListening(false);
      },
      'en-US',
      300, // 5 minutes!
      (secLeft, secElapsed) => {
        setRecordingSecondsLeft(secLeft);
        setRecordingSecondsElapsed(secElapsed);
      }
    );
  };

  const handleCancelListening = () => {
    soundManager.playClick();
    speechRecognitionManager.cancelListening();
    setIsListening(false);
    setInputText('');
  };

  // Play audio for a specific AI message
  const handlePlayAudio = (text: string) => {
    soundManager.playClick();
    ttsService.speak(text, settings.ttsAccent, settings.ttsSpeed);
  };

  // Toggle translation for a specific message
  const handleToggleTranslation = (msgId: string) => {
    soundManager.playClick();
    setShowTranslations((prev) => ({
      ...prev,
      [msgId]: !prev[msgId],
    }));
  };

  // Reset conversation
  const handleResetConversation = () => {
    if (!selectedScenario) return;
    soundManager.playClick();
    handleSelectScenario(selectedScenario);
  };

  const filteredScenarios = CONVERSATION_SCENARIOS.filter((sc) => {
    if (activeCategoryTab === 'all') return true;
    if (activeCategoryTab === 'ielts-part-1') return sc.category === ('ielts-part-1' as any);
    if (activeCategoryTab === 'ielts-part-2') return sc.category === ('ielts-part-2' as any);
    if (activeCategoryTab === 'ielts-part-3') return sc.category === ('ielts-part-3' as any);
    if (activeCategoryTab === 'daily') return sc.category === ('daily' as any) || sc.category === ('business' as any);
    return true;
  });

  // Scenario Selection Screen
  if (!selectedScenario) {
    return (
      <div className="max-w-5xl w-full mx-auto space-y-6 pb-20 select-none animate-fadeIn">
        
        {/* Main Glassmorphic Wrapper */}
        <div className="bg-white/95 dark:bg-slate-900/95 rounded-3xl p-5 sm:p-7 border border-slate-200/90 dark:border-slate-800 shadow-xl backdrop-blur-md space-y-6">
          
          {/* Top Banner */}
          <div className="bg-linear-to-r from-blue-900 via-indigo-950 to-slate-950 text-white rounded-2xl p-5 sm:p-7 shadow-lg border border-blue-700/50 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex flex-col sm:flex-row items-center justify-between gap-5 relative z-10">
              <div className="space-y-2 text-center sm:text-left">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-400/20 border border-blue-400/40 rounded-full text-blue-300 text-xs font-black tracking-wide">
                  <span>💎 Google Gemini AI & Gojo Satoru English Tutor</span>
                </div>
                <h1 className="text-xl sm:text-3xl font-black tracking-tight">
                  Trò Chuyện & Luyện Nói Cùng Gemini AI 🎙️
                </h1>
                <p className="text-xs sm:text-sm text-slate-300 max-w-xl font-medium leading-relaxed">
                  Liên kết tài khoản Google Gemini cá nhân để trò chuyện tự do, hỏi đáp ngữ pháp, hoặc luyện thi 10 Unit IELTS Speaking trực tiếp cùng AI!
                </p>

                <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleSelectScenario(CONVERSATION_SCENARIOS[0])}
                    className="px-5 py-2.5 bg-linear-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-black text-xs sm:text-sm rounded-xl shadow-md transition-all hover:scale-105 active:scale-95 flex items-center gap-1.5 cursor-pointer ring-2 ring-blue-300/40"
                  >
                    <span>💎 Chat Tự Do Cùng Gemini Ngay</span>
                    <span>➔</span>
                  </button>
                </div>
              </div>

              <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border-3 border-blue-400 shadow-xl shrink-0 animate-mochi-float bg-linear-to-tr from-blue-600 to-indigo-700 flex items-center justify-center text-4xl sm:text-5xl">
                💎
              </div>
            </div>
          </div>

          {/* Gemini Account / API Key Link Widget */}
          <div className="bg-linear-to-r from-blue-50/80 via-indigo-50/80 to-purple-50/80 dark:from-slate-800/90 dark:to-slate-800/90 rounded-2xl p-4 sm:p-5 border-2 border-blue-200 dark:border-blue-900/60 shadow-sm backdrop-blur-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-blue-500/10 dark:bg-blue-500/20 border border-blue-400/40 flex items-center justify-center text-2xl shrink-0">
                  🔑
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-black text-slate-900 dark:text-white">
                      Liên Kết Tài Khoản Google Gemini AI
                    </h3>
                    {localSettings.geminiApiKey?.trim() ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Đã Liên Kết Key
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300">
                        Chưa Nhập Key (Dùng Thử Mẫu)
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                    {localSettings.geminiApiKey?.trim()
                      ? `Key riêng của bạn: ••••••••••••${localSettings.geminiApiKey.slice(-4)} (Đã sẵn sàng trò chuyện)`
                      : 'Nhập API Key Gemini để kích hoạt trí tuệ nhân tạo Gemini 2.5 Flash thông minh không giới hạn.'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {!isEditingKey && localSettings.geminiApiKey?.trim() ? (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setIsEditingKey(true)}
                      className="px-3 py-1.5 bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 text-xs font-bold rounded-xl transition-all cursor-pointer"
                    >
                      Đổi Key
                    </button>
                    <button
                      type="button"
                      onClick={handleRemoveApiKey}
                      className="px-2.5 py-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-bold rounded-xl transition-all cursor-pointer"
                      title="Xóa API Key khỏi trình duyệt này"
                    >
                      Gỡ
                    </button>
                  </div>
                ) : (
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noreferrer"
                    className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-xl transition-all flex items-center gap-1 shadow-sm"
                  >
                    <span>Lấy Key Miễn Phí Tại Google AI Studio</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>

            {/* Editing Input Bar */}
            {(isEditingKey || !localSettings.geminiApiKey?.trim()) && (
              <form onSubmit={handleSaveApiKey} className="mt-3 pt-3 border-t border-blue-200/60 dark:border-slate-700/60 flex flex-col sm:flex-row items-center gap-2">
                <input
                  type="password"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder="Dán mã Gemini API Key của bạn (bắt đầu bằng AIzaSy...)"
                  className="flex-1 w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="submit"
                    disabled={!apiKeyInput.trim()}
                    className="flex-1 sm:flex-none px-5 py-2.5 bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-40 text-white text-xs font-black rounded-xl shadow-sm transition-all cursor-pointer"
                  >
                    Lưu & Kết Nối Key
                  </button>
                  {localSettings.geminiApiKey?.trim() && (
                    <button
                      type="button"
                      onClick={() => setIsEditingKey(false)}
                      className="px-3 py-2.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white cursor-pointer"
                    >
                      Đóng
                    </button>
                  )}
                </div>
              </form>
            )}

            {keySavedToast && (
              <div className="mt-2.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 animate-fadeIn">
                <CheckCircle className="w-4 h-4" />
                <span>Đã kết nối tài khoản Gemini thành công! Bây giờ bạn đã sẵn sàng trò chuyện trực tiếp cùng Gemini AI.</span>
              </div>
            )}
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-100 dark:border-slate-800 pb-3">
            {[
              { id: 'all', label: '💎 Chat Gemini & Tất Cả', count: CONVERSATION_SCENARIOS.length },
              { id: 'daily', label: '🤖 Chat Tự Do & Giao Tiếp', count: 4 },
              { id: 'ielts-part-1', label: '🇬🇧 Part 1 (10 Unit F:\\Speaking)', count: 10 },
              { id: 'ielts-part-2', label: '🗺️ Part 2 (Cue Cards 2 Phút)', count: 3 },
              { id: 'ielts-part-3', label: '🧩 Part 3 (Phản Biện & Mở Rộng)', count: 3 },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  soundManager.playClick();
                  setActiveCategoryTab(tab.id as any);
                }}
                className={`px-3.5 py-2 rounded-xl font-black text-xs shrink-0 transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeCategoryTab === tab.id
                    ? 'bg-linear-to-r from-blue-600 to-indigo-600 text-white shadow-md scale-105'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                  activeCategoryTab === tab.id ? 'bg-white/30 text-white' : 'bg-white dark:bg-slate-700 text-slate-500'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Scenario Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredScenarios.map((sc) => (
              <div
                key={sc.id}
                onClick={() => handleSelectScenario(sc)}
                className={`bg-slate-50 dark:bg-slate-800/90 hover:bg-white dark:hover:bg-slate-800 rounded-2xl p-4 sm:p-5 border-2 shadow-sm hover:shadow-lg transition-all duration-200 cursor-pointer flex flex-col justify-between group hover:-translate-y-1 ${
                  sc.id === 'gemini-free-chat'
                    ? 'border-blue-400/80 dark:border-blue-500/80 ring-2 ring-blue-400/30'
                    : 'border-slate-200/80 dark:border-slate-700 hover:border-amber-400 dark:hover:border-amber-500'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2.5">
                    <div className="w-11 h-11 rounded-xl bg-blue-100 dark:bg-blue-950/80 border border-blue-300 dark:border-blue-700 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
                      {sc.icon}
                    </div>
                    <span className="px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border border-blue-300">
                      {sc.level}
                    </span>
                  </div>

                  <h3 className="font-black text-sm text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1">
                    {sc.title}
                  </h3>

                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 font-medium leading-relaxed line-clamp-2">
                    {sc.description}
                  </p>

                  {sc.keyVocab && sc.keyVocab.length > 0 && (
                    <div className="mt-2.5 flex items-center gap-1 flex-wrap">
                      {sc.keyVocab.slice(0, 3).map((v, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 bg-white dark:bg-slate-700/80 text-slate-600 dark:text-slate-300 rounded-md text-[10px] font-semibold border border-slate-200 dark:border-slate-600"
                        >
                          {v}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-3.5 pt-2.5 border-t border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between text-xs font-black text-blue-600 dark:text-blue-400">
                  <span>Bắt Đầu Trò Chuyện</span>
                  <span className="group-hover:translate-x-1 transition-transform">➔</span>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    );
  }

  // Active AI Conversation Room
  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col h-[75vh] min-h-[520px] bg-white dark:bg-slate-900 rounded-3xl border-2 border-slate-200/90 dark:border-slate-800 shadow-2xl overflow-hidden animate-scaleUp relative z-20">
      
      {/* Room Header */}
      <div className="px-4 sm:px-6 py-3.5 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSelectedScenario(null)}
            className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-slate-500 dark:text-slate-300 transition-colors cursor-pointer"
            title="Đổi chủ đề khác"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="font-black text-sm sm:text-base text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
              <span>{selectedScenario.icon}</span>
              <span>{selectedScenario.title}</span>
            </h2>
            <div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>
                {selectedScenario.id === 'gemini-free-chat'
                  ? (localSettings.geminiApiKey?.trim() ? 'Google Gemini AI đang trực tuyến (Key riêng)' : 'Google Gemini AI (Chế độ mô phỏng)')
                  : 'Thầy Gojo AI đang lắng nghe'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {selectedScenario.keyVocab && (
            <button
              onClick={() => setShowKeyVocabModal(true)}
              className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 rounded-xl text-xs font-black flex items-center gap-1 border border-indigo-200 dark:border-indigo-800 cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Từ Vựng & Bài Mẫu</span>
            </button>
          )}

          <button
            onClick={() => setAutoPlayAudio(!autoPlayAudio)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
              autoPlayAudio
                ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-300'
                : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
            }`}
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Tự Đọc Tiếng</span>
          </button>

          <span className="px-3 py-1 bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 text-xs font-black rounded-xl border border-amber-200 dark:border-amber-800 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 fill-amber-500" /> +{sessionXP} XP
          </span>
        </div>
      </div>

      {/* Part 2 Cue Card Banner (if applicable) */}
      {selectedScenario.cueCardPrompt && (
        <div className="px-4 py-2.5 bg-amber-50 dark:bg-amber-950/60 border-b border-amber-200 dark:border-amber-800 flex items-start gap-2 text-xs">
          <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="font-semibold text-amber-900 dark:text-amber-200">
            <strong>IELTS Cue Card Prompt:</strong> {selectedScenario.cueCardPrompt}
          </div>
        </div>
      )}

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}
          >
            {msg.sender === 'ai' && (
              <div className="w-9 h-9 rounded-2xl overflow-hidden border-2 border-blue-400 shrink-0 shadow-xs flex items-center justify-center bg-linear-to-tr from-blue-600 to-indigo-700 text-white font-black text-lg">
                {selectedScenario.id === 'gemini-free-chat' ? (
                  <span>💎</span>
                ) : (
                  <img src="/gojo.png" alt="Gojo AI" className="w-full h-full object-cover" />
                )}
              </div>
            )}

            <div className={`max-w-[85%] sm:max-w-[75%] space-y-1.5`}>
              <div
                className={`p-4 rounded-3xl shadow-xs ${
                  msg.sender === 'user'
                    ? 'bg-linear-to-r from-amber-500 to-orange-500 text-white rounded-tr-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-xs border border-slate-200/60 dark:border-slate-700'
                }`}
              >
                <div className="text-sm sm:text-base font-semibold leading-relaxed">
                  {msg.text}
                </div>

                {/* AI Speech & Translation controls */}
                {msg.sender === 'ai' && (
                  <div className="mt-2.5 pt-2 border-t border-slate-200/80 dark:border-slate-700/80 flex items-center gap-2">
                    <button
                      onClick={() => handlePlayAudio(msg.text)}
                      title="Nghe lại phát âm"
                      className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-500 dark:text-slate-400 transition-colors cursor-pointer"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleToggleTranslation(msg.id)}
                      title="Xem bản dịch tiếng Việt"
                      className="text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
                    >
                      {showTranslations[msg.id] ? 'Ẩn dịch' : '🇻🇳 Dịch nghĩa'}
                    </button>
                  </div>
                )}
              </div>

              {/* Translation Dropdown */}
              {msg.sender === 'ai' && showTranslations[msg.id] && msg.translation && (
                <div className="p-3 bg-amber-50/80 dark:bg-slate-800/80 border border-amber-200 dark:border-slate-700 rounded-2xl text-xs text-slate-700 dark:text-slate-300 animate-fadeIn font-medium">
                  {msg.translation}
                </div>
              )}

              {/* Grammar Correction Box */}
              {msg.correction && (
                <div className="p-3 bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 rounded-2xl text-xs space-y-1 animate-mochi-pop">
                  <div className="font-extrabold text-purple-900 dark:text-purple-200 flex items-center gap-1.5">
                    <Lightbulb className="w-3.5 h-3.5 text-purple-600" />
                    <span>Góp ý ngữ pháp từ Thầy Gojo:</span>
                  </div>
                  <div className="text-purple-800 dark:text-purple-300">
                    👉 Nên dùng: <strong className="underline">{msg.correction}</strong>
                  </div>
                  {msg.tip && (
                    <div className="text-[11px] text-purple-600 dark:text-purple-400 italic">
                      💡 {msg.tip}
                    </div>
                  )}
                </div>
              )}

              {/* Detailed AI Answer Evaluation & Band Feedback */}
              {msg.evaluation && (
                <div className="p-3.5 bg-linear-to-r from-amber-50 to-orange-50 dark:from-slate-800/90 dark:to-slate-800/90 border border-amber-300/80 dark:border-amber-700/60 rounded-2xl text-xs space-y-2 animate-mochi-pop">
                  <div className="flex items-center justify-between border-b border-amber-200 dark:border-slate-700 pb-1.5">
                    <div className="font-black text-amber-900 dark:text-amber-200 flex items-center gap-1.5 text-xs">
                      <Award className="w-4 h-4 text-amber-500" />
                      <span>Nhận Xét Câu Trả Lời Vừa Rồi:</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-lg bg-amber-500 text-slate-900 font-black text-[10px]">
                      {msg.evaluation.estimatedBand}
                    </span>
                  </div>

                  <p className="text-slate-700 dark:text-slate-300 font-semibold leading-relaxed">
                    💡 {msg.evaluation.summary}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 pt-1 text-[11px]">
                    <div className="p-2 bg-white/80 dark:bg-slate-900/60 rounded-xl border border-amber-200/60 dark:border-slate-700">
                      <div className="font-bold text-amber-800 dark:text-amber-300">🗣️ Trôi chảy:</div>
                      <div className="text-slate-600 dark:text-slate-400 mt-0.5">{msg.evaluation.fluencyFeedback}</div>
                    </div>
                    <div className="p-2 bg-white/80 dark:bg-slate-900/60 rounded-xl border border-amber-200/60 dark:border-slate-700">
                      <div className="font-bold text-amber-800 dark:text-amber-300">📖 Từ vựng:</div>
                      <div className="text-slate-600 dark:text-slate-400 mt-0.5">{msg.evaluation.vocabFeedback}</div>
                    </div>
                    <div className="p-2 bg-white/80 dark:bg-slate-900/60 rounded-xl border border-amber-200/60 dark:border-slate-700">
                      <div className="font-bold text-amber-800 dark:text-amber-300">✍️ Ngữ pháp:</div>
                      <div className="text-slate-600 dark:text-slate-400 mt-0.5">{msg.evaluation.grammarFeedback}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {msg.sender === 'user' && (
              <div className="w-9 h-9 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
                Tôi
              </div>
            )}
          </div>
        ))}

        {/* AI Typing Indicator */}
        {isThinking && (
          <div className="flex gap-3 justify-start animate-fadeIn">
            <div className="w-9 h-9 rounded-2xl overflow-hidden border-2 border-blue-400 shrink-0 shadow-xs flex items-center justify-center bg-linear-to-tr from-blue-600 to-indigo-700 text-white font-black text-lg">
              {selectedScenario.id === 'gemini-free-chat' ? (
                <span>💎</span>
              ) : (
                <img src="/gojo.png" alt="Gojo AI" className="w-full h-full object-cover" />
              )}
            </div>
            <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-3xl rounded-tl-xs border border-slate-200 dark:border-slate-700 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" />
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.2s]" />
              <span className="w-2 h-2 rounded-full bg-purple-500 animate-bounce [animation-delay:0.4s]" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompts */}
      {suggestedPrompts.length > 0 && !isThinking && (
        <div className="px-4 py-2 bg-slate-50/80 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 overflow-x-auto select-none">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 shrink-0">
            💡 Gợi ý câu trả lời mẫu:
          </span>
          {suggestedPrompts.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(prompt)}
              className="px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-amber-300 rounded-xl text-xs font-semibold whitespace-nowrap transition-all shadow-2xs shrink-0 cursor-pointer"
            >
              {prompt}
            </button>
          ))}
        </div>
      )}

      {/* 5-Minute Continuous Speech Active Banner */}
      {isListening && (
        <div className="p-3.5 bg-rose-50 dark:bg-rose-950/80 border-t-2 border-rose-300 dark:border-rose-700 animate-fadeIn space-y-2.5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-500 animate-ping" />
              <span className="text-xs font-black text-rose-700 dark:text-rose-300">
                🎙️ ĐANG GHI ÂM LIÊN TỤC (TỐI ĐA 5 PHÚT)
              </span>
            </div>

            <div className="flex items-center gap-2 font-mono font-black text-xs px-2.5 py-1 bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-600 dark:text-rose-400">
              <span>⏱️ {formatTimer(recordingSecondsElapsed)} / 05:00</span>
            </div>
          </div>

          {/* Live spoken preview */}
          <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-rose-200 dark:border-rose-800 text-xs text-slate-800 dark:text-slate-100 font-semibold leading-relaxed min-h-[38px] max-h-24 overflow-y-auto">
            {inputText.trim() ? (
              <span>&ldquo;{inputText}&rdquo;</span>
            ) : (
              <span className="text-slate-400 italic">Hãy bắt đầu phát âm câu trả lời của bạn, máy sẽ ghi nhận liên tục không lo bị ngắt...</span>
            )}
          </div>

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={handleCancelListening}
              className="px-3 py-1.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Hủy Thu Âm
            </button>
            <button
              type="button"
              onClick={handleToggleListening}
              className="px-4 py-1.5 bg-linear-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl text-xs font-black shadow-md transition-all hover:scale-105 active:scale-95 flex items-center gap-1.5 cursor-pointer"
            >
              <span>⏹️ Hoàn Thành & Gửi Bài Nói</span>
            </button>
          </div>
        </div>
      )}

      {/* Chat Input Bar */}
      <div className="p-3 sm:p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          {/* Microphone Speaking Button */}
          <button
            type="button"
            onClick={handleToggleListening}
            title={isListening ? 'Bấm để dừng và gửi bài nói' : 'Bấm để bắt đầu thu âm liên tục 5 phút'}
            className={`p-3 sm:px-4 rounded-2xl font-black text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer ${
              isListening
                ? 'bg-rose-500 text-white animate-pulse ring-4 ring-rose-300'
                : 'bg-linear-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white hover:scale-105 active:scale-95'
            }`}
          >
            <Mic className="w-5 h-5" />
            <span className="hidden sm:inline font-bold">
              {isListening ? '⏹️ Xong' : '🎙️ Nói (5 Phút)'}
            </span>
          </button>

          {/* Text Input */}
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={
              isListening
                ? '🎙️ Đang lắng nghe... Nói tự do đến 5 phút rồi bấm Xong!'
                : 'Nhập tin nhắn hoặc bấm Micro để nói (tối đa 5 phút)...'
            }
            disabled={isThinking}
            className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs sm:text-sm font-semibold focus:outline-hidden focus:border-amber-500 text-slate-800 dark:text-slate-100 placeholder-slate-400"
          />

          {/* Send Button */}
          <button
            type="submit"
            disabled={!inputText.trim() || isThinking}
            className="p-3 bg-linear-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 disabled:opacity-40 text-white rounded-2xl shadow-md transition-transform hover:scale-105 active:scale-95 cursor-pointer"
          >
            <Send className="w-5 h-5" />
          </button>

          {/* Reset Room Button */}
          <button
            type="button"
            onClick={handleResetConversation}
            title="Bắt đầu lại cuộc hội thoại"
            className="p-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-500 dark:text-slate-300 rounded-2xl transition-colors cursor-pointer"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        </form>
      </div>

      {/* Key Vocab & Model Answers Modal */}
      {showKeyVocabModal && selectedScenario && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{selectedScenario.icon}</span>
                <h3 className="font-black text-base text-slate-900 dark:text-white">
                  Từ Vựng & Collocations Khuyên Dùng
                </h3>
              </div>
              <button
                onClick={() => setShowKeyVocabModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-white flex items-center justify-center font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Hãy sử dụng các từ vựng và cụm từ Band 7.5 - 9.0 này trong bài nói để ghi điểm tối đa với Thầy Gojo:
              </p>

              <div className="flex items-center gap-1.5 flex-wrap pt-2">
                {selectedScenario.keyVocab?.map((v, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200 font-black rounded-xl text-xs border border-amber-300"
                  >
                    ✨ {v}
                  </span>
                ))}
              </div>
            </div>

            <button
              onClick={() => setShowKeyVocabModal(false)}
              className="w-full py-3 bg-linear-to-r from-amber-500 to-orange-500 text-white font-black rounded-2xl shadow-md cursor-pointer text-xs"
            >
              Đã Hiểu, Quay Lại Luyện Nói
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
