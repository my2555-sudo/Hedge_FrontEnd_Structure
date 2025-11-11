import { useCallback, useEffect, useRef, useState } from "react";

const FMP_BASE_URL = "https://financialmodelingprep.com/api/v3";
const FEAR_GREED_URL = "https://api.alternative.me/fng/?limit=1";

const INDEX_SYMBOLS = ["^GSPC", "^NDX", "^DJI", "^VIX"];

const FALLBACK_DATA = {
  indexes: [
    { symbol: "^GSPC", name: "S&P 500", price: 5121.42, changesPercentage: "-0.41" },
    { symbol: "^NDX", name: "NASDAQ 100", price: 17894.65, changesPercentage: "0.32" },
    { symbol: "^DJI", name: "Dow Jones", price: 38940.22, changesPercentage: "-0.15" },
    { symbol: "^VIX", name: "CBOE VIX", price: 14.87, changesPercentage: "1.12" },
  ],
  sectors: [
    { name: "Technology", change: 1.23 },
    { name: "Healthcare", change: 0.88 },
    { name: "Financial", change: -0.31 },
    { name: "Energy", change: 0.47 },
    { name: "Consumer Discretionary", change: -0.56 },
  ],
  fearGreed: {
    value: 62,
    classification: "Greed",
  },
};

function pickIndexes(indexes = []) {
  if (!Array.isArray(indexes)) return [];
  const bySymbol = Object.fromEntries(
    indexes
      .filter((item) => item && item.symbol)
      .map((item) => [item.symbol, item])
  );
  return INDEX_SYMBOLS.map((symbol) => bySymbol[symbol]).filter(Boolean);
}

function normalizeSectors(sectors = []) {
  if (!Array.isArray(sectors)) return [];
  return sectors
    .map((sector) => ({
      name: sector.sector || sector.name || "Unknown",
      change: Number(sector.changesPercentage ?? sector.change ?? 0),
    }))
    .filter((sector) => !Number.isNaN(sector.change))
    .sort((a, b) => b.change - a.change)
    .slice(0, 5);
}

function parseFearGreed(payload) {
  const entry = payload?.data?.[0];
  if (!entry) return null;
  return {
    value: Number(entry.value),
    classification: entry.valueClassification,
  };
}

export function useMarketInsights({ refreshInterval = 120000 } = {}) {
  const [insights, setInsights] = useState({
    loading: true,
    error: null,
    indexes: [],
    sectors: [],
    fearGreed: null,
    lastUpdated: null,
  });
  const abortRef = useRef();

  const fetchInsights = useCallback(async () => {
    if (abortRef.current) {
      abortRef.current.abort();
    }
    const controller = new AbortController();
    abortRef.current = controller;

    const apiKey = import.meta.env.VITE_FMP_API_KEY || "demo";

    try {
      setInsights((prev) => ({ ...prev, loading: true, error: null }));
      const [indexesRes, sectorsRes, sentimentRes] = await Promise.all([
        fetch(`${FMP_BASE_URL}/quotes/index?apikey=${apiKey}`, {
          signal: controller.signal,
        }),
        fetch(`${FMP_BASE_URL}/sectors-performance?apikey=${apiKey}`, {
          signal: controller.signal,
        }),
        fetch(FEAR_GREED_URL, { signal: controller.signal }),
      ]);

      if (!indexesRes.ok || !sectorsRes.ok || !sentimentRes.ok) {
        throw new Error("Failed to fetch market insights");
      }

      const [indexesJson, sectorsJson, sentimentJson] = await Promise.all([
        indexesRes.json(),
        sectorsRes.json(),
        sentimentRes.json(),
      ]);

      const indexesError = indexesJson?.["Error Message"];
      const sectorsError = sectorsJson?.["Error Message"];
      const sentimentError = sentimentJson?.["Error Message"];

      if (indexesError || sectorsError || sentimentError) {
        throw new Error(
          indexesError || sectorsError || sentimentError || "API returned an error payload"
        );
      }

      setInsights({
        loading: false,
        error: null,
        indexes: pickIndexes(indexesJson),
        sectors: normalizeSectors(sectorsJson?.sectorPerformance),
        fearGreed: parseFearGreed(sentimentJson),
        lastUpdated: new Date(),
      });
    } catch (error) {
      if (error.name === "AbortError") return;
      setInsights({
        loading: false,
        error: error.message || "Unable to load market insights",
        indexes: pickIndexes(FALLBACK_DATA.indexes),
        sectors: normalizeSectors(FALLBACK_DATA.sectors),
        fearGreed: FALLBACK_DATA.fearGreed,
        lastUpdated: new Date(),
      });
    }
  }, []);

  useEffect(() => {
    fetchInsights();
    if (!refreshInterval) return undefined;

    const id = setInterval(fetchInsights, refreshInterval);
    return () => {
      clearInterval(id);
      if (abortRef.current) {
        abortRef.current.abort();
      }
    };
  }, [fetchInsights, refreshInterval]);

  return {
    ...insights,
    refresh: fetchInsights,
  };
}

export default useMarketInsights;

