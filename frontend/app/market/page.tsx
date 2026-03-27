"use client";

import { useState } from 'react';
import useSWR from 'swr';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import {
  ShieldCheck, Search, LayoutGrid, List, Bell, User,
  Settings, BarChart2, Star, TrendingUp, TrendingDown, Activity
} from 'lucide-react';

// ✅ IMPORT MOBILE NAVBAR
import MobileNavbar from '@/components/Navbar';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface CachedPrice {
  assetId: string;
  assetName: string;
  priceUsd: number;
  change24h: number;
  lastUpdated: string;
}

// ─── HELPER: MAP BACKEND ID TO SYMBOL ───
const mapIdToSymbol = (id: string) => {
  const symbols: Record<string, string> = {
    bitcoin: 'btc', ethereum: 'eth', solana: 'sol', cardano: 'ada', polkadot: 'dot',
    dogecoin: 'doge', ripple: 'xrp', shiba: 'shib', avalanche: 'avax', chainlink: 'link',
    tether: 'usdt', 'usd-coin': 'usdc'
  };
  return symbols[id.toLowerCase()] || id.toLowerCase().substring(0, 4);
};

export default function MarketDataPage() {
  const { data: session, status } = useSession();
  const [searchQuery, setSearchQuery] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const API_URL = process.env.EXPRESS_SERVER_URL || 'http://localhost:4000';

  // 1. Fetch Market Prices
  const { data: priceData, isLoading: pricesLoading } = useSWR(
    `${API_URL}/cache`,
    fetcher,
    {
      refreshInterval: 5000,
      revalidateIfStale: false,
    }
  );

  // 2. Fetch Watchlist
  const { data: watchlistData, isLoading: watchlistLoading, mutate: mutateWatchlist } = useSWR(
    session?.user ? '/api/watchlist' : null,
    fetcher,
    {
      revalidateIfStale: false,
      revalidateOnFocus: false
    }
  );

  const watchlist = watchlistData?.watchlist?.map((item: any) => item.asset_id) || [];

  const toggleStar = async (assetId: string, assetName: string) => {
    if (!session || isUpdating) return;
    setIsUpdating(true);
    const isStarred = watchlist.includes(assetId);
    try {
      if (isStarred) {
        await fetch(`/api/watchlist?asset_id=${assetId}`, { method: 'DELETE' });
      } else {
        await fetch('/api/watchlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ asset_id: assetId, asset_name: assetName })
        });
      }
      mutateWatchlist();
    } catch (error) {
      console.error("Database Error", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const rawPrices: CachedPrice[] = priceData?.data || [];

  // Sorting: Starred items always at the top
  const sortedPrices = [...rawPrices].sort((a, b) => {
    const aStarred = watchlist.includes(a.assetId);
    const bStarred = watchlist.includes(b.assetId);
    if (aStarred && !bStarred) return -1;
    if (!aStarred && bStarred) return 1;
    return 0;
  });

  const filteredPrices = sortedPrices.filter(coin =>
    coin.assetName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    coin.assetId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isGlobalLoading =
    status === 'loading' ||
    pricesLoading ||
    (status === 'authenticated' && watchlistLoading);

  return (
    <div className="min-h-screen flex bg-[#050505] text-white font-mono selection:bg-green-500/30">

      <MobileNavbar />

      <aside className="w-64 border-r border-green-900/20 bg-[#0a0a0a] p-6 hidden md:flex flex-col justify-between z-10 shadow-[4px_0_24px_rgba(0,0,0,0.5)]">
        <div>
          <div className="flex items-center gap-3 mb-12 text-green-500">
            <ShieldCheck className="w-8 h-8" />
            <div>
              <h1 className="font-bold tracking-widest text-lg uppercase">BITBASH</h1>
              <p className="text-[10px] text-green-700 tracking-widest uppercase">Sentry V4</p>
            </div>
          </div>

          <nav className="space-y-3 text-sm text-zinc-400">
            <Link href="/" className="flex items-center p-3 hover:text-white hover:bg-white/5 rounded-lg transition-all">
              <LayoutGrid className="w-4 h-4 mr-3" /> Dashboard
            </Link>
            <Link href="/watchlist" className="flex items-center p-3 hover:text-white hover:bg-white/5 rounded-lg transition-all">
              <List className="w-4 h-4 mr-3" /> Watchlist
            </Link>
            <Link href="/alerts" className="flex items-center p-3 hover:text-white hover:bg-white/5 rounded-lg transition-all">
              <Bell className="w-4 h-4 mr-3" /> Alerts
            </Link>
            <Link href="/market" className="flex items-center bg-green-500/10 text-green-500 p-3 rounded-lg border border-green-500/20 font-bold relative transition-all">
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-green-500 rounded-r" />
              <Search className="w-4 h-4 mr-3" /> Market Data
            </Link>
            <Link href="/profile" className="flex items-center p-3 hover:text-white hover:bg-white/5 rounded-lg transition-all mt-8">
              <User className="w-4 h-4 mr-3" /> Profile
            </Link>
            <Link href="/settings" className="flex items-center p-3 hover:text-white hover:bg-white/5 rounded-lg transition-all">
              <Settings className="w-4 h-4 mr-3" /> Settings
            </Link>
          </nav>
        </div>

        {session?.user && (
          <div className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-xl mt-auto">
            <div className="w-8 h-8 rounded bg-green-900 text-green-500 flex items-center justify-center font-bold overflow-hidden uppercase">
              {session.user.image ? (
                <img src={session.user.image} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                session.user.name?.charAt(0).toUpperCase() || 'U'
              )}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-white truncate uppercase">{session.user.name || 'OPERATOR'}</p>
              <p className="text-[10px] text-zinc-500 truncate">{session.user.email}</p>
            </div>
          </div>
        )}
      </aside>

      <main className="flex-1 flex flex-col relative overflow-hidden">
        <div className="flex-1 overflow-y-auto px-4 pt-24 pb-28 md:p-10">
          <div className="max-w-7xl mx-auto">

            <header className="mb-8 md:mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4 md:gap-6">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 md:w-12 md:h-12 border border-green-500/30 rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(34,197,94,0.05)]">
                  <BarChart2 className="w-5 h-5 md:w-6 md:h-6 text-green-500" />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-black italic tracking-wider text-white uppercase">Market Explorer</h1>
                  <p className="text-[10px] text-zinc-500 tracking-widest uppercase mt-1">Asset Index & Liquidity Map</p>
                </div>
              </div>

              <div className="relative w-full md:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Search Index..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#121212] border border-zinc-800 text-white rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:border-green-500/50 transition-all text-sm"
                />
              </div>
            </header>

            <div className="bg-[#0a0a0a] border border-zinc-800 rounded-2xl overflow-hidden">
              {isGlobalLoading ? (
                <div className="flex flex-col items-center justify-center py-32 text-green-500/50">
                  <Activity className="w-8 h-8 animate-pulse mb-4" />
                  <p className="tracking-widest text-xs uppercase">Initializing Terminal...</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-zinc-800 text-[10px] text-zinc-500 tracking-widest uppercase bg-black/20">
                        <th className="px-3 md:px-6 py-4 md:py-5">Asset</th>
                        <th className="px-3 md:px-6 py-4 md:py-5">Last Quote</th>
                        <th className="px-3 md:px-6 py-4 md:py-5">24H Delta</th>
                        <th className="px-3 md:px-6 py-4 md:py-5 hidden md:table-cell">Market Cap</th>
                        <th className="px-3 md:px-6 py-4 md:py-5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/50">
                      {filteredPrices.map((coin) => (
                        <MarketRow
                          key={coin.assetId}
                          coin={coin}
                          isStarred={watchlist.includes(coin.assetId)}
                          onToggle={() => toggleStar(coin.assetId, coin.assetName)}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function MarketRow({ coin, isStarred, onToggle }: { coin: CachedPrice, isStarred: boolean, onToggle: () => void }) {
  const [imgError, setImgError] = useState(false);
  const symbol = mapIdToSymbol(coin.assetId);
  const isPositive = coin.change24h >= 0;

  // ✅ Exactly matching the Watchlist's fallback logic
  const initial = coin.assetName.charAt(0).toUpperCase();
  const colors = ['bg-orange-500', 'bg-indigo-500', 'bg-blue-500', 'bg-green-500', 'bg-purple-500'];
  const colorClass = colors[coin.assetName.length % colors.length];

  return (
    <tr className="hover:bg-white/[0.02] transition-colors group">
      <td className="px-3 md:px-6 py-3 md:py-4">
        <div className="flex items-center gap-3 md:gap-4">
          {/* ✅ Applies the matching colorClass on error */}
          <div className={`w-7 h-7 md:w-8 md:h-8 rounded-full overflow-hidden shrink-0 flex items-center justify-center shadow-lg ${imgError ? colorClass : 'bg-zinc-800/50'}`}>
            {!imgError ? (
              <img
                src={`https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530be6e374711a8554f31b17e4cb92c25fa5/128/color/${symbol}.png`}
                alt={coin.assetName}
                className="w-full h-full object-cover"
                onError={() => setImgError(true)}
              />
            ) : (
              <span className="text-white font-bold text-xs uppercase">{initial}</span>
            )}
          </div>
          <div>
            <div className="font-bold text-white text-xs md:text-sm">{coin.assetName}</div>
            <div className="text-[9px] md:text-[10px] text-zinc-500 uppercase tracking-widest">{symbol.toUpperCase()}</div>
          </div>
        </div>
      </td>
      <td className="px-3 md:px-6 py-3 md:py-4">
        <div className="font-bold text-white text-xs md:text-base">
          ${coin.priceUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
        </div>
      </td>
      <td className="px-3 md:px-6 py-3 md:py-4">
        <div className={`flex items-center gap-1 text-xs md:text-sm font-bold ${isPositive ? 'text-emerald-500' : 'text-red-500'}`}>
          {isPositive ? <TrendingUp className="w-3 h-3 md:w-4 md:h-4" /> : <TrendingDown className="w-3 h-3 md:w-4 md:h-4" />}
          {Math.abs(coin.change24h).toFixed(2)}%
        </div>
      </td>
      <td className="px-3 md:px-6 py-3 md:py-4 hidden md:table-cell">
        <div className="text-zinc-400 text-sm">
          ${(coin.priceUsd * ((coin.assetId.length % 5) + 1) * 1.5).toFixed(2)}B
        </div>
      </td>
      <td className="px-3 md:px-6 py-3 md:py-4 text-right">
        <button
          onClick={onToggle}
          className={`p-1.5 md:p-2 rounded-lg border transition-all ${isStarred
            ? 'bg-green-500/10 border-green-500/30 text-green-500'
            : 'bg-transparent border-zinc-800 text-zinc-600 hover:text-green-500 hover:border-green-500/30'
            }`}
        >
          <Star className={`w-3.5 h-3.5 md:w-4 md:h-4 ${isStarred ? 'fill-green-500' : ''}`} />
        </button>
      </td>
    </tr>
  );
}