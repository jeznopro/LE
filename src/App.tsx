import React, { useState, useEffect } from 'react';
import { Card, Deck, MemoryLevel, StudyMode, UserSettings, UserStats, UserAccount } from './types';
import { storage } from './utils/storage';
import { soundManager } from './utils/sounds';
import { isCardDue } from './utils/srs';
import { Navbar } from './components/Navbar';
import { GoldenTimeWidget } from './components/GoldenTimeWidget';
import { DeckList } from './components/DeckList';
import { DeckDetail } from './components/DeckDetail';
import { FlashcardStudy } from './components/FlashcardStudy';
import { QuizStudy } from './components/QuizStudy';
import { TypingStudy } from './components/TypingStudy';
import { SpeakingStudy } from './components/SpeakingStudy';
import { AIConversation } from './components/AIConversation';
import { MochiStudyView } from './components/MochiStudyView';
import { DeckImporterModal } from './components/DeckImporterModal';
import { DeckModal } from './components/DeckModal';
import { AddCardModal } from './components/AddCardModal';
import { StatsModal } from './components/StatsModal';
import { SettingsModal } from './components/SettingsModal';
import { AnimatedBackground } from './components/AnimatedBackground';
import { YouTubeBackground } from './components/YouTubeBackground';
import { AuthModal } from './components/AuthModal';
import { WelcomeLoginScreen } from './components/WelcomeLoginScreen';
import { GeminiFloatingWindow } from './components/GeminiFloatingWindow';
import { supabase, isSupabaseConfigured } from './utils/supabase';
import { cloudSync } from './utils/cloudSync';
import { Heart } from 'lucide-react';

type ViewMode = 'dashboard' | 'deck-detail' | 'study-flashcard' | 'study-quiz' | 'study-typing' | 'study-speaking' | 'study-mochi' | 'ai-chat';

export function App() {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [stats, setStats] = useState<UserStats>(storage.getStats());
  const [settings, setSettings] = useState<UserSettings>(storage.getSettings());
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(storage.getCurrentUser());
  const [isGeminiWindowOpen, setIsGeminiWindowOpen] = useState(false);

  // Views & Navigation
  const [currentView, setCurrentView] = useState<ViewMode>('dashboard');
  const [activeDeckId, setActiveDeckId] = useState<string | null>(null);
  const [studyCards, setStudyCards] = useState<Card[]>([]);
  const [studyDeckTitle, setStudyDeckTitle] = useState('');

  // Modals
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isImporterOpen, setIsImporterOpen] = useState(false);
  const [isDeckModalOpen, setIsDeckModalOpen] = useState(false);
  const [editingDeck, setEditingDeck] = useState<Deck | null>(null);
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<Card | null>(null);
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Load initial data on mount
  useEffect(() => {
    const loadedDecks = storage.getDecks();
    const loadedCards = storage.getCards();
    let loadedStats = storage.getStats();
    const loadedSettings = storage.getSettings();
    const loadedUser = storage.getCurrentUser();

    // Auto clean reset to 0 if legacy mock stats exist
    if (loadedStats.xp === 350 && loadedStats.streak === 3 && loadedStats.totalReviews === 42) {
      loadedStats = storage.resetStatsToZero();
    }

    setDecks(loadedDecks);
    setCards(loadedCards);
    setStats(loadedStats);
    setSettings(loadedSettings);
    setCurrentUser(loadedUser);
    soundManager.setEnabled(loadedSettings.soundEffects);
  }, []);

  // Listen to Supabase Cloud Authentication (like Facebook / Google)
  useEffect(() => {
    if (!isSupabaseConfigured) return;

    // Check existing cloud session on boot
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const user = session.user;
        const userAcc: UserAccount = {
          id: user.id,
          username: user.user_metadata?.username || user.user_metadata?.full_name || user.email?.split('@')[0] || 'Học Viên',
          avatar: user.user_metadata?.avatar || user.user_metadata?.avatar_url || '/gojo.png',
          email: user.email,
          createdAt: new Date(user.created_at).getTime(),
        };
        setCurrentUser(userAcc);
        storage.setCurrentUser(userAcc);

        // Sync user cards from cloud
        const cloudCards = await cloudSync.fetchUserCards(user.id);
        if (cloudCards && cloudCards.length > 0) {
          setCards(cloudCards);
          storage.saveCards(cloudCards);
        } else {
          // New cloud user: seed initial cards to cloud
          const currentCards = storage.getCards();
          cloudSync.saveAllCards(user.id, currentCards);
        }

        const cloudStats = await cloudSync.fetchUserStats(user.id);
        if (cloudStats) {
          setStats(cloudStats);
          storage.saveStats(cloudStats);
        } else {
          cloudSync.saveUserStats(user.id, storage.getStats());
        }

        const cloudDecks = await cloudSync.fetchUserDecks(user.id);
        if (cloudDecks && cloudDecks.length > 0) {
          setDecks(cloudDecks);
          storage.saveDecks(cloudDecks);
        } else {
          cloudSync.saveAllDecks(user.id, storage.getDecks());
        }
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const user = session.user;
        const userAcc: UserAccount = {
          id: user.id,
          username: user.user_metadata?.username || user.user_metadata?.full_name || user.email?.split('@')[0] || 'Học Viên',
          avatar: user.user_metadata?.avatar || user.user_metadata?.avatar_url || '/gojo.png',
          email: user.email,
          createdAt: new Date(user.created_at).getTime(),
        };
        setCurrentUser(userAcc);
        storage.setCurrentUser(userAcc);

        const cloudCards = await cloudSync.fetchUserCards(user.id);
        if (cloudCards && cloudCards.length > 0) {
          setCards(cloudCards);
          storage.saveCards(cloudCards);
        } else {
          cloudSync.saveAllCards(user.id, storage.getCards());
        }

        const cloudStats = await cloudSync.fetchUserStats(user.id);
        if (cloudStats) {
          setStats(cloudStats);
          storage.saveStats(cloudStats);
        }

        const cloudDecks = await cloudSync.fetchUserDecks(user.id);
        if (cloudDecks && cloudDecks.length > 0) {
          setDecks(cloudDecks);
          storage.saveDecks(cloudDecks);
        }
      } else if (event === 'SIGNED_OUT') {
        setCurrentUser(null);
        storage.setCurrentUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const updateDecks = (newDecks: Deck[]) => {
    setDecks(newDecks);
    storage.saveDecks(newDecks);
    if (currentUser) {
      cloudSync.saveAllDecks(currentUser.id, newDecks);
    }
  };

  const updateCards = (newCards: Card[]) => {
    setCards(newCards);
    storage.saveCards(newCards);
    if (currentUser) {
      cloudSync.saveAllCards(currentUser.id, newCards);
    }
  };

  const updateSettings = (newSettings: UserSettings) => {
    setSettings(newSettings);
    storage.saveSettings(newSettings);
    soundManager.setEnabled(newSettings.soundEffects);
  };

  // Apply dark mode class to root HTML
  useEffect(() => {
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.theme]);

  // Start study session for a deck
  const handleStartStudy = (deckId: string, mode: StudyMode) => {
    soundManager.playClick();
    const deck = decks.find((d) => d.id === deckId);
    if (!deck) return;

    let targetCards = cards.filter((c) => c.deckId === deckId);
    if (targetCards.length === 0) return;

    if (mode === 'flashcard') {
      const due = targetCards.filter(isCardDue);
      if (due.length > 0) {
        targetCards = due;
      }
    }

    setStudyCards(targetCards);
    setStudyDeckTitle(deck.title);
    setActiveDeckId(deckId);

    if (mode === 'mochi') setCurrentView('study-mochi');
    else if (mode === 'flashcard') setCurrentView('study-flashcard');
    else if (mode === 'quiz') setCurrentView('study-quiz');
    else if (mode === 'typing') setCurrentView('study-typing');
    else if (mode === 'speaking') setCurrentView('study-speaking');
  };

  // Golden time: Review all due cards across all decks
  const handleReviewAllDueCards = () => {
    soundManager.playClick();
    const dueCards = cards.filter(isCardDue);
    if (dueCards.length === 0) return;

    setStudyCards(dueCards);
    setStudyDeckTitle('Thời Điểm Vàng - Tất Cả Từ Cần Ôn');
    setActiveDeckId(null);
    setCurrentView('study-flashcard');
  };

  // Review cards by specific memory level
  const handleReviewLevel = (level: MemoryLevel) => {
    soundManager.playClick();
    // Only get cards that actually belong to this level (exclude unlearned cards with level === 0 or undefined)
    const lvlCards = cards.filter((c) => c.level === level);
    if (lvlCards.length === 0) return;

    setStudyCards(lvlCards);
    setStudyDeckTitle(`Ôn Tập Cấp Độ ${level}`);
    setActiveDeckId(null);
    setCurrentView('study-mochi');
  };

  // Finish flashcard study session
  const handleFinishFlashcard = (updatedSessionCards: Card[], xpGained: number) => {
    const updatedMap = new Map(updatedSessionCards.map((c) => [c.id, c]));
    const nextCards = cards.map((c) => updatedMap.get(c.id) || c);
    updateCards(nextCards);

    const newStats = storage.recordReview(xpGained, updatedSessionCards.length);
    setStats(newStats);
    if (currentUser) {
      cloudSync.saveUserStats(currentUser.id, newStats);
    }
    setCurrentView('dashboard');
  };

  // Finish quiz / typing / speaking study
  const handleFinishMiniStudy = (xpGained: number) => {
    const newStats = storage.recordReview(xpGained, studyCards.length);
    setStats(newStats);
    if (currentUser) {
      cloudSync.saveUserStats(currentUser.id, newStats);
    }
    setCurrentView('dashboard');
  };

  // Import new deck handler
  const handleImportComplete = (importedDecks: Deck[], importedCards: Card[]) => {
    updateDecks([...decks, ...importedDecks]);
    updateCards([...cards, ...importedCards]);
    soundManager.playVictory();
  };

  // Create / Edit Deck
  const handleSaveDeck = (deckData: Partial<Deck>) => {
    if (editingDeck) {
      const nextDecks = decks.map((d) => (d.id === editingDeck.id ? ({ ...d, ...deckData } as Deck) : d));
      updateDecks(nextDecks);
    } else {
      const created: Deck = {
        id: deckData.id || `deck-${Date.now()}`,
        title: deckData.title || 'Bộ Thẻ Mới',
        description: deckData.description || '',
        emoji: deckData.emoji || '🍡',
        color: deckData.color || '#FED770',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      updateDecks([created, ...decks]);
    }
  };

  // Delete Deck & its cards
  const handleDeleteDeck = (deckId: string) => {
    const deck = decks.find((d) => d.id === deckId);
    if (window.confirm(`Bạn có chắc muốn xóa bộ thẻ "${deck?.title}" cùng tất cả từ vựng trong bộ này?`)) {
      soundManager.playClick();
      updateDecks(decks.filter((d) => d.id !== deckId));
      updateCards(cards.filter((c) => c.deckId !== deckId));
      if (activeDeckId === deckId) {
        setCurrentView('dashboard');
      }
    }
  };

  // Create / Edit Card
  const handleSaveCard = (cardData: Partial<Card>) => {
    if (editingCard) {
      const nextCards = cards.map((c) => (c.id === editingCard.id ? ({ ...c, ...cardData } as Card) : c));
      updateCards(nextCards);
    } else {
      const newCard: Card = {
        id: `card-${Date.now()}`,
        deckId: cardData.deckId || activeDeckId || decks[0]?.id || 'default',
        front: cardData.front || '',
        back: cardData.back || '',
        phonetic: cardData.phonetic,
        partOfSpeech: cardData.partOfSpeech,
        example: cardData.example,
        exampleMeaning: cardData.exampleMeaning,
        hint: cardData.hint,
        level: 0,
        interval: 0,
        easeFactor: 2.5,
        repetitions: 0,
        lapses: 0,
        nextReview: Date.now(),
        createdAt: Date.now(),
      };
      updateCards([newCard, ...cards]);
    }
  };

  const handleDeleteCard = (cardId: string) => {
    soundManager.playClick();
    updateCards(cards.filter((c) => c.id !== cardId));
  };

  // Reset demo data
  const handleResetData = () => {
    storage.resetAllData();
    setDecks(storage.getDecks());
    setCards(storage.getCards());
    setStats(storage.getStats());
    setSettings(storage.getSettings());
    soundManager.playVictory();
  };

  // If user is not logged in, show the prominent full-screen Welcome / Login screen!
  if (!currentUser) {
    return <WelcomeLoginScreen onLoginSuccess={(user) => setCurrentUser(user)} />;
  }

  const activeDeck = decks.find((d) => d.id === activeDeckId);

  return (
    <div className={`min-h-screen flex flex-col relative overflow-x-hidden ${settings.youtubeBackgroundEnabled ? 'bg-transparent' : settings.animatedBackground ? 'bg-animated-gradient' : 'bg-[#F8F9FE] dark:bg-slate-900'} text-[#2D3748] dark:text-slate-100 transition-colors duration-300`}>
      {/* 1. YouTube Live Video Wallpaper */}
      <YouTubeBackground settings={settings} onUpdateSettings={updateSettings} />

      {/* 2. Dynamic Animated Ambient Background */}
      {!settings.youtubeBackgroundEnabled && <AnimatedBackground />}

      {/* Top Navbar */}
      <Navbar
        stats={stats}
        settings={settings}
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenAIChat={() => {
          soundManager.playClick();
          setIsGeminiWindowOpen(true);
        }}
        onOpenStats={() => setIsStatsOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onToggleSound={() => {
          const nextVal = !settings.soundEffects;
          soundManager.setEnabled(nextVal);
          updateSettings({ ...settings, soundEffects: nextVal });
        }}
        onToggleTheme={() => {
          const nextTheme = settings.theme === 'dark' ? 'light' : 'dark';
          updateSettings({ ...settings, theme: nextTheme });
        }}
        onOpenImporter={() => setIsImporterOpen(true)}
        onOpenNewDeck={() => {
          setEditingDeck(null);
          setIsDeckModalOpen(true);
        }}
        onGoHome={() => setCurrentView('dashboard')}
        currentView={currentView}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 lg:p-8 relative z-10">
        {/* VIEW 1: Dashboard */}
        {currentView === 'dashboard' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Golden Time Widget */}
            <GoldenTimeWidget
              cards={cards}
              onReviewDueCards={handleReviewAllDueCards}
              onReviewLevel={handleReviewLevel}
            />

            {/* Gemini AI Interactive Partner Banner */}
            <div
              onClick={() => {
                soundManager.playClick();
                setIsGeminiWindowOpen(true);
              }}
              className="bg-linear-to-r from-blue-600 via-indigo-600 to-purple-700 hover:from-blue-700 hover:to-purple-800 text-white rounded-3xl p-5 sm:p-6 shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col sm:flex-row items-center justify-between gap-4 border border-blue-400/40 relative overflow-hidden group hover:scale-[1.01]"
            >
              <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none group-hover:scale-125 transition-transform" />
              <div className="flex items-center gap-4 relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-white/20 border border-white/40 flex items-center justify-center text-3xl shrink-0 shadow-sm group-hover:rotate-6 transition-transform">
                  💎
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg sm:text-xl font-black tracking-tight text-white">
                      Trò Chuyện Cùng Google Gemini AI
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/20 border border-white/40 text-blue-100">
                      2.5 Flash
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-blue-100/90 font-medium mt-1 max-w-xl leading-relaxed">
                    Liên kết tài khoản Gemini của bạn để hỏi đáp ngữ pháp, tra từ vựng hoặc luyện giao tiếp phản xạ tiếng Anh 1-1 không giới hạn!
                  </p>
                </div>
              </div>

              <div className="relative z-10 w-full sm:w-auto">
                <button
                  type="button"
                  className="w-full sm:w-auto px-6 py-3 bg-white text-blue-700 hover:bg-blue-50 font-black text-xs sm:text-sm rounded-2xl shadow-md transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Mở Phòng Chat Gemini</span>
                  <span>➔</span>
                </button>
              </div>
            </div>

            {/* Deck Library */}
            <DeckList
              decks={decks}
              cards={cards}
              onStartStudy={handleStartStudy}
              onViewDeckDetail={(deckId) => {
                soundManager.playClick();
                setActiveDeckId(deckId);
                setCurrentView('deck-detail');
              }}
              onCreateDeck={() => {
                setEditingDeck(null);
                setIsDeckModalOpen(true);
              }}
              onImportDeck={() => setIsImporterOpen(true)}
              onDeleteDeck={handleDeleteDeck}
              onEditDeck={(deck) => {
                setEditingDeck(deck);
                setIsDeckModalOpen(true);
              }}
            />
          </div>
        )}

        {/* VIEW 2: Deck Detail */}
        {currentView === 'deck-detail' && activeDeck && (
          <DeckDetail
            deck={activeDeck}
            cards={cards}
            onBack={() => setCurrentView('dashboard')}
            onStartStudy={handleStartStudy}
            onAddCard={() => {
              setEditingCard(null);
              setIsCardModalOpen(true);
            }}
            onEditCard={(card) => {
              setEditingCard(card);
              setIsCardModalOpen(true);
            }}
            onDeleteCard={handleDeleteCard}
          />
        )}

        {/* VIEW 3: Flashcard SRS Study */}
        {currentView === 'study-flashcard' && (
          <FlashcardStudy
            cards={studyCards}
            deckTitle={studyDeckTitle}
            settings={settings}
            onFinishSession={handleFinishFlashcard}
            onExit={() => setCurrentView('dashboard')}
          />
        )}

        {/* VIEW 4: Quiz Study */}
        {currentView === 'study-quiz' && (
          <QuizStudy
            cards={studyCards}
            allCards={cards}
            deckTitle={studyDeckTitle}
            settings={settings}
            onFinish={handleFinishMiniStudy}
            onExit={() => setCurrentView('dashboard')}
          />
        )}

        {/* VIEW 5: Typing Study */}
        {currentView === 'study-typing' && (
          <TypingStudy
            cards={studyCards}
            deckTitle={studyDeckTitle}
            settings={settings}
            onFinish={handleFinishMiniStudy}
            onExit={() => setCurrentView('dashboard')}
          />
        )}

        {/* VIEW 6: Speaking AI Study */}
        {currentView === 'study-speaking' && (
          <SpeakingStudy
            cards={studyCards}
            deckTitle={studyDeckTitle}
            settings={settings}
            onFinishSession={handleFinishMiniStudy}
            onExit={() => setCurrentView('dashboard')}
          />
        )}

        {/* VIEW 7: Authentic We Bare Bears Study Experience */}
        {currentView === 'study-mochi' && (
          <MochiStudyView
            cards={studyCards}
            deckTitle={studyDeckTitle}
            settings={settings}
            onCardReviewed={(updatedCard) => {
              setCards((prev) => prev.map((c) => (c.id === updatedCard.id ? updatedCard : c)));
              const currentStats = storage.getStats();
              setStats(currentStats);
              if (currentUser) {
                cloudSync.saveSingleCard(currentUser.id, updatedCard);
                cloudSync.saveUserStats(currentUser.id, currentStats);
              }
            }}
            onFinishSession={handleFinishFlashcard}
            onExit={() => setCurrentView('dashboard')}
          />
        )}

        {/* VIEW 8: AI English Conversation Room */}
        {currentView === 'ai-chat' && (
          <AIConversation
            settings={settings}
            onExit={() => setCurrentView('dashboard')}
            onRewardXP={(gained) => {
              const newStats = storage.recordReview(gained, 1);
              setStats(newStats);
            }}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-slate-200/60 text-center text-xs font-semibold text-slate-400 select-none">
        <div className="flex items-center justify-center gap-1.5 mb-1">
          <span>Phát triển với</span>
          <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
          <span>kết hợp phong cách MochiMochi & Thuật toán Anki SRS</span>
        </div>
        <p className="text-[11px] text-slate-400">
          MochiAnki • Spaced Repetition Vocabulary Engine • Hỗ trợ tệp .apkg, CSV, JSON
        </p>
      </footer>

      {/* Modals */}
      <DeckImporterModal
        isOpen={isImporterOpen}
        onClose={() => setIsImporterOpen(false)}
        onImportComplete={handleImportComplete}
        existingDecks={decks}
      />

      <DeckModal
        isOpen={isDeckModalOpen}
        onClose={() => {
          setIsDeckModalOpen(false);
          setEditingDeck(null);
        }}
        onSaveDeck={handleSaveDeck}
        editingDeck={editingDeck}
      />

      <AddCardModal
        isOpen={isCardModalOpen}
        onClose={() => {
          setIsCardModalOpen(false);
          setEditingCard(null);
        }}
        onSaveCard={handleSaveCard}
        editingCard={editingCard}
        deckId={activeDeckId || decks[0]?.id || 'default'}
      />

      <StatsModal
        isOpen={isStatsOpen}
        onClose={() => setIsStatsOpen(false)}
        stats={stats}
        cards={cards}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSaveSettings={(newSettings) => {
          setSettings(newSettings);
          storage.saveSettings(newSettings);
        }}
        onResetData={handleResetData}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        currentUser={currentUser}
        onUserChange={(user) => setCurrentUser(user)}
      />

      {/* Floating Gemini AI Web Window Button */}
      {!isGeminiWindowOpen && (
        <button
          type="button"
          onClick={() => {
            soundManager.playClick();
            setIsGeminiWindowOpen(true);
          }}
          title="Mở Cửa Sổ Google Gemini Web"
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 px-4 py-3 bg-linear-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-black text-xs sm:text-sm rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all cursor-pointer ring-4 ring-blue-400/40 animate-mochi-float"
        >
          <span className="text-xl">💎</span>
          <span>Cửa Sổ Gemini Web</span>
        </button>
      )}

      {/* Floating Gemini Window Component */}
      <GeminiFloatingWindow
        isOpen={isGeminiWindowOpen}
        onClose={() => setIsGeminiWindowOpen(false)}
        settings={settings}
      />
    </div>
  );
}

export default App;
