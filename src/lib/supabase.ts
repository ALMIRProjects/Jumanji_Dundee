import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(url, anonKey, {
  auth: { persistSession: false },
});

export async function submitScore(entry: {
  player_name: string;
  score: number;
  distance: number;
  character_id: string;
}) {
  const { error } = await supabase.from('high_scores').insert(entry);
  if (error) console.error('Score submit failed:', error.message);
}

export async function getTopScores(limit = 10) {
  const { data, error } = await supabase
    .from('high_scores')
    .select('id, player_name, score, distance, character_id, created_at')
    .order('score', { ascending: false })
    .limit(limit);
  if (error) {
    console.error('Leaderboard fetch failed:', error.message);
    return [];
  }
  return data ?? [];
}
