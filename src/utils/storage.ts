import { Card, Deck, UserSettings, UserStats, UserAccount } from '../types';
import { INITIAL_CARDS, INITIAL_DECKS } from '../data/sampleDecks';

const STORAGE_KEYS = {
  DECKS: 'learning_english_decks_v1',
  CARDS: 'learning_english_cards_v1',
  STATS: 'learning_english_stats_v1',
  SETTINGS: 'learning_english_settings_v1',
  USERS: 'learning_english_users_v1',
  CURRENT_USER: 'learning_english_current_user_v1',
};

const DEFAULT_SETTINGS: UserSettings = {
  ttsAccent: 'en-US',
  ttsSpeed: 0.9,
  soundEffects: true,
  autoPlayAudio: true,
  dailyGoal: 20,
  theme: 'light',
  animatedBackground: true,
  youtubeBackgroundUrl: 'https://www.youtube.com/watch?v=jfKfPfyJRdk', // Default Lofi Girl
  youtubeBackgroundEnabled: false,
  youtubeBackgroundOpacity: 0.35,
  youtubeBackgroundMuted: true,
};

// All stats reset cleanly to 0
const DEFAULT_STATS: UserStats = {
  streak: 0,
  lastStudyDate: '',
  xp: 0,
  level: 1,
  totalReviews: 0,
  cardsLearned: 0,
  history: [],
};

export const storage = {
  getDecks(): Deck[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.DECKS);
      if (!data) {
        this.saveDecks(INITIAL_DECKS);
        return INITIAL_DECKS;
      }
      return JSON.parse(data);
    } catch {
      return INITIAL_DECKS;
    }
  },

  saveDecks(decks: Deck[]) {
    localStorage.setItem(STORAGE_KEYS.DECKS, JSON.stringify(decks));
  },

  getCards(): Card[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CARDS);
      if (!data) {
        this.saveCards(INITIAL_CARDS);
        return INITIAL_CARDS;
      }
      return JSON.parse(data);
    } catch {
      return INITIAL_CARDS;
    }
  },

  saveCards(cards: Card[]) {
    localStorage.setItem(STORAGE_KEYS.CARDS, JSON.stringify(cards));
  },

  getStats(): UserStats {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.STATS);
      if (!data) {
        this.saveStats(DEFAULT_STATS);
        return DEFAULT_STATS;
      }
      return JSON.parse(data);
    } catch {
      return DEFAULT_STATS;
    }
  },

  saveStats(stats: UserStats) {
    localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(stats));
  },

  getSettings(): UserSettings {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (!data) {
        this.saveSettings(DEFAULT_SETTINGS);
        return DEFAULT_SETTINGS;
      }
      return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
    } catch {
      return DEFAULT_SETTINGS;
    }
  },

  saveSettings(settings: UserSettings) {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  },

  // Helper to record a review session
  recordReview(xpGained: number, cardsCount: number) {
    const stats = this.getStats();
    const today = new Date().toISOString().split('T')[0];

    // Check streak
    if (stats.lastStudyDate !== today) {
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      if (stats.lastStudyDate === yesterday) {
        stats.streak += 1;
      } else {
        stats.streak = 1;
      }
      stats.lastStudyDate = today;
    }

    stats.xp += xpGained;
    stats.totalReviews += cardsCount;
    stats.level = Math.floor(stats.xp / 200) + 1;

    // Update history
    const dayEntry = stats.history.find(h => h.date === today);
    if (dayEntry) {
      dayEntry.reviews += cardsCount;
      dayEntry.xp += xpGained;
    } else {
      stats.history.push({ date: today, reviews: cardsCount, xp: xpGained });
    }

    this.saveStats(stats);
    return stats;
  },

  // User Account Management
  getCurrentUser(): UserAccount | null {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  setCurrentUser(user: UserAccount | null) {
    if (user) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }
  },

  getUsers(): UserAccount[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.USERS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  register(username: string, avatar: string, email?: string): UserAccount {
    const users = this.getUsers();
    const newUser: UserAccount = {
      id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      username: username.trim(),
      avatar: avatar || '/gojo.png',
      email: email?.trim(),
      createdAt: Date.now(),
    };
    users.push(newUser);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    this.setCurrentUser(newUser);
    return newUser;
  },

  login(userId: string): UserAccount | null {
    const users = this.getUsers();
    const found = users.find((u) => u.id === userId);
    if (found) {
      this.setCurrentUser(found);
      return found;
    }
    return null;
  },

  logout() {
    this.setCurrentUser(null);
  },

  resetAllData() {
    // Clear all old and new storage keys to ensure clean 0 state
    Object.values(STORAGE_KEYS).forEach((k) => localStorage.removeItem(k));
    localStorage.removeItem('mochi_anki_decks_v1');
    localStorage.removeItem('mochi_anki_cards_v1');
    localStorage.removeItem('mochi_anki_stats_v1');
    localStorage.removeItem('mochi_anki_settings_v1');
  },

  resetStatsToZero() {
    this.saveStats(DEFAULT_STATS);
    return DEFAULT_STATS;
  }
};
