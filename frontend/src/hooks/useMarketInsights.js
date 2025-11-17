import { useCallback, useEffect, useRef, useState } from "react";

const FEAR_GREED_URL = "https://api.alternative.me/fng/?limit=1";

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

function normalizeMarketIndicators(profiles = []) {
  if (!Array.isArray(profiles)) return [];
  return profiles
    .filter((item) => item && item.symbol && item.price !== undefined)
    .map((item) => ({
      symbol: item.symbol,
      name: item.companyName || item.name || item.symbol,
      price: item.price || 0,
      changesPercentage: item.changePercentage || item.changesPercentage || 0,
    }));
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

    try {
      setInsights((prev) => ({ ...prev, loading: true, error: null }));
      
      // Only fetch Fear & Greed API (free, no key required)
      // Use sample data for indexes and sectors (FMP requires paid tier)
      const sentimentResult = await Promise.allSettled([
        fetch(FEAR_GREED_URL, { 
          signal: controller.signal,
        }).then(res => res.ok ? res.json() : Promise.reject(new Error(`Fear & Greed API: ${res.status}`))),
      ]);

      const [sentimentResultData] = sentimentResult;
      
      // Always use sample data for indexes and sectors (FMP free tier doesn't include these)
      const indexes = normalizeMarketIndicators(FALLBACK_DATA.indexes);
      const sectors = normalizeSectors(FALLBACK_DATA.sectors);

      // Process Fear & Greed (free API)
      let fearGreed = null;
      let sentimentError = null;
      if (sentimentResultData.status === "fulfilled") {
        const sentimentJson = sentimentResultData.value;
        fearGreed = parseFearGreed(sentimentJson);
        if (!fearGreed && sentimentJson?.data?.length === 0) {
          sentimentError = "No Fear & Greed data available";
        }
      } else {
        sentimentError = sentimentResultData.reason?.message || "Failed to fetch sentiment";
      }
      
      setInsights({
        loading: false,
        error: sentimentError || null,
        indexes,
        sectors,
        fearGreed: fearGreed || FALLBACK_DATA.fearGreed,
        lastUpdated: new Date(),
      });
    } catch (error) {
      if (error.name === "AbortError") return;
      console.warn("Market insights fetch error:", error);
      setInsights({
        loading: false,
        error: error.message || "Unable to load market insights",
        indexes: normalizeMarketIndicators(FALLBACK_DATA.indexes),
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

