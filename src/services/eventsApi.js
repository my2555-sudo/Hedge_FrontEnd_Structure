import { supabase } from '../lib/supabaseClient';

/** Fetch last N events for a round, newest first */
export async function fetchRecentEvents(roundId, limit = 50) {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('round_id', roundId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data ?? [];
}

/** Subscribe to new events for a round (INSERT only). Returns unsubscribe fn */
export function subscribeEvents(roundId, onInsert) {
  const channel = supabase
    .channel(`events_round_${roundId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'events', filter: `round_id=eq.${roundId}` },
      payload => onInsert?.(payload.new)
    )
    .subscribe();

  return () => supabase.removeChannel(channel);
}

/** Publish a new event (RLS requires the user be a participant for that round’s game) */
export async function publishEvent({ roundId, etype, headline, description = null, impactPct = 0, targetTickerId = null }) {
  const insert = {
    round_id: roundId,
    etype,                     // 'MACRO' | 'MICRO' | 'BLACKSWAN'
    headline,
    description,
    impact_pct: impactPct,
    target_ticker_id: targetTickerId,
  };

  const { data, error } = await supabase.from('events').insert(insert).select().single();
  if (error) throw error;
  return data;
}
