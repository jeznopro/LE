import { supabase, isSupabaseConfigured } from './supabase';
import { Card, Deck, UserStats, MemoryLevel } from '../types';

export const cloudSync = {
  // Sync Cards
  async fetchUserCards(userId: string): Promise<Card[] | null> {
    if (!isSupabaseConfigured || !userId) return null;
    try {
      const { data, error } = await supabase
        .from('user_cards')
        .select('*')
        .eq('user_id', userId);

      if (error || !data) return null;

      return data.map((row: any) => ({
        id: row.id,
        deckId: row.deck_id,
        front: row.front,
        back: row.back,
        phonetic: row.phonetic,
        example: row.example,
        exampleMeaning: row.example_meaning,
        image: row.image,
        level: (row.level ?? 0) as MemoryLevel,
        interval: Number(row.interval || 0),
        repetitions: Number(row.repetitions || 0),
        easeFactor: Number(row.ease_factor || 2.5),
        lapses: Number(row.lapses || 0),
        nextReview: row.next_review ? Number(row.next_review) : Date.now(),
        lastReview: row.last_review ? Number(row.last_review) : undefined,
        createdAt: row.created_at ? new Date(row.created_at).getTime() : Date.now(),
      }));
    } catch (err) {
      console.error('Error fetching user cards from Supabase:', err);
      return null;
    }
  },

  async saveSingleCard(userId: string, card: Card): Promise<boolean> {
    if (!isSupabaseConfigured || !userId) return false;
    try {
      const payload = {
        id: card.id,
        user_id: userId,
        deck_id: card.deckId,
        front: card.front,
        back: card.back,
        phonetic: card.phonetic,
        example: card.example,
        example_meaning: card.exampleMeaning,
        image: card.image,
        level: card.level ?? 0,
        interval: card.interval ?? 0,
        repetitions: card.repetitions ?? 0,
        ease_factor: card.easeFactor ?? 2.5,
        lapses: card.lapses ?? 0,
        next_review: card.nextReview ?? null,
        last_review: card.lastReview ?? null,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase.from('user_cards').upsert(payload);
      return !error;
    } catch (err) {
      console.error('Error saving card to Supabase:', err);
      return false;
    }
  },

  async saveAllCards(userId: string, cards: Card[]): Promise<boolean> {
    if (!isSupabaseConfigured || !userId || cards.length === 0) return false;
    try {
      const payload = cards.map((c) => ({
        id: c.id,
        user_id: userId,
        deck_id: c.deckId,
        front: c.front,
        back: c.back,
        phonetic: c.phonetic,
        example: c.example,
        example_meaning: c.exampleMeaning,
        image: c.image,
        level: c.level ?? 0,
        interval: c.interval ?? 0,
        repetitions: c.repetitions ?? 0,
        ease_factor: c.easeFactor ?? 2.5,
        lapses: c.lapses ?? 0,
        next_review: c.nextReview ?? null,
        last_review: c.lastReview ?? null,
        updated_at: new Date().toISOString(),
      }));

      const { error } = await supabase.from('user_cards').upsert(payload);
      return !error;
    } catch (err) {
      console.error('Error saving cards to Supabase:', err);
      return false;
    }
  },

  // Sync Stats
  async fetchUserStats(userId: string): Promise<UserStats | null> {
    if (!isSupabaseConfigured || !userId) return null;
    try {
      const { data, error } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error || !data) return null;

      return {
        xp: data.xp || 0,
        level: data.level || 1,
        streak: data.streak || 0,
        lastStudyDate: data.last_study_date || '',
        totalReviews: data.total_reviews || 0,
        cardsLearned: 0,
        history: data.history || [],
      };
    } catch (err) {
      console.error('Error fetching user stats from Supabase:', err);
      return null;
    }
  },

  async saveUserStats(userId: string, stats: UserStats): Promise<boolean> {
    if (!isSupabaseConfigured || !userId) return false;
    try {
      const payload = {
        user_id: userId,
        xp: stats.xp,
        level: stats.level,
        streak: stats.streak,
        last_study_date: stats.lastStudyDate,
        total_reviews: stats.totalReviews,
        history: stats.history,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase.from('user_stats').upsert(payload);
      return !error;
    } catch (err) {
      console.error('Error saving stats to Supabase:', err);
      return false;
    }
  },

  // Sync Decks
  async fetchUserDecks(userId: string): Promise<Deck[] | null> {
    if (!isSupabaseConfigured || !userId) return null;
    try {
      const { data, error } = await supabase
        .from('user_decks')
        .select('*')
        .eq('user_id', userId);

      if (error || !data || data.length === 0) return null;

      return data.map((d: any) => ({
        id: d.id,
        title: d.title,
        description: d.description || '',
        folder: d.folder || undefined,
        emoji: d.emoji || '📚',
        color: d.color || '#FFD84D',
        createdAt: d.created_at ? new Date(d.created_at).getTime() : Date.now(),
        updatedAt: d.updated_at ? new Date(d.updated_at).getTime() : Date.now(),
      }));
    } catch (err) {
      console.error('Error fetching decks from Supabase:', err);
      return null;
    }
  },

  async saveAllDecks(userId: string, decks: Deck[]): Promise<boolean> {
    if (!isSupabaseConfigured || !userId || decks.length === 0) return false;
    try {
      const payload = decks.map((d) => ({
        id: d.id,
        user_id: userId,
        title: d.title,
        description: d.description || '',
        folder: d.folder || null,
        emoji: d.emoji || '📚',
        color: d.color || '#FFD84D',
        updated_at: new Date().toISOString(),
      }));

      const { error } = await supabase.from('user_decks').upsert(payload);
      return !error;
    } catch (err) {
      console.error('Error saving decks to Supabase:', err);
      return false;
    }
  },
};
