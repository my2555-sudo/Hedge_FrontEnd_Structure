import { supabase } from '../lib/supabaseClient';

export async function upsertMyProfile({ username, full_name=null }) {
  const user = (await supabase.auth.getUser())?.data?.user;
  if (!user) throw new Error('Not signed in');

  const row = { id: user.id, username, full_name };
  const { data, error } = await supabase.from('profiles').upsert(row).select().single();
  if (error) throw error;
  return data;
}
