export type MemoryLevel = 0 | 1 | 2 | 3 | 4 | 5;

export type SRSRating = 'again' | 'hard' | 'good' | 'easy';

export interface Card {
  id: string;
  deckId: string;
  front: string;          // Word or phrase in English
  back: string;           // Meaning in Vietnamese
  phonetic?: string;      // e.g. /əˈkɒmplɪʃ/
  example?: string;       // Example sentence
  exampleMeaning?: string;// Vietnamese translation of example
  partOfSpeech?: string;  // noun, verb, adj, etc.
  hint?: string;          // Mnemonic or hint
  image?: string;         // URL or base64 data
  tags?: string[];        // Category tags
  
  // SRS properties (SM-2 based)
  level: MemoryLevel;     // 1: Chưa nhớ, 2: Mới nhớ, 3: Đang nhớ, 4: Nhớ tốt, 5: Nhớ sâu
  interval: number;       // In days (or fractional for hours)
  easeFactor: number;     // Standard starts at 2.5
  repetitions: number;    // Consecutive correct reviews
  lapses: number;         // Times forgotten
  nextReview: number;     // Epoch timestamp in ms
  lastReview?: number;    // Epoch timestamp in ms
  createdAt: number;
}

export interface Deck {
  id: string;
  title: string;
  folder?: string;
  description: string;
  emoji: string;
  color: string;          // Tailwind color or hex (e.g., '#FFD84D', '#FF8A8A', '#7BDCB5')
  tags?: string[];
  cards?: Card[];
  createdAt: number;
  updatedAt: number;
}

export interface DeckStats {
  total: number;
  due: number;
  new: number;
  levelCounts: Record<MemoryLevel, number>;
}

export type StudyMode = 'flashcard' | 'quiz' | 'typing' | 'listen';

export interface StudySessionState {
  deckId: string;
  deckTitle: string;
  mode: StudyMode;
  cards: Card[];
  currentIndex: number;
  ratings: Record<string, SRSRating>;
  startTime: number;
  correctAnswers: number;
  xpEarned: number;
}

export interface UserAccount {
  id: string;
  username: string;
  avatar: string; // Avatar URL or preset emoji
  email?: string;
  createdAt: number;
}

export interface UserStats {
  streak: number;
  lastStudyDate: string; // YYYY-MM-DD
  xp: number;
  level: number;
  totalReviews: number;
  cardsLearned: number;
  history: {
    date: string; // YYYY-MM-DD
    reviews: number;
    xp: number;
  }[];
}

export interface UserSettings {
  ttsAccent: 'en-US' | 'en-GB' | 'en-AU';
  ttsSpeed: number; // 0.7 to 1.2
  soundEffects: boolean;
  autoPlayAudio: boolean;
  dailyGoal: number; // e.g., 20 cards
  theme: 'light' | 'dark';
  animatedBackground: boolean;
  youtubeBackgroundUrl?: string;
  youtubeBackgroundEnabled?: boolean;
  youtubeBackgroundOpacity?: number; // 0.1 to 0.9
  youtubeBackgroundMuted?: boolean;
}
