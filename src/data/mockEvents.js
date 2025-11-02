// src/data/mockEvents.js
export const EVENT_TYPES = { MACRO: "MACRO", MICRO: "MICRO" , BLACKSWAN: "BLACKSWAN" };


const macroPool = [
  { id: "macro-1", type: EVENT_TYPES.MACRO, title: "Fed hikes rates by 25 bps", baseImpactPct: -0.012, icon: "🏦", tags: ["rates","fed"] },
  { id: "macro-2", type: EVENT_TYPES.MACRO, title: "CPI cools below expectations", baseImpactPct: +0.015, icon: "🧾", tags: ["inflation","cpi"] },
  { id: "macro-3", type: EVENT_TYPES.MACRO, title: "Oil jumps on OPEC+ cuts", baseImpactPct: +0.009, icon: "🛢️", tags: ["energy","opec"] },
];

const microPool = [
  { id: "micro-1", type: EVENT_TYPES.MICRO, title: "TechCo beats; raises guidance", baseImpactPct: +0.035, icon: "💻", tags: ["earnings","tech"] },
  { id: "micro-2", type: EVENT_TYPES.MICRO, title: "BioHealth drug fails Phase 3", baseImpactPct: -0.028, icon: "🧪", tags: ["trial","biotech"] },
  { id: "micro-3", type: EVENT_TYPES.MICRO, title: "AutoCo announces $5B buyback", baseImpactPct: +0.02,  icon: "🚗", tags: ["buyback","auto"] },
];

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
let seq = 0;

export function nextEvent() {
  const pool = Math.random() < 0.5 ? macroPool : microPool;
  const base = pick(pool);
  const jitter = (Math.random() - 0.5) * 0.008; // ±0.4%
  const impactPct = +(base.baseImpactPct + jitter).toFixed(4);
  return {
    ...base,
    impactPct,
    ts: Date.now(),
    runtimeId: `${base.id}-${Date.now()}-${seq++}`,
  };
}

const blackSwanPool = [
  { id: "bs-1", type: EVENT_TYPES.BLACKSWAN, title: "Flash Crash: Liquidity Vacuum", baseImpactPct: -0.12, icon: "⚠️" },
  { id: "bs-2", type: EVENT_TYPES.BLACKSWAN, title: "Geopolitical Shock: Sanctions Escalation", baseImpactPct: -0.08, icon: "🛑" },
  { id: "bs-3", type: EVENT_TYPES.BLACKSWAN, title: "Exchange Outage: Price Discovery Stalls", baseImpactPct: -0.06, icon: "🧯" },
];
let bsSeq = 0;
export function nextBlackSwan(){
  const pick = blackSwanPool[Math.floor(Math.random()*blackSwanPool.length)];
  const jitter = (Math.random()-0.5)*0.04;
  const impactPct = +(pick.baseImpactPct + jitter).toFixed(4);
  return { ...pick, impactPct, ts: Date.now(), runtimeId: `${pick.id}-${Date.now()}-${bsSeq++}` };
}