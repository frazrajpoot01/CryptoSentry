"use client";

// 1. Merged lucide-react imports into one block
import {
    ShieldCheck, Star, Trash2, ExternalLink, Activity, Plus,
    LayoutGrid, List, Bell, Search, User, Settings
} from 'lucide-react';
import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

// ✅ IMPORT YOUR MOBILE NAVBAR
import MobileNavbar from '@/components/Navbar';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface CachedPrice {
    assetId: string;
    assetName: string;
    priceUsd: number;
    change24h: number;
    lastUpdated: string;
}

// ─── HELPER: MAP BACKEND ID TO SYMBOL (Imported from MarketData) ───
const mapIdToSymbol = (id: string) => {
    const symbols: Record<string, string> = {
        bitcoin: 'btc', ethereum: 'eth', solana: 'sol', cardano: 'ada', polkadot: 'dot',
        dogecoin: 'doge', ripple: 'xrp', shiba: 'shib', avalanche: 'avax', chainlink: 'link',
        tether: 'usdt', 'usd-coin': 'usdc'
    };
    return symbols[id.toLowerCase()] || id.toLowerCase().substring(0, 4);
};

export default function WatchlistPage() {
    const { data: session, status } = useSession();

    // Grab the live URL we exposed in next.config.ts
    const API_URL = process.env.EXPRESS_SERVER_URL || 'http://localhost:4000';

    const { data, error, isLoading } = useSWR(`${API_URL}/cache`, fetcher, {
        refreshInterval: 10000,
    });

    const [watchlist, setWatchlist] = useState<string[]>([]);
    const [isUpdating, setIsUpdating] = useState(false);

    useEffect(() => {
        if (session?.user) {
            fetch('/api/watchlist')
                .then(res => res.json())
                .then(data => {
                    if (data.watchlist) {
                        // Ensure your backend 'asset_id' matches your frontend 'assetId'
                        setWatchlist(data.watchlist.map((item: any) => item.asset_id));
                    }
                })
                .catch(err => console.error("Failed to load watchlist", err));
        }
    }, [session]);

    const toggleStar = async (assetId: string, assetName: string) => {
        if (!session || isUpdating) {
            if (!session) alert("Please log in to save to your watchlist!");
            return;
        }

        setIsUpdating(true);
        const isStarred = watchlist.includes(assetId);

        try {
            if (isStarred) {
                const res = await fetch(`/api/watchlist?asset_id=${assetId}`, { method: 'DELETE' });
                if (!res.ok) throw new Error(`Delete failed: ${res.status}`);
                setWatchlist(prev => prev.filter(id => id !== assetId));
            } else {
                const res = await fetch('/api/watchlist', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ asset_id: assetId, asset_name: assetName })
                });
                if (!res.ok) throw new Error(`Save failed: ${res.status}`);
                setWatchlist(prev => [...prev, assetId]);
            }
        } catch (error: any) {
            alert("Database Error: " + error.message);
        } finally {
            setIsUpdating(false);
        }
    };

    const allPrices: CachedPrice[] = data?.data || [];
    const starredCoins = allPrices.filter(coin => watchlist.includes(coin.assetId));
    const unstarredCoins = allPrices.filter(coin => !watchlist.includes(coin.assetId));

    return (
        <div className="min-h-screen flex bg-[#050505] text-white font-mono selection:bg-green-500/30">

            {/* ✅ INJECT MOBILE NAVBAR HERE */}
            <MobileNavbar />

            {/* ─── DESKTOP SIDEBAR (Remains completely untouched) ─── */}
            <aside className="w-64 border-r border-green-900/20 bg-[#0a0a0a] p-6 hidden md:flex flex-col justify-between z-10 shadow-[4px_0_24px_rgba(0,0,0,0.5)]">
                <div>
                    <div className="flex items-center gap-3 mb-12 text-green-500">
                        <ShieldCheck className="w-8 h-8" />
                        <div>
                            <h1 className="font-bold tracking-widest text-lg">BITBASH</h1>
                            <p className="text-[10px] text-green-700 tracking-widest uppercase">Sentry V4</p>
                        </div>
                    </div>

                    <nav className="space-y-3 text-sm text-zinc-400">
                        <Link href="/" className="flex items-center p-3 hover:text-white hover:bg-white/5 rounded-lg transition-all cursor-pointer">
                            <LayoutGrid className="w-4 h-4 mr-3" /> Dashboard
                        </Link>

                        <Link href="/watchlist" className="flex items-center bg-green-500/10 text-green-500 p-3 rounded-lg border border-green-500/20 font-bold transition-all cursor-pointer relative">
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-green-500 rounded-r" />
                            <List className="w-4 h-4 mr-3" /> Watchlist
                        </Link>

                        <Link href="/alerts" className="flex items-center p-3 hover:text-white hover:bg-white/5 rounded-lg transition-all cursor-pointer">
                            <Bell className="w-4 h-4 mr-3" /> Alerts
                        </Link>

                        <Link href="/market" className="flex items-center p-3 hover:text-white hover:bg-white/5 rounded-lg transition-all cursor-pointer">
                            <Search className="w-4 h-4 mr-3" /> Market Data
                        </Link>

                        <Link href="/profile" className="flex items-center p-3 hover:text-white hover:bg-white/5 rounded-lg transition-all cursor-pointer mt-8">
                            <User className="w-4 h-4 mr-3" /> Profile
                        </Link>

                        <Link href="/settings" className="flex items-center p-3 hover:text-white hover:bg-white/5 rounded-lg transition-all cursor-pointer">
                            <Settings className="w-4 h-4 mr-3" /> Settings
                        </Link>
                    </nav>
                </div>

                {/* Profile Widget */}
                {session?.user && (
                    <div className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-xl mt-auto">
                        <div className="w-8 h-8 rounded bg-green-900 text-green-500 flex items-center justify-center font-bold overflow-hidden uppercase">
                            {session.user.image ? (
                                <img src={session.user.image} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                session.user.name?.charAt(0).toUpperCase() || session.user.email?.charAt(0).toUpperCase() || 'U'
                            )}
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-xs font-bold text-white truncate uppercase">{session.user.name || 'OPERATOR'}</p>
                            <p className="text-[10px] text-zinc-500 truncate">{session.user.email}</p>
                        </div>
                    </div>
                )}
            </aside>

            {/* ─── MAIN CONTENT ─── */}
            <main className="flex-1 flex flex-col relative overflow-hidden">
                {/* ✅ UPDATED CLASSES: Added px-4 pt-24 pb-24 for mobile clearing, with md:p-10 to keep desktop identical! */}
                <div className="flex-1 overflow-y-auto px-4 pt-24 pb-28 md:p-10">
                    <div className="max-w-7xl mx-auto">
                        <header className="mb-10">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 md:w-12 md:h-12 bg-transparent border border-green-500/30 rounded-xl flex items-center justify-center flex-shrink-0">
                                    <Star className="w-5 h-5 md:w-6 md:h-6 text-green-500" />
                                </div>
                                <div>
                                    {/* ✅ Mobile text shrunk slightly to text-2xl, snaps back to text-3xl on md */}
                                    <h1 className="text-2xl md:text-3xl font-black italic tracking-wider text-white uppercase">
                                        My Watchlist
                                    </h1>
                                    <p className="text-[10px] text-zinc-500 tracking-widest uppercase mt-1">
                                        Priority Operational Targets
                                    </p>
                                </div>
                            </div>
                        </header>

                        <div className="space-y-12">
                            {status === "unauthenticated" ? (
                                <div className="bg-red-900/10 border border-red-500/20 rounded-xl p-6 text-red-400 text-center font-sans tracking-wide">
                                    Auth token required. Please log in to manage operational targets.
                                </div>
                            ) : isLoading ? (
                                <div className="flex flex-col items-center justify-center py-20 text-green-500/50">
                                    <Activity className="w-8 h-8 animate-pulse mb-4" />
                                    <p className="tracking-widest text-xs">ESTABLISHING UPLINK...</p>
                                </div>
                            ) : (
                                <>
                                    <section>
                                        {starredCoins.length === 0 ? (
                                            <div className="bg-[#0a0a0a] border border-dashed border-zinc-800 rounded-2xl p-8 md:p-12 text-center text-zinc-500">
                                                <p className="tracking-widest text-sm uppercase">No priority targets acquired</p>
                                                <p className="text-xs mt-2">Add assets from the global feed below.</p>
                                            </div>
                                        ) : (
                                            /* ✅ Grid layout is already natively mobile responsive (grid-cols-1) */
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                                                {starredCoins.map((coin) => (
                                                    <WatchlistCard
                                                        key={coin.assetId}
                                                        coin={coin}
                                                        isStarred={true}
                                                        onToggle={() => toggleStar(coin.assetId, coin.assetName)}
                                                    />
                                                ))}
                                            </div>
                                        )}
                                    </section>

                                    <section className="pt-8 border-t border-zinc-900">
                                        <h2 className="text-sm font-bold text-zinc-500 tracking-widest mb-6 uppercase flex items-center gap-2">
                                            <Activity className="w-4 h-4" /> Global Intelligence Feed
                                        </h2>
                                        {/* ✅ Grid natively handles mobile stacking properly */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 opacity-60 hover:opacity-100 transition-opacity duration-500">
                                            {unstarredCoins.map((coin) => (
                                                <WatchlistCard
                                                    key={coin.assetId}
                                                    coin={coin}
                                                    isStarred={false}
                                                    onToggle={() => toggleStar(coin.assetId, coin.assetName)}
                                                />
                                            ))}
                                        </div>
                                    </section>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

// ─── REUSABLE CARD COMPONENT ───
function WatchlistCard({ coin, isStarred, onToggle }: { coin: CachedPrice, isStarred: boolean, onToggle: () => void }) {
    const [imgError, setImgError] = useState(false);
    const isPositive = coin.change24h >= 0;
    const initial = coin.assetName.charAt(0).toUpperCase();
    const colors = ['bg-orange-500', 'bg-indigo-500', 'bg-blue-500', 'bg-green-500', 'bg-purple-500'];
    const colorClass = colors[coin.assetName.length % colors.length];
    const symbol = mapIdToSymbol(coin.assetId);

    return (
        <div className="bg-[#0a0a0a] border border-zinc-800 p-5 rounded-2xl flex flex-col group hover:border-zinc-700 transition-colors">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">

                    <div className={`w-8 h-8 rounded-full overflow-hidden shrink-0 flex items-center justify-center shadow-lg ${imgError ? colorClass : 'bg-zinc-800/50'}`}>
                        {!imgError ? (
                            <img
                                src={`https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530be6e374711a8554f31b17e4cb92c25fa5/128/color/${symbol}.png`}
                                alt={coin.assetName}
                                className="w-full h-full object-cover"
                                onError={() => setImgError(true)}
                            />
                        ) : (
                            <span className="text-white font-bold">{initial}</span>
                        )}
                    </div>

                    <div>
                        <h3 className="text-sm font-bold text-white tracking-wide">{coin.assetName}</h3>
                        <span className="text-[10px] text-zinc-500 uppercase tracking-widest">{coin.assetId.substring(0, 4)}</span>
                    </div>
                </div>

                <button
                    onClick={onToggle}
                    className="p-2 rounded-lg text-zinc-600 hover:text-white hover:bg-white/5 transition-colors"
                >
                    {isStarred ? <Trash2 className="w-4 h-4 hover:text-red-500" /> : <Plus className="w-4 h-4 hover:text-green-500" />}
                </button>
            </div>

            <div className="mb-6">
                <p className="text-2xl font-bold text-white tracking-tight">
                    ${coin.priceUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                </p>
                <p className={`text-xs font-bold mt-1 ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                    {isPositive ? '+' : ''}{coin.change24h.toFixed(2)}%
                </p>
            </div>

            <button className="w-full py-2.5 mt-auto bg-white/5 hover:bg-white/10 text-zinc-400 text-[10px] tracking-widest font-bold uppercase rounded-lg transition-colors flex items-center justify-center gap-2">
                Full Analysis <ExternalLink className="w-3 h-3" />
            </button>
        </div>
    );
}