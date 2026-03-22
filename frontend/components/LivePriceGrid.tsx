'use client';

import { useState, useEffect, useCallback } from 'react';
import StaleDataBanner from './StaleDataBanner';
import PriceCard from './PriceCard';
import {
  RefreshCw,
  Globe,
  Database,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Zap,
} from 'lucide-react';

interface CachedPrice {
  assetId: string;
  assetName: string;
  priceUsd: number;
  change24h: number;
  lastUpdated: string;
}

interface PricesResponse {
  success: boolean;
  count: number;
  data: CachedPrice[];
  fetchedAt: string;
  stale: boolean;
}

// ✅ ADDED: Alert interface matching your DB
interface Alert {
  id: string;
  asset_id: string;
  asset_name: string;
  drop_percentage: number;
  price_at_drop: number;
  detected_at: string;
}

interface LivePriceGridProps {
  initialData: CachedPrice[];
  initialStale: boolean;
}

const POLL_INTERVAL_MS = 5_000;

const COINGECKO_LOGOS: Record<string, string> = {
  bitcoin: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png',
  ethereum: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png',
  cardano: 'https://assets.coingecko.com/coins/images/975/large/cardano.png',
};

export default function LivePriceGrid({ initialData, initialStale }: LivePriceGridProps) {
  const [prices, setPrices] = useState<CachedPrice[]>(initialData);
  const [isStale, setIsStale] = useState(initialStale);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);
  const [isPolling, setIsPolling] = useState(false);

  // ✅ ADDED: State to hold the live alerts
  const [alerts, setAlerts] = useState<Alert[]>([]);

  const fetchPrices = useCallback(async () => {
    setIsPolling(true);
    try {
      // ✅ UPDATED: Fetch both prices and recent alerts (limit to 3 for the dashboard) simultaneously
      const [pricesRes, alertsRes] = await Promise.all([
        fetch('/api/prices', { cache: 'no-store' }),
        fetch('/api/alerts?limit=3', { cache: 'no-store' })
      ]);

      if (!pricesRes.ok) {
        setIsStale(true);
        return;
      }

      const payload: PricesResponse = await pricesRes.json();
      if (payload.data && payload.data.length > 0) setPrices(payload.data);
      setIsStale(payload.stale ?? false);
      setLastFetch(new Date());

      // ✅ Parse alerts if successful
      if (alertsRes.ok) {
        const alertsData = await alertsRes.json();
        setAlerts(Array.isArray(alertsData) ? alertsData : []);
      }

    } catch {
      setIsStale(true);
    } finally {
      setIsPolling(false);
    }
  }, []);

  useEffect(() => {
    setLastFetch(new Date());
    // Initial fetch for alerts
    fetchPrices();
    const intervalId = setInterval(() => void fetchPrices(), POLL_INTERVAL_MS);
    return () => clearInterval(intervalId);
  }, [fetchPrices]);

  const getCoin = (id: string) => prices.find((p) => p.assetId === id);
  const bitcoin = getCoin('bitcoin');
  const ethereum = getCoin('ethereum');

  const avgChange = prices.length
    ? prices.reduce((acc, curr) => acc + curr.change24h, 0) / prices.length
    : 0;

  return (
    <div className="space-y-6">
      <StaleDataBanner stale={isStale} />

      <div className="flex justify-end items-center gap-2 text-xs text-zinc-500 font-mono mb-4">
        <RefreshCw
          className={`w-3.5 h-3.5 ${isPolling ? 'animate-spin text-green-500' : 'text-zinc-600'}`}
        />
        <span>LAST SYNC: {lastFetch ? lastFetch.toLocaleTimeString('en-US') : '--:--'}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* MARKET OVERVIEW */}
        <div className="col-span-1 bg-[#0a0a0a] border border-zinc-800 rounded-2xl p-6 relative overflow-hidden group hover:border-green-500/50 transition-colors">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Globe className="w-24 h-24" />
          </div>
          <h3 className="text-sm text-zinc-400 font-bold tracking-widest mb-6 flex items-center gap-2">
            <Globe className="w-4 h-4 text-green-500" /> MARKET OVERVIEW
          </h3>
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-500">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] text-zinc-500 tracking-widest">GLOBAL MARKET CAP</p>
                <p className="text-xl font-bold text-white">$3.10T <span className="text-xs text-zinc-600 italic">EST</span></p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] text-zinc-500 tracking-widest">24H VOLUME</p>
                <p className="text-xl font-bold text-white">$110.96B <span className="text-xs text-zinc-600 italic">EST</span></p>
              </div>
            </div>
          </div>
        </div>

        {/* BITCOIN CARD */}
        <PriceCard
          key="bitcoin"
          assetId="bitcoin"
          assetName="Bitcoin"
          priceUsd={bitcoin?.priceUsd || 0}
          change24h={bitcoin?.change24h || 0}
          status={alerts.some(a => a.asset_id === 'bitcoin') ? 'alert' : 'stable'}
          index={0}
          logo={COINGECKO_LOGOS.bitcoin}
        />

        {/* ETHEREUM CARD */}
        <PriceCard
          key="ethereum"
          assetId="ethereum"
          assetName="Ethereum"
          priceUsd={ethereum?.priceUsd || 0}
          change24h={ethereum?.change24h || 0}
          status={alerts.some(a => a.asset_id === 'ethereum') ? 'alert' : 'stable'}
          index={1}
          logo={COINGECKO_LOGOS.ethereum}
        />

        {/* SYSTEM ALERTS */}
        <div className="col-span-1 lg:row-span-2 bg-[#0a0a0a] border border-zinc-800 rounded-2xl p-6 flex flex-col relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-red-500/5 to-transparent pointer-events-none" />
          <h3 className="text-sm text-zinc-300 font-bold tracking-widest mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500" /> SYSTEM ALERTS
            <span className="text-[10px] text-zinc-600 ml-auto tracking-widest">LIVE FEED</span>
          </h3>

          {/* ✅ UPDATED: Dynamic Alerts Rendering */}
          <div className="flex-1 flex flex-col justify-center">
            {alerts.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-zinc-600 text-sm italic">
                <p>No alerts triggered</p>
                <div className="w-full h-[1px] bg-zinc-800/50 mt-8 mb-8" />
                <p className="text-[10px] not-italic tracking-widest text-zinc-500 uppercase text-center">
                  Monitoring all assets for flash crashes exceeding 2% deviation
                </p>
              </div>
            ) : (
              <div className="space-y-3 w-full">
                {alerts.map((alert) => (
                  <div key={alert.id} className="bg-red-500/10 border border-red-500/20 p-3 rounded-xl flex items-start gap-3">
                    <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white uppercase truncate">{alert.asset_name}</p>
                      <p className="text-[10px] text-red-400 font-bold mt-0.5">
                        Dropped {Math.abs(alert.drop_percentage).toFixed(2)}%
                      </p>
                      <p className="text-[9px] text-zinc-500 mt-1 uppercase tracking-widest">
                        {new Date(alert.detected_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* SENTRY ANALYTICS */}
        <div className="col-span-1 lg:col-span-2 bg-[#0a0a0a] border border-zinc-800 rounded-2xl p-6 relative overflow-hidden group">
          <div className="absolute top-1/2 right-10 -translate-y-1/2 opacity-5 text-green-500 group-hover:opacity-10 transition-opacity">
            <Zap className="w-32 h-32" />
          </div>

          <h3 className="text-sm text-green-500 font-bold tracking-widest mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" /> SENTRY ANALYTICS
          </h3>

          <p className="text-xs text-zinc-400 mb-8 max-w-md leading-relaxed">
            AI-driven sentiment analysis suggests a <span className="text-green-500 font-bold">BULLISH</span> trend. No liquidity drains detected in current cycle. Network operational.
          </p>

          <div className="flex gap-12">
            <div>
              <p className="text-[10px] text-zinc-500 tracking-widest mb-1">VOLATILITY INDEX</p>
              <p className="text-lg font-bold text-white">14.2% <span className="text-sm text-zinc-400 font-normal">LOW</span></p>
            </div>
            <div>
              <p className="text-[10px] text-zinc-500 tracking-widest mb-1">BUY PRESSURE</p>
              <p className="text-lg font-bold text-green-500">68% <span className="text-sm text-green-700 font-normal">HIGH</span></p>
            </div>
          </div>
        </div>

        {/* 24H MARKET CHANGE */}
        <div className="col-span-1 bg-[#0a0a0a] border border-zinc-800 rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-[10px] text-zinc-500 font-bold tracking-widest mb-2 uppercase">Avg 24H Market Change</h3>
            <div className="flex items-center gap-2">
              <p className={`text-2xl font-bold ${avgChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {avgChange > 0 ? '+' : ''}{avgChange.toFixed(2)}%
              </p>
              {avgChange >= 0 ? <TrendingUp className="w-5 h-5 text-green-500" /> : <TrendingDown className="w-5 h-5 text-red-500" />}
            </div>
          </div>

          <div className="flex items-end justify-between h-16 mt-6 opacity-30">
            {[40, 60, 30, 80, 50, 90, 40, 70, 50].map((height, i) => (
              <div key={i} className={`w-2 rounded-t-sm ${avgChange >= 0 ? 'bg-green-500' : 'bg-red-500'}`} style={{ height: `${height}%` }} />
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}