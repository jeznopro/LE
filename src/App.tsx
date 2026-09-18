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
import { MasterPinLockScreen, PIN_STORAGE_KEY } from './components/MasterPinLockScreen';
import { supabase, isSupabaseConfigured } from './utils/supabase';
import { cloudSync } from './utils/cloudSync';
import { INITIAL_CARDS, INITIAL_DECKS } from './data/sampleDecks';
import { Heart } from 'lucide-react';

type ViewMode = 'dashboard' | 'deck-detail' | 'study-flashcard' | 'study-quiz' | 'study-typing' | 'study-mochi';

export function App() {
  const [isUnlocked, setIsUnlocked] = useState<boolean>(() => {
    try {
      const local = localStorage.getItem(PIN_STORAGE_KEY);
      const session = sessionStorage.getItem(PIN_STORAGE_KEY);
      return Boolean(local || session);
    } catch {
      return false;
    }
  });
  const [cloudStatus, setCloudStatus] = useState<'synced' | 'syncing' | 'offline'>('synced');

  const [decks, setDecks] = useState<Deck[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [stats, setStats] = useState<UserStats>(storage.getStats());
  const [settings, setSettings] = useState<UserSettings>(storage.getSettings());
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(storage.getCurrentUser());

  // Views & Navigation
  const [currentView, setCurrentView] = useState<ViewMode>('dashboard');
  const [returnView, setReturnView] = useState<ViewMode>('dashboard');
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

  // Real-time Cloud Auto-Sync with Supabase when app is unlocked and user is active
  useEffect(() => {
    if (!currentUser || !isSupabaseConfigured || !isUnlocked) return;
    async function initSync() {
      setCloudStatus('syncing');
      try {
        const [cloudDecks, cloudCards, cloudStats] = await Promise.all([
          cloudSync.fetchUserDecks(currentUser!.id),
          cloudSync.fetchUserCards(currentUser!.id),
          cloudSync.fetchUserStats(currentUser!.id),
        ]);

        let currentDecks = cloudDecks && cloudDecks.length > 0 ? cloudDecks : storage.getDecksForUser(currentUser!.id);
        let currentCards = cloudCards && cloudCards.length > 0 ? cloudCards : storage.getCardsForUser(currentUser!.id);

        // Clean up legacy single destination b1 deck if present
        currentDecks = currentDecks.filter((d) => d.id !== 'deck-destination-b1');
        currentCards = currentCards.filter((c) => c.deckId !== 'deck-destination-b1');

        // Auto-seed Destination B1 dedicated unit decks if missing
        const missingB1Decks = INITIAL_DECKS.filter(
          (d) => d.id.startsWith('deck-b1-') && !currentDecks.some((cd) => cd.id === d.id)
        );
        if (missingB1Decks.length > 0) {
          currentDecks = [...currentDecks, ...missingB1Decks];
          const missingB1Cards = INITIAL_CARDS.filter((c) =>
            missingB1Decks.some((d) => d.id === c.deckId)
          );
          currentCards = [...currentCards, ...missingB1Cards];
          if (isSupabaseConfigured) {
            for (const d of missingB1Decks) {
              await cloudSync.saveSingleDeck(currentUser!.id, d);
            }
            await cloudSync.saveAllCards(currentUser!.id, missingB1Cards);
          }
        }

        setDecks(currentDecks);
        setCards(currentCards);
        storage.saveDecksForUser(currentUser!.id, currentDecks);
        storage.saveCardsForUser(currentUser!.id, currentCards);

        if (cloudStats) {
          setStats(cloudStats);
          storage.saveStatsForUser(currentUser!.id, cloudStats);
        } else {
          const localStats = storage.getStatsForUser(currentUser!.id);
          await cloudSync.saveUserStats(currentUser!.id, localStats);
        }

        setCloudStatus('synced');
      } catch (err) {
        console.warn('Initial cloud sync error:', err);
        setCloudStatus('offline');
      }
    }
    initSync();
  }, [currentUser?.id, isUnlocked]);

  // Synchronize decks, cards, and stats whenever currentUser switches profile
  useEffect(() => {
    if (currentUser) {
      let userDecks = storage.getDecksForUser(currentUser.id);
      let userCards = storage.getCardsForUser(currentUser.id);
      const userStats = storage.getStatsForUser(currentUser.id);

      // Clean up legacy single destination b1 deck if present
      userDecks = userDecks.filter((d) => d.id !== 'deck-destination-b1');
      userCards = userCards.filter((c) => c.deckId !== 'deck-destination-b1');

      // Ensure Destination B1 dedicated unit decks are present
      const missingB1Decks = INITIAL_DECKS.filter(
        (d) => d.id.startsWith('deck-b1-') && !userDecks.some((ud) => ud.id === d.id)
      );
      if (missingB1Decks.length > 0) {
        userDecks = [...userDecks, ...missingB1Decks];
        const missingB1Cards = INITIAL_CARDS.filter((c) =>
          missingB1Decks.some((d) => d.id === c.deckId)
        );
        userCards = [...userCards, ...missingB1Cards];
        storage.saveDecksForUser(currentUser.id, userDecks);
        storage.saveCardsForUser(currentUser.id, userCards);
      }

      setDecks(userDecks);
      setCards(userCards);
      setStats(userStats);
    } else {
      setDecks([]);
      setCards([]);
      setStats(storage.resetStatsToZero());
    }
  }, [currentUser?.id]);

  const handleLockApp = () => {
    soundManager.playClick();
    localStorage.removeItem(PIN_STORAGE_KEY);
    sessionStorage.removeItem(PIN_STORAGE_KEY);
    setIsUnlocked(false);
  };

  const updateDecks = (newDecks: Deck[]) => {
    setDecks(newDecks);
    if (currentUser) {
      storage.saveDecksForUser(currentUser.id, newDecks);
      if (isSupabaseConfigured) {
        setCloudStatus('syncing');
        cloudSync.saveAllDecks(currentUser.id, newDecks)
          .then(() => setCloudStatus('synced'))
          .catch(() => setCloudStatus('offline'));
      }
    } else {
      storage.saveDecks(newDecks);
    }
  };

  const updateCards = (newCards: Card[]) => {
    setCards(newCards);
    if (currentUser) {
      storage.saveCardsForUser(currentUser.id, newCards);
      if (isSupabaseConfigured) {
        setCloudStatus('syncing');
        cloudSync.saveAllCards(currentUser.id, newCards)
          .then(() => setCloudStatus('synced'))
          .catch(() => setCloudStatus('offline'));
      }
    } else {
      storage.saveCards(newCards);
    }
  };

  const updateStats = (newStats: UserStats) => {
    setStats(newStats);
    if (currentUser) {
      storage.saveStatsForUser(currentUser.id, newStats);
      if (isSupabaseConfigured) {
        setCloudStatus('syncing');
        cloudSync.saveUserStats(currentUser.id, newStats)
          .then(() => setCloudStatus('synced'))
          .catch(() => setCloudStatus('offline'));
      }
    } else {
      storage.saveStats(newStats);
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
    updateStats(newStats);
    setCurrentView(returnView);
  };

  // Finish quiz / typing / speaking study
  const handleFinishMiniStudy = (xpGained: number) => {
    const newStats = storage.recordReview(xpGained, studyCards.length);
    updateStats(newStats);
    setCurrentView(returnView);
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
      if (currentUser && isSupabaseConfigured) {
        cloudSync.deleteDeck(currentUser.id, deckId);
      }
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
    if (currentUser && isSupabaseConfigured) {
      cloudSync.deleteCard(currentUser.id, cardId);
    }
  };

  // Clear all decks and cards completely
  const handleClearAllDecks = () => {
    if (window.confirm('Bạn có chắc chắn muốn XÓA TẤT CẢ các bộ thẻ và từ vựng hiện tại để làm mới hoàn toàn không?')) {
      soundManager.playClick();
      updateDecks([]);
      updateCards([]);
    }
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

  // Master PIN (1727) Security Lock Check
  if (!isUnlocked) {
    return <MasterPinLockScreen onUnlockSuccess={() => setIsUnlocked(true)} />;
  }

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
        cloudStatus={cloudStatus}
        onLockApp={handleLockApp}
        onOpenAuth={() => setIsAuthOpen(true)}
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
              onClearAllDecks={handleClearAllDecks}
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
            onExit={() => setCurrentView(returnView)}
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
            onExit={() => setCurrentView(returnView)}
          />
        )}

        {/* VIEW 5: Typing Study */}
        {currentView === 'study-typing' && (
          <TypingStudy
            cards={studyCards}
            deckTitle={studyDeckTitle}
            settings={settings}
            onFinish={handleFinishMiniStudy}
            onExit={() => setCurrentView(returnView)}
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
            onExit={() => setCurrentView(returnView)}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-white/30 dark:border-white/10 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 select-none backdrop-blur-md">
        <div className="flex items-center justify-center gap-1.5 mb-1">
          <span>Phát triển với</span>
          <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
          <span>kết hợp phong cách We Bare Bears & Thuật toán Anki SRS</span>
        </div>
        <p className="text-[11px] text-slate-400">
          We Bare Bears Anki • Spaced Repetition Vocabulary Engine • Hỗ trợ tệp .apkg, CSV, JSON
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
    </div>
  );
}

export default App;
