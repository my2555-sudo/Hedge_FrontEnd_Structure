import { supabase } from '../lib/supabaseClient';

export async function joinGame(gameId, startingCash = 10000) {
  const user = (await supabase.auth.getUser())?.data?.user;
  if (!user) throw new Error('Not signed in');

  const row = { game_id: gameId, user_id: user.id, cash_balance: startingCash };
  const { data, error } = await supabase.from('game_participants').insert(row).select().single();

  // If unique constraint triggers (already joined), fetch the existing row
  if (error && error.code === '23505') {
    const { data: existing, error: e2 } = await supabase
      .from('game_participants').select('*').eq('game_id', gameId).eq('user_id', user.id).single();
    if (e2) throw e2;
    return existing;
  }
  if (error) throw error;
  return data;
}
