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

export type StudyMode = 'flashcard' | 'quiz' | 'typing' | 'listen' | 'mochi';

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
}

export type ExamQuestionType = 'multiple-choice' | 'word-formation' | 'fill-blank';

export interface ExamQuestion {
  id: string;
  examId: string;
  type: ExamQuestionType;
  dạng: string; // e.g. 'Dạng 1: Phân biệt từ', 'Dạng 2: Cụm động từ', 'Dạng 3: Cụm giới từ', 'Dạng 4: Cấu tạo từ', 'Dạng 5: Cụm từ đi kèm'
  question: string; // The prompt text with blank '______'
  options?: string[]; // For multiple-choice (usually 4 choices)
  correctAnswer: string; // Correct word or phrase
  rootWord?: string; // For word formation, e.g. 'ARRANGE'
  hint?: string;
  explanation: string; // Comprehensive explanation with translation & Destination B1 notes
}

export interface Exam {
  id: string;
  unitId?: string; // e.g. 'deck-b1-u3'
  title: string;
  unit: string; // e.g. 'Unit 3'
  description: string;
  durationMinutes: number;
  emoji: string;
  color: string;
  questions: ExamQuestion[];
}

export interface ExamUserAnswer {
  questionId: string;
  userAnswer: string;
  isCorrect: boolean;
  isFlagged?: boolean;
}

export interface ExamResult {
  id: string;
  examId: string;
  examTitle: string;
  userId: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  timeSpentSeconds: number;
  completedAt: number;
  answers: Record<string, ExamUserAnswer>;
  xpGained: number;
  dạngBreakdown: Record<string, { total: number; correct: number }>;
}


