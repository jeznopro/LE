import { createClient } from '@supabase/supabase-js';

// Supabase configuration - automatically supports both environment variables and direct defaults
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ertxdazmcaeiuqnqpbmx.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVydHhkYXptY2FlaXVxbnFwYm14Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg0MDM1MzAsImV4cCI6MjEwMzk3OTUzMH0._dt01i1oqGVbqCGO4cAvr_L5tg2EwoGiBxgRbLPuGoI';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
