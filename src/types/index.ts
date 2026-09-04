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
  partOfSpeech?: string;  // noun, verb, adj, etc. (Type)
  relatedWords?: string;  // Synonyms, related words, collocations
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

export type StudyMode = 'flashcard' | 'quiz' | 'typing' | 'listen' | 'speaking' | 'mochi';

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
  pin?: string;   // Optional 4-digit PIN for private local profile
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
  geminiApiKey?: string;
}

export interface AnswerEvaluation {
  estimatedBand: string;
  score: number;
  fluencyFeedback: string;
  vocabFeedback: string;
  grammarFeedback: string;
  summary: string;
}

export interface AIChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  translation?: string;
  correction?: string;
  tip?: string;
  evaluation?: AnswerEvaluation;
  timestamp: number;
}

export interface ConversationScenario {
  id: string;
  title: string;
  topic: string;
  category?: 'ielts-part-1' | 'ielts-part-2' | 'ielts-part-3' | 'daily' | 'business';
  description: string;
  icon: string;
  level: string;
  initialAIMessage: string;
  initialTranslation: string;
  suggestedPrompts: string[];
  cueCardPrompt?: string;
  keyVocab?: string[];
}

export interface IELTSSpeakingQuestion {
  question: string;
  sampleAnswer: string;
  keyVocab: string[];
  tips?: string;
}

export interface RoadmapNode {
  id: string;
  title: string;
  subtitle?: string;
  icon: string;
  chapterId: string;
  part: 'Part 1' | 'Part 2' | 'Part 3';
  targetBand: string; // e.g. 'Band 6.5 - 8.0+'
  cueCardPrompt?: string; // For Part 2
  questions?: IELTSSpeakingQuestion[];
  type: 'lesson' | 'chest' | 'speaking-challenge' | 'boss';
  cards: Card[];
  stars: number; // 0 to 3
  isUnlocked: boolean;
  isCompleted: boolean;
  xpReward: number;
}

export interface RoadmapChapter {
  id: string;
  title: string;
  subtitle: string;
  part: 'Part 1' | 'Part 2' | 'Part 3';
  band: string;
  color: string;
  nodes: RoadmapNode[];
}

export interface SpeakingRoadmapProfile {
  id: string;
  name: string;
  description: string;
  category: 'ielts' | 'business' | 'daily' | 'custom';
  icon: string;
  targetBand: string;
  chapters: RoadmapChapter[];
  isCustom?: boolean;
}


