import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { supabase } from "../lib/supabaseClient.js";

const Ctx = createContext({
  events: [],
  addEventLocal: () => {},
  publishEvent: async () => {},
});

// DB row -> UI shape
function mapRowToUi(row) {
  return {
    runtimeId: `db:${row.id}`,
    id: row.id,
    type: row.etype,                   // 'MACRO' | 'MICRO' | 'BLACKSWAN'
    title: row.headline,
    description: row.description ?? null,
    impactPct: row.impulse_pct ?? 0,   // ✅ correct column name
    tickerId: row.target_ticker_id ?? null,
    severity: row.severity ?? null,    // optional if you want it in UI
    ts: new Date(row.created_at).getTime(),
  };
}

// UI event -> DB insert
function mapUiToInsert(roundId, ev) {
  return {
    round_id: roundId,
    etype: ev.type,
    headline: ev.title,
    description: ev.description ?? null,
    impulse_pct: ev.impactPct ?? 0,     // ✅ correct column name
    target_ticker_id: ev.tickerId ?? null,
    severity: ev.severity ?? null,      // optional
  };
}

export function EventProvider({ children, roundId, readOnly = false }) {
  const [events, setEvents] = useState([]);
  const seen = useRef(new Set());

  const addEventLocal = useCallback((ev) => {
    const runtimeId = ev.runtimeId ?? `local:${crypto.randomUUID?.() ?? Math.random().toString(36).slice(2)}`;
    if (seen.current.has(runtimeId)) return;
    seen.current.add(runtimeId);
    const ui = { ...ev, runtimeId, ts: ev.ts ?? Date.now() };
    setEvents((prev) => [ui, ...prev].slice(0, 200));
  }, []);

  // initial load
  useEffect(() => {
    if (!roundId) return;
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("round_id", roundId)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) {
        console.error("fetch events failed:", error);
        return;
      }
      const mapped = (data ?? []).map(mapRowToUi);
      mapped.forEach((m) => seen.current.add(m.runtimeId));
      if (!cancelled) setEvents(mapped);
    })();
    return () => {
      cancelled = true;
      setEvents([]);
      seen.current.clear();
    };
  }, [roundId]);

  // realtime inserts
  useEffect(() => {
    if (!roundId) return;
    const channel = supabase
      .channel(`events:round:${roundId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "events", filter: `round_id=eq.${roundId}` },
        (payload) => {
          const ui = mapRowToUi(payload.new);
          if (seen.current.has(ui.runtimeId)) return;
          seen.current.add(ui.runtimeId);
          setEvents((prev) => [ui, ...prev].slice(0, 200));
        }
      )
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [roundId]);

  // publish to DB
  const publishEvent = useCallback(
    async (ev) => {
      if (readOnly) throw new Error("readOnly EventProvider cannot publish");
      if (!roundId) throw new Error("roundId missing in EventProvider");

      const insert = mapUiToInsert(roundId, ev);
      const { data, error } = await supabase
        .from("events")
        .insert(insert)
        .select()
        .single();

      if (error) {
        console.error("events insert error:", error);
        throw error;
      }

      // optimistic local (dedup prevents double)
      addEventLocal({
        ...ev,
        runtimeId: `db:${data.id}`,
        ts: new Date(data.created_at).getTime(),
      });
      return data;
    },
    [roundId, readOnly, addEventLocal]
  );

  const value = useMemo(() => ({ events, addEventLocal, publishEvent }), [events, addEventLocal, publishEvent]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useEventBus() {
  return useContext(Ctx);
}
