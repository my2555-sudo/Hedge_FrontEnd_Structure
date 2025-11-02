let nextId = 1;
const macros = [
  { title: "Fed raises rates by 50 bps", pct: -0.03, type: "MACRO" },
  { title: "Inflation cools faster than expected", pct: 0.02, type: "MACRO" },
  { title: "Tariffs on electronics announced", pct: -0.025, type: "MACRO" },
];
const micros = [
  { title: "Tech giant beats earnings estimates", pct: 0.018, type: "MICRO" },
  { title: "EV recall triggers risk-off sentiment", pct: -0.02, type: "MICRO" },
  { title: "Breakthrough in battery density", pct: 0.022, type: "MICRO" },
];

export function nextEvent(){
  const pool = Math.random() < 0.5 ? macros : micros;
  const base = pool[Math.floor(Math.random()*pool.length)];
  return {
    id: nextId++,
    type: base.type,
    title: base.title,
    impactPct: base.pct * (0.7 + Math.random()*0.6), // 0.7x ~ 1.3x 变化
    detail: "Auto-generated headline for gameplay pacing."
  };
}
