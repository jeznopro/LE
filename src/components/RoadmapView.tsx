import React, { useState } from 'react';
import { Card, RoadmapChapter, RoadmapNode, SpeakingRoadmapProfile, StudyMode, UserSettings } from '../types';
import {
  getActiveRoadmapProfile,
  getPresetRoadmapProfiles,
  getCustomRoadmapProfiles,
  setActiveRoadmapProfileId,
  generateAISpeakingRoadmap,
  deleteCustomRoadmapProfile,
  markNodeComplete,
} from '../utils/roadmapData';
import { soundManager } from '../utils/sounds';
import { ttsService } from '../utils/tts';
import {
  Sparkles,
  Star,
  Lock,
  Layers,
  Mic,
  ListOrdered,
  Keyboard,
  Volume2,
  BookOpen,
  HelpCircle,
  Plus,
  Compass,
  Trash2,
  Check,
  ChevronDown,
  Wand2,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface RoadmapViewProps {
  settings: UserSettings;
  onStartStudy: (cards: Card[], title: string, mode: StudyMode, nodeId?: string) => void;
  onRewardXP: (xp: number) => void;
}

export const RoadmapView: React.FC<RoadmapViewProps> = ({
  settings,
  onStartStudy,
  onRewardXP,
}) => {
  const [activeProfile, setActiveProfile] = useState<SpeakingRoadmapProfile>(getActiveRoadmapProfile());
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [customGoalInput, setCustomGoalInput] = useState('');
  const [customBandInput, setCustomBandInput] = useState('Band 7.5+');
  const [isGenerating, setIsGenerating] = useState(false);

  const [selectedNode, setSelectedNode] = useState<RoadmapNode | null>(null);
  const [activePartFilter, setActivePartFilter] = useState<'all' | 'Part 1' | 'Part 2' | 'Part 3'>('all');
  const [openedChestId, setOpenedChestId] = useState<string | null>(null);
  const [activeTabInModal, setActiveTabInModal] = useState<'vocab' | 'questions'>('vocab');

  const allPresetProfiles = getPresetRoadmapProfiles();
  const allCustomProfiles = getCustomRoadmapProfiles();
  const chapters = activeProfile.chapters;

  const refreshProfile = () => {
    setActiveProfile(getActiveRoadmapProfile());
  };

  const handleSwitchProfile = (profileId: string) => {
    soundManager.playClick();
    setActiveRoadmapProfileId(profileId);
    setActiveProfile(getActiveRoadmapProfile());
    setIsProfileDropdownOpen(false);
  };

  const handleCreateCustomRoadmap = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customGoalInput.trim()) return;

    setIsGenerating(true);
    soundManager.playClick();

    setTimeout(() => {
      const created = generateAISpeakingRoadmap(customGoalInput, customBandInput);
      setActiveProfile(created);
      setIsGenerating(false);
      setIsCreateModalOpen(false);
      setCustomGoalInput('');
      soundManager.playVictory();
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
    }, 600);
  };

  const handleDeleteProfile = (profileId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Bạn có chắc muốn xóa lộ trình tự thiết kế này?')) {
      deleteCustomRoadmapProfile(profileId);
      refreshProfile();
    }
  };

  const allNodes = chapters.flatMap((c) => c.nodes);
  const totalStars = allNodes.reduce((sum, n) => sum + (n.stars || 0), 0);
  const maxStars = allNodes.filter((n) => n.type !== 'chest').length * 3;
  const completedNodesCount = allNodes.filter((n) => n.isCompleted).length;

  const activeNode = allNodes.find((n) => n.isUnlocked && !n.isCompleted) || allNodes[0];

  const filteredChapters = chapters.filter(
    (c) => activePartFilter === 'all' || c.part === activePartFilter
  );

  const handleNodeClick = (node: RoadmapNode) => {
    if (!node.isUnlocked) {
      soundManager.playWrong();
      return;
    }

    soundManager.playClick();

    if (node.type === 'chest') {
      if (!node.isCompleted) {
        soundManager.playVictory();
        confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
        markNodeComplete(node.id, 3);
        onRewardXP(node.xpReward);
        setOpenedChestId(node.id);
        refreshProfile();
      }
      return;
    }

    setSelectedNode(node);
    setActiveTabInModal(node.cueCardPrompt || (node.questions && node.questions.length > 0) ? 'questions' : 'vocab');
  };

  const handleStartNodeStudy = (mode: StudyMode) => {
    if (!selectedNode) return;
    soundManager.playClick();
    const targetCards = selectedNode.cards;
    const title = `${selectedNode.part}: ${selectedNode.title}`;
    const nodeId = selectedNode.id;
    setSelectedNode(null);
    onStartStudy(targetCards, title, mode, nodeId);
  };

  const playTTS = (text: string) => {
    ttsService.speak(text, settings.ttsAccent, settings.ttsSpeed);
  };

  // Serpentine S-curve pattern
  const getWindingOffsetClass = (index: number) => {
    const pattern = [
      'translate-x-0',
      '-translate-x-12 sm:-translate-x-16',
      '-translate-x-6 sm:-translate-x-8',
      'translate-x-12 sm:translate-x-16',
      'translate-x-6 sm:translate-x-8',
      'translate-x-0',
    ];
    return pattern[index % pattern.length];
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-8 pb-20 animate-fadeIn">
      
      {/* Top Header Card with Roadmap Profile Switcher & AI Creator */}
      <div className="bg-white/95 dark:bg-slate-900/90 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm backdrop-blur-md space-y-4 sticky top-16 z-20">
        
        {/* Active Roadmap Profile Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative">
            <button
              onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
              className="flex items-center gap-2.5 px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-2xl transition-all text-left cursor-pointer border border-slate-200 dark:border-slate-700 shadow-2xs"
            >
              <span className="text-2xl">{activeProfile.icon}</span>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-black text-sm text-slate-900 dark:text-white">
                    {activeProfile.name}
                  </span>
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                </div>
                <div className="text-[11px] font-bold text-amber-600 dark:text-amber-400">
                  {activeProfile.targetBand} {activeProfile.isCustom && '• Tự Thiết Kế'}
                </div>
              </div>
            </button>

            {/* Profile Dropdown Drawer */}
            {isProfileDropdownOpen && (
              <div className="absolute left-0 top-full mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-3 z-30 space-y-2 animate-scaleUp">
                <div className="text-[10px] font-black uppercase text-slate-400 px-2">
                  Chọn Lộ Trình Luyện Nói:
                </div>

                <div className="space-y-1 max-h-60 overflow-y-auto">
                  {/* Preset Roadmaps */}
                  {allPresetProfiles.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => handleSwitchProfile(p.id)}
                      className={`p-2.5 rounded-2xl flex items-center justify-between cursor-pointer transition-all ${
                        activeProfile.id === p.id
                          ? 'bg-amber-50 dark:bg-amber-950/60 border border-amber-300'
                          : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-xl">{p.icon}</span>
                        <div>
                          <div className="font-extrabold text-xs text-slate-800 dark:text-slate-100">
                            {p.name}
                          </div>
                          <div className="text-[10px] text-slate-400 font-medium">
                            {p.targetBand}
                          </div>
                        </div>
                      </div>
                      {activeProfile.id === p.id && <Check className="w-4 h-4 text-amber-600" />}
                    </div>
                  ))}

                  {/* Custom Roadmaps */}
                  {allCustomProfiles.length > 0 && (
                    <>
                      <div className="text-[10px] font-black uppercase text-slate-400 px-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                        Lộ Trình Của Bạn:
                      </div>
                      {allCustomProfiles.map((p) => (
                        <div
                          key={p.id}
                          onClick={() => handleSwitchProfile(p.id)}
                          className={`p-2.5 rounded-2xl flex items-center justify-between cursor-pointer transition-all ${
                            activeProfile.id === p.id
                              ? 'bg-amber-50 dark:bg-amber-950/60 border border-amber-300'
                              : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="text-xl">{p.icon}</span>
                            <div>
                              <div className="font-extrabold text-xs text-slate-800 dark:text-slate-100">
                                {p.name}
                              </div>
                              <div className="text-[10px] text-amber-600 font-bold">
                                {p.targetBand}
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={(e) => handleDeleteProfile(p.id, e)}
                            className="p-1 hover:text-rose-500 text-slate-400"
                            title="Xóa lộ trình này"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </>
                  )}
                </div>

                {/* Create Custom Roadmap Button in Dropdown */}
                <button
                  onClick={() => {
                    setIsProfileDropdownOpen(false);
                    setIsCreateModalOpen(true);
                  }}
                  className="w-full py-2.5 px-3 bg-linear-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tự Thiết Kế Lộ Trình Nói Mới</span>
                </button>
              </div>
            )}
          </div>

          {/* Quick Action Button & Star Counter */}
          <div className="flex items-center gap-2 self-end sm:self-center">
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-3.5 py-2 bg-linear-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-2xl font-black text-xs flex items-center gap-1.5 shadow-sm transition-transform hover:scale-105 active:scale-95 cursor-pointer"
            >
              <Wand2 className="w-3.5 h-3.5" />
              <span>Thiết Kế Lộ Trình</span>
            </button>

            <div className="flex items-center gap-1.5 px-3 py-2 bg-amber-50 dark:bg-slate-800 border border-amber-300 dark:border-slate-700 rounded-2xl shadow-2xs">
              <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
              <span className="font-black text-xs text-amber-700 dark:text-amber-300">
                {totalStars}/{maxStars} ⭐
              </span>
            </div>
          </div>
        </div>

        {/* IELTS Part Switcher Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {[
            { id: 'all', label: 'Tất Cả Chặng' },
            { id: 'Part 1', label: 'Part 1 (Khởi Động)' },
            { id: 'Part 2', label: 'Part 2 (Thuyết Trình)' },
            { id: 'Part 3', label: 'Part 3 (Tranh Luận Sâu)' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                soundManager.playClick();
                setActivePartFilter(tab.id as any);
              }}
              className={`px-3.5 py-1.5 rounded-xl font-extrabold text-xs shrink-0 transition-all cursor-pointer ${
                activePartFilter === tab.id
                  ? 'bg-linear-to-r from-amber-500 to-orange-500 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chapters & Winding Path */}
      <div className="space-y-12">
        {filteredChapters.map((chapter) => (
          <div key={chapter.id} className="space-y-6">
            
            {/* Chapter Header Banner */}
            <div className="text-center space-y-1.5 py-5 px-6 bg-linear-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-3xl shadow-md relative overflow-hidden border border-slate-700">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />
              <div className="flex items-center justify-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-amber-500 text-slate-900">
                  {chapter.band}
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black tracking-tight">
                {chapter.title}
              </h2>
              <p className="text-xs text-slate-300 font-medium">
                {chapter.subtitle}
              </p>
            </div>

            {/* Winding Nodes Column */}
            <div className="flex flex-col items-center py-4 relative space-y-8">
              
              {chapter.nodes.map((node, idx) => {
                const isCurrentActive = node.id === activeNode?.id;
                const offsetClass = getWindingOffsetClass(idx);

                return (
                  <div key={node.id} className={`relative flex flex-col items-center ${offsetClass} transition-transform`}>
                    
                    {/* Floating Gojo Examiner above active node */}
                    {isCurrentActive && (
                      <div className="absolute -top-16 z-20 animate-mochi-float flex flex-col items-center pointer-events-none">
                        <div className="px-2.5 py-1 bg-amber-400 text-amber-950 text-[10px] font-black rounded-full shadow-md border border-white whitespace-nowrap mb-1 flex items-center gap-1">
                          <span>Thầy Gojo chờ bạn!</span> 🕶️
                        </div>
                        <img
                          src="/gojo.png"
                          alt="Gojo Active Marker"
                          className="w-12 h-12 rounded-2xl object-cover border-2 border-white shadow-xl ring-4 ring-amber-400/50"
                        />
                      </div>
                    )}

                    {/* Node Button */}
                    <button
                      onClick={() => handleNodeClick(node)}
                      title={node.title}
                      className={`w-20 h-20 sm:w-24 sm:h-24 rounded-3xl flex flex-col items-center justify-center transition-all relative group cursor-pointer ${
                        !node.isUnlocked
                          ? 'bg-slate-200 dark:bg-slate-800/80 border-2 border-slate-300 dark:border-slate-700 opacity-60 text-slate-400 shadow-xs'
                          : node.isCompleted
                          ? 'bg-linear-to-tr from-amber-400 via-yellow-400 to-amber-500 border-4 border-amber-300 dark:border-amber-400 text-amber-950 shadow-lg shadow-amber-500/25 hover:scale-110 active:scale-95'
                          : isCurrentActive
                          ? 'bg-linear-to-tr from-cyan-500 via-blue-500 to-indigo-600 border-4 border-cyan-300 text-white shadow-xl shadow-cyan-500/35 animate-pulse hover:scale-110 active:scale-95 ring-4 ring-cyan-400/40'
                          : 'bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-100 shadow-md hover:scale-105 active:scale-95'
                      }`}
                    >
                      {/* Icon */}
                      <span className="text-2xl sm:text-3xl filter drop-shadow-xs">
                        {node.icon}
                      </span>

                      {/* Locked Overlay */}
                      {!node.isUnlocked && (
                        <div className="absolute inset-0 bg-slate-900/30 dark:bg-slate-950/60 rounded-3xl flex items-center justify-center backdrop-blur-2xs">
                          <Lock className="w-6 h-6 text-slate-300" />
                        </div>
                      )}

                      {/* Stars for Completed Nodes */}
                      {node.isCompleted && node.type !== 'chest' && (
                        <div className="absolute -bottom-2.5 flex items-center gap-0.5 px-2 py-0.5 bg-slate-900 text-amber-300 rounded-full text-[10px] font-black shadow-md border border-amber-400">
                          <Star className="w-2.5 h-2.5 fill-amber-400" />
                          <Star className="w-2.5 h-2.5 fill-amber-400" />
                          <Star className="w-2.5 h-2.5 fill-amber-400" />
                        </div>
                      )}

                      {/* Chest Opened Tag */}
                      {node.type === 'chest' && node.isCompleted && (
                        <div className="absolute -bottom-2 bg-emerald-600 text-white px-2 py-0.5 rounded-full text-[9px] font-black shadow-xs">
                          ĐÃ NHẬN
                        </div>
                      )}
                    </button>

                    {/* Node Title & Target Band Label */}
                    <div className="mt-2 text-center max-w-[150px]">
                      <div className="font-extrabold text-xs text-slate-800 dark:text-slate-200 line-clamp-1">
                        {node.title}
                      </div>
                      <div className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
                        {node.targetBand}
                      </div>
                    </div>

                  </div>
                );
              })}

            </div>
          </div>
        ))}
      </div>

      {/* IELTS Speaking Topic & Questions Modal */}
      {selectedNode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 animate-scaleUp relative max-h-[90vh] overflow-y-auto">
            
            {/* Header */}
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700 flex items-center justify-center text-3xl shadow-xs">
                  {selectedNode.icon}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-300">
                      {selectedNode.part}
                    </span>
                    <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                      🎯 {selectedNode.targetBand}
                    </span>
                  </div>
                  <h3 className="font-black text-lg text-slate-900 dark:text-white mt-0.5">
                    {selectedNode.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                    {selectedNode.subtitle}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedNode(null)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white flex items-center justify-center font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Subtabs */}
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl">
              <button
                onClick={() => setActiveTabInModal('questions')}
                className={`flex-1 py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeTabInModal === 'questions'
                    ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-300 shadow-xs'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Câu Hỏi & Bài Mẫu</span>
              </button>
              <button
                onClick={() => setActiveTabInModal('vocab')}
                className={`flex-1 py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeTabInModal === 'vocab'
                    ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-300 shadow-xs'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Từ Vựng & Collocations ({selectedNode.cards.length})</span>
              </button>
            </div>

            {/* Tab 1: Questions & Model Answers */}
            {activeTabInModal === 'questions' && (
              <div className="space-y-3">
                {selectedNode.cueCardPrompt && (
                  <div className="p-3.5 bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700 rounded-2xl text-xs space-y-1.5">
                    <div className="font-black text-amber-900 dark:text-amber-200 flex items-center gap-1">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      <span>Speaking Topic Prompt:</span>
                    </div>
                    <p className="text-slate-800 dark:text-slate-200 font-semibold leading-relaxed">
                      {selectedNode.cueCardPrompt}
                    </p>
                  </div>
                )}

                {selectedNode.questions && selectedNode.questions.map((q, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-slate-50 dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2 text-xs"
                  >
                    <div className="font-extrabold text-slate-800 dark:text-slate-100 flex items-start justify-between gap-2">
                      <span>Q{idx + 1}: {q.question}</span>
                      <button
                        onClick={() => playTTS(q.sampleAnswer)}
                        title="Nghe phát âm câu trả lời mẫu chuẩn"
                        className="p-1 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-950 rounded-lg shrink-0 cursor-pointer"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                      💡 <strong>Câu Trả Lời Mẫu:</strong> &ldquo;{q.sampleAnswer}&rdquo;
                    </div>

                    {q.keyVocab && q.keyVocab.length > 0 && (
                      <div className="flex items-center gap-1 flex-wrap pt-0.5">
                        <span className="text-[10px] font-black text-slate-400">Key Vocab:</span>
                        {q.keyVocab.map((v, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 rounded-md text-[10px] font-bold"
                          >
                            {v}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Tab 2: High-Scoring Vocabulary Cards List */}
            {activeTabInModal === 'vocab' && (
              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                {selectedNode.cards.map((card, i) => (
                  <div
                    key={card.id}
                    className="p-2.5 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200/80 dark:border-slate-700 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-black text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                        <span>{i + 1}. {card.front}</span>
                        {card.partOfSpeech && (
                          <span className="text-[10px] px-1.5 py-0.2 bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 rounded-md font-bold">
                            {card.partOfSpeech}
                          </span>
                        )}
                      </div>
                      {card.phonetic && (
                        <div className="font-mono text-[10px] text-slate-400 font-normal">
                          {card.phonetic}
                        </div>
                      )}
                    </div>
                    <div className="font-bold text-amber-700 dark:text-amber-300 text-right">
                      {card.back}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Action Study Mode Options */}
            <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <div className="text-[11px] font-black uppercase text-slate-400 mb-1.5">
                Chọn chế độ luyện nói & từ vựng:
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleStartNodeStudy('speaking')}
                  className="p-3 bg-linear-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-black text-xs rounded-2xl shadow-md transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer col-span-2 sm:col-span-1"
                >
                  <Mic className="w-4 h-4" />
                  <span>Luyện Nói & Chấm Điểm AI</span>
                </button>

                <button
                  onClick={() => handleStartNodeStudy('flashcard')}
                  className="p-3 bg-linear-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black text-xs rounded-2xl shadow-md transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer col-span-2 sm:col-span-1"
                >
                  <Layers className="w-4 h-4" />
                  <span>Lật Thẻ Từ Vựng SRS</span>
                </button>

                <button
                  onClick={() => handleStartNodeStudy('typing')}
                  className="p-3 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs rounded-2xl shadow-md transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Keyboard className="w-4 h-4" />
                  <span>Luyện Gõ Mẫu Câu</span>
                </button>

                <button
                  onClick={() => handleStartNodeStudy('quiz')}
                  className="p-3 bg-purple-500 hover:bg-purple-600 text-white font-black text-xs rounded-2xl shadow-md transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <ListOrdered className="w-4 h-4" />
                  <span>Trắc Nghiệm Phản Xạ</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* AI Custom Speaking Roadmap Creator Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 animate-scaleUp">
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2.5 bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 rounded-2xl text-xl">
                  ✨
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900 dark:text-white">
                    Tự Thiết Kế Lộ Trình Nói Riêng
                  </h3>
                  <p className="text-xs text-slate-400 font-medium">
                    AI tự động lập dàn ý Part 1, 2, 3 và từ vựng theo mục tiêu của bạn
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-white flex items-center justify-center font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCustomRoadmap} className="space-y-3.5">
              <div>
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1">
                  Chủ Đề Hoặc Mục Tiêu Của Bạn:
                </label>
                <input
                  type="text"
                  required
                  value={customGoalInput}
                  onChange={(e) => setCustomGoalInput(e.target.value)}
                  placeholder="VD: Tiếng Anh IT & Phỏng Vấn Tech, Du Học Úc, v.v."
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl text-xs font-semibold focus:outline-hidden focus:border-amber-500 text-slate-800 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1">
                  Trình Độ Mục Tiêu:
                </label>
                <select
                  value={customBandInput}
                  onChange={(e) => setCustomBandInput(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-800 dark:text-slate-100"
                >
                  <option value="Band 6.5 - 7.0">Band 6.5 - 7.0 (Khá & Tự Tin)</option>
                  <option value="Band 7.5 - 8.0+">Band 7.5 - 8.0+ (Chuyên Sâu & Lưu Loát)</option>
                  <option value="Band 8.5 - 9.0">Band 8.5 - 9.0 (Bản Xứ / Grandmaster)</option>
                  <option value="B2 Intermediate">B2 Giao Tiếp Đời Sống</option>
                  <option value="C1 Professional">C1 Công Sở & Doanh Nghiệp</option>
                </select>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={!customGoalInput.trim() || isGenerating}
                  className="w-full py-3.5 bg-linear-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 disabled:opacity-50 text-white font-black text-sm rounded-2xl shadow-lg transition-transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isGenerating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>AI Đang Thiết Kế Lộ Trình...</span>
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4" />
                      <span>Tạo Lộ Trình Nói Ngay 🚀</span>
                    </>
                  )}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* Opened Chest Popup */}
      {openedChestId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full p-6 text-center border border-amber-300 shadow-2xl space-y-4 animate-mochi-pop">
            <div className="text-5xl animate-bounce">🎁</div>
            <h3 className="text-2xl font-black text-amber-600 dark:text-amber-400">
              Mở Khóa Rương Band Booster!
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-300 font-bold">
              Chúc mừng bạn nhận được phần thưởng đặc biệt:
            </p>
            <div className="p-3 bg-amber-50 dark:bg-amber-950/60 rounded-2xl border border-amber-300 text-amber-700 dark:text-amber-300 font-black text-xl flex items-center justify-center gap-2">
              <Sparkles className="w-5 h-5 fill-amber-500" /> +50 XP
            </div>
            <button
              onClick={() => setOpenedChestId(null)}
              className="w-full py-3 bg-linear-to-r from-amber-500 to-orange-500 text-white font-black rounded-2xl shadow-md cursor-pointer"
            >
              Thu Nhận Phần Thưởng
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
