/**
 * Market price intelligence module.
 * Uses real public data: Agri Exchange (agrimarket.gov.in public feed).
 * Provides provider abstraction + cache with LIVE/CACHED/STALE labeling.
 * If the upstream is unreachable, returns "Data unavailable" instead of
 * fabricating prices.
 */
import { getCachedMarket, setCachedMarket } from "../db";

export interface MarketRow {
  commodity: string;
  variety: string;
  market: string;
  district: string;
  state: string;
  arrivalDate: string;
  minPrice: number;
  maxPrice: number;
  modalPrice: number;
  unit: string;
}

export interface MarketResult {
  freshness: "LIVE" | "CACHED" | "STALE" | "UNAVAILABLE";
  provider: string;
  retrievedAt: string;
  rows: MarketRow[];
  notice?: string;
  retrievedFrom?: "api" | "cache";
  cacheAgeMinutes?: number;
}

async function fetchAgriExchange(commodity?: string, state?: string) {
  // Agri Exchange public commodity price feed (data.gov.in / agrimarket.gov.in)
  const base = "https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070?api-key=579b464db66ec23bdd000001cdd3946e44ce4aad7209ff7b23ac571b";
  const params = new URLSearchParams({ format: "json", limit: "100", offset: "0" });
  if (commodity) params.set("filters[commodity]", commodity);
  if (state) params.set("filters[state]", state);
  const res = await fetch(`${base}&${params.toString()}`, { signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`Agri Exchange HTTP ${res.status}`);
  const data = (await res.json()) as any;
  return data?.records ?? [];
}

function normalizeRow(r: any): MarketRow | null {
  const modal = Number(r.modal_price);
  const min = Number(r.min_price);
  const max = Number(r.max_price);
  if (!Number.isFinite(modal)) return null;
  return {
    commodity: String(r.commodity ?? "").trim(),
    variety: String(r.variety ?? "").trim(),
    market: String(r.market ?? "").trim(),
    district: String(r.district ?? "").trim(),
    state: String(r.state ?? "").trim(),
    arrivalDate: String(r.arrival_date ?? ""),
    minPrice: Number.isFinite(min) ? min : modal,
    maxPrice: Number.isFinite(max) ? max : modal,
    modalPrice: modal,
    unit: "INR per quintal",
  };
}

export async function getMarketPrices(opts: {
  commodity?: string;
  state?: string;
  forceLive?: boolean;
}): Promise<MarketResult> {
  const key = `market:${opts.commodity ?? "*"}:${opts.state ?? "*"}`;

  if (!opts.forceLive) {
    const cached = await getCachedMarket(key, 240);
    if (cached && !cached.stale && cached.data) {
      const r = cached.data as MarketResult;
      return { ...r, freshness: "CACHED", retrievedFrom: "cache" };
    }
    if (cached && cached.stale && cached.data) {
      const r = cached.data as MarketResult;
      return { ...r, freshness: "STALE" };
    }
  }

  try {
    const records = await fetchAgriExchange(opts.commodity, opts.state);
    const rows: MarketRow[] = records.map(normalizeRow).filter((r: MarketRow | null): r is MarketRow => r !== null);
    const result: MarketResult = {
      freshness: "LIVE",
      provider: "Agri Exchange (agrimarket.gov.in)",
      retrievedAt: new Date().toISOString(),
      rows,
      notice: rows.length === 0 ? "Data unavailable" : undefined,
    };
    if (rows.length > 0) await setCachedMarket(key, result, "Agri Exchange");
    return result;
  } catch {
    const cached = await getCachedMarket(key, 4320);
    if (cached?.data) {
      const r = cached.data as MarketResult;
      return { ...r, freshness: cached.stale ? "STALE" : "CACHED" };
    }
    return { freshness: "UNAVAILABLE", provider: "Agri Exchange", retrievedAt: new Date().toISOString(), rows: [], notice: "Data unavailable — market feed could not be reached. Check back later." };
  }
}

/** Common mandi commodities for quick browsing. */
export const COMMON_COMMODITIES = [
  "Rice", "Wheat", "Maize", "Cotton", "Sugarcane", "Soyabean", "Groundnut",
  "Mustard", "Tomato", "Onion", "Potato", "Chana", "Tur (Arhar)", "Jowar",
  "Bajra", "Mango", "Banana", "Chillies", "Gram", "Urad",
];
