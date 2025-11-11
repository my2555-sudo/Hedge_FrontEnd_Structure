import { supabase } from "./supabaseClient";

/** Get the most recent round_id for a game (by round_no desc) */
export async function getLatestRoundId(gameId) {
  const { data, error } = await supabase
    .from("rounds")
    .select("id, round_no")
    .eq("game_id", gameId)
    .order("round_no", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) { console.error("getLatestRoundId error:", error); return null; }
  return data?.id ?? null;
}

/**
 * Ensure a round exists for this game.
 * If none: creates round_no=1 with (starts_at=now, ends_at=now+durationSec)
 */
export async function getOrCreateCurrentRound(gameId, durationSec = 30) {
  const existing = await getLatestRoundId(gameId);
  if (existing) return existing;

  const now = new Date();
  const ends = new Date(now.getTime() + durationSec * 1000);

  const { data, error } = await supabase
    .from("rounds")
    .insert({
      game_id: gameId,
      round_no: 1,
      starts_at: now.toISOString(),
      ends_at: ends.toISOString(),
    })
    .select("id")
    .single();

  if (error) { console.error("getOrCreateCurrentRound error:", error); return null; }
  return data.id;
}

/** (Optional) Create the next round and return its id. Handy if you later wire round switching. */
export async function createNextRound(gameId, durationSec = 30) {
  // fetch current max round_no
  const { data: cur, error: e1 } = await supabase
    .from("rounds")
    .select("round_no")
    .eq("game_id", gameId)
    .order("round_no", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (e1) { console.error("createNextRound error:", e1); return null; }

  const nextNo = (cur?.round_no ?? 0) + 1;
  const now = new Date();
  const ends = new Date(now.getTime() + durationSec * 1000);

  const { data, error: e2 } = await supabase
    .from("rounds")
    .insert({
      game_id: gameId,
      round_no: nextNo,
      starts_at: now.toISOString(),
      ends_at: ends.toISOString(),
    })
    .select("id")
    .single();

  if (e2) { console.error("createNextRound insert error:", e2); return null; }
  return data.id;
}
