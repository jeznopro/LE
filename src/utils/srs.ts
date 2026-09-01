import { Card, MemoryLevel, SRSRating } from '../types';

export interface SRSResult {
  interval: number;
  easeFactor: number;
  repetitions: number;
  lapses: number;
  level: MemoryLevel;
  nextReview: number;
}

export function calculateSRS(card: Card, rating: SRSRating): SRSResult {
  let { interval, easeFactor, repetitions, lapses } = card;
  const now = Date.now();

  // Ensure default safety
  easeFactor = easeFactor || 2.5;
  repetitions = repetitions || 0;
  interval = interval || 0;
  lapses = lapses || 0;

  switch (rating) {
    case 'again': {
      repetitions = 0;
      interval = 10 / (24 * 60); // 10 minutes from now (in fractional days)
      easeFactor = Math.max(1.3, easeFactor - 0.2);
      lapses += 1;
      break;
    }
    case 'hard': {
      repetitions = Math.max(1, repetitions);
      interval = interval <= 0.1 ? 1 : Math.max(1, Math.round(interval * 1.2));
      easeFactor = Math.max(1.3, easeFactor - 0.15);
      break;
    }
    case 'good': {
      if (repetitions === 0) {
        interval = 1; // 1 day
      } else if (repetitions === 1) {
        interval = 3; // 3 days
      } else {
        interval = Math.max(2, Math.round(interval * easeFactor));
      }
      repetitions += 1;
      break;
    }
    case 'easy': {
      if (repetitions === 0) {
        interval = 3; // 3 days
      } else {
        interval = Math.max(4, Math.round(interval * easeFactor * 1.35));
      }
      repetitions += 2;
      easeFactor = Math.min(3.0, easeFactor + 0.15);
      break;
    }
  }

  // Calculate Mochi Memory Level (1 to 5)
  const level = calculateMochiLevel(interval, repetitions, rating);
  const nextReview = now + Math.round(interval * 24 * 60 * 60 * 1000);

  return {
    interval,
    easeFactor,
    repetitions,
    lapses,
    level,
    nextReview,
  };
}

export function calculateMochiLevel(intervalDays: number, reps: number, rating?: SRSRating): MemoryLevel {
  if (reps === 0 && intervalDays === 0 && !rating) {
    return 0; // Chưa học (Level 0)
  }
  if (rating === 'again' || intervalDays < 0.5) {
    return 1; // Chưa nhớ (Level 1)
  }
  if (intervalDays < 3 || reps === 1) {
    return 2; // Mới nhớ (Level 2)
  }
  if (intervalDays < 10 || reps <= 3) {
    return 3; // Đang nhớ (Level 3)
  }
  if (intervalDays < 25 || reps <= 5) {
    return 4; // Nhớ tốt (Level 4)
  }
  return 5; // Nhớ sâu (Level 5)
}

export function formatIntervalPreview(days: number): string {
  if (days < 1 / 24) {
    const mins = Math.max(1, Math.round(days * 24 * 60));
    return `${mins} phút`;
  }
  if (days < 1) {
    const hours = Math.round(days * 24);
    return `${hours} giờ`;
  }
  if (days === 1) return '1 ngày';
  if (days < 30) return `${Math.round(days)} ngày`;
  if (days < 365) return `${(days / 30).toFixed(1)} tháng`;
  return `${(days / 365).toFixed(1)} năm`;
}

export function getRatingIntervalPreviews(card: Card): Record<SRSRating, string> {
  const againRes = calculateSRS(card, 'again');
  const hardRes = calculateSRS(card, 'hard');
  const goodRes = calculateSRS(card, 'good');
  const easyRes = calculateSRS(card, 'easy');

  return {
    again: formatIntervalPreview(againRes.interval),
    hard: formatIntervalPreview(hardRes.interval),
    good: formatIntervalPreview(goodRes.interval),
    easy: formatIntervalPreview(easyRes.interval),
  };
}

export function isCardDue(card: Card): boolean {
  if (!card.nextReview) return true;
  return Date.now() >= card.nextReview;
}

export const MOCHI_LEVEL_INFO: Record<MemoryLevel, { name: string; label: string; color: string; bg: string; borderColor: string; emoji: string }> = {
  0: { name: 'Chưa học', label: 'Cấp độ 0', color: '#64748B', bg: '#F1F5F9', borderColor: '#CBD5E1', emoji: '📖' },
  1: { name: 'Chưa nhớ', label: 'Cấp độ 1', color: '#EF4444', bg: '#FEE2E2', borderColor: '#FCA5A5', emoji: '🌱' },
  2: { name: 'Mới nhớ', label: 'Cấp độ 2', color: '#F97316', bg: '#FFEDD5', borderColor: '#FDBA74', emoji: '🌿' },
  3: { name: 'Đang nhớ', label: 'Cấp độ 3', color: '#EAB308', bg: '#FEF9C3', borderColor: '#FDE047', emoji: '🌸' },
  4: { name: 'Nhớ tốt', label: 'Cấp độ 4', color: '#10B981', bg: '#D1FAE5', borderColor: '#6EE7B7', emoji: '🌳' },
  5: { name: 'Nhớ sâu', label: 'Cấp độ 5', color: '#3B82F6', bg: '#DBEAFE', borderColor: '#93C5FD', emoji: '💎' },
};
