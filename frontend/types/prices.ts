export interface CachedPrice {
  assetId: string;
  assetName: string;
  priceUsd: number;
  change24h: number;
  lastUpdated: string;
}

export interface PricesResponse {
  success: boolean;
  count: number;
  data: CachedPrice[];
  fetchedAt: string;
  stale: boolean;
}

export async function fetchPricesSSR(): Promise<{ data: CachedPrice[]; stale: boolean }> {
  try {
    const res = await fetch(
      `${process.env.EXPRESS_SERVER_URL || 'http://localhost:4000'}/cache`,
      { cache: 'no-store' }
    );
    if (!res.ok) return { data: [], stale: true };
    const payload: PricesResponse = await res.json();
    const ageMs = Date.now() - new Date(payload.fetchedAt).getTime();
    return { data: payload.data ?? [], stale: ageMs > 60_000 };
  } catch {
    return { data: [], stale: true };
  }
}
