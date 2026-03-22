"use client";

import useSWR from 'swr';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import {
  ShieldCheck, Bell, AlertTriangle, Clock, Activity,
  LayoutGrid, List, Search, User, Settings
} from 'lucide-react';

// ✅ IMPORT MOBILE NAVBAR
import MobileNavbar from '@/components/Navbar';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface Alert {
  id: string;
  asset_id: string;
  asset_name: string;
  drop_percentage: number;
  price_at_drop: number; // matched DB
  detected_at: string;   // matched DB
}

export default function AlertsPage() {
  const { data: session } = useSession();

  const { data, error, isLoading } = useSWR('/api/alerts', fetcher, {
    refreshInterval: 5000,
  });

  const alerts: Alert[] = Array.isArray(data) ? data : [];

  const getSymbol = (id: string) => {
    const symbols: Record<string, string> = {
      bitcoin: 'BTC',
      ethereum: 'ETH',
      solana: 'SOL',
      cardano: 'ADA',
      polkadot: 'DOT'
    };
    return symbols[id.toLowerCase()] || id.substring(0, 4).toUpperCase();
  };

  return (
    <div className="min-h-screen flex bg-[#050505] text-white font-mono selection:bg-red-500/30">

      {/* ✅ INJECT MOBILE NAVBAR HERE */}
      <MobileNavbar />

      {/* ─── DESKTOP SIDEBAR (Untouched) ─── */}
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

            <Link href="/watchlist" className="flex items-center p-3 hover:text-white hover:bg-white/5 rounded-lg transition-all cursor-pointer">
              <List className="w-4 h-4 mr-3" /> Watchlist
            </Link>

            {/* ACTIVE STATE: ALERTS */}
            <Link href="/alerts" className="flex items-center bg-green-500/10 text-green-500 p-3 rounded-lg border border-green-500/20 font-bold transition-all cursor-pointer relative">
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-green-500 rounded-r" />
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
        {/* ✅ MOBILE PADDING ADDED (px-4 pt-24 pb-28 md:p-10) */}
        <div className="flex-1 overflow-y-auto px-4 pt-24 pb-28 md:p-10">
          <div className="max-w-5xl mx-auto">

            {/* ─── ALERTS HEADER ─── */}
            <header className="mb-8 md:mb-10">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-transparent border border-green-500/30 rounded-xl flex items-center justify-center flex-shrink-0 shadow-[0_0_15px_rgba(34,197,94,0.05)]">
                  <Bell className="w-5 h-5 md:w-6 md:h-6 text-green-500" />
                </div>
                <div>
                  {/* ✅ Text dynamically scales for mobile */}
                  <h1 className="text-2xl md:text-3xl font-black italic tracking-wider text-white uppercase">
                    Alert Log
                  </h1>
                  <p className="text-[10px] text-zinc-500 tracking-widest uppercase mt-1">
                    System Protocol Violations
                  </p>
                </div>
              </div>
            </header>

            <div className="space-y-4">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 text-red-500/50">
                  <Activity className="w-8 h-8 animate-pulse mb-4" />
                  <p className="tracking-widest text-xs">SCANNING FOR VIOLATIONS...</p>
                </div>
              ) : error ? (
                <div className="p-6 bg-red-900/10 border border-red-500/20 rounded-xl text-red-400">
                  <p className="font-bold tracking-widest">UPLINK FAILED</p>
                  <p className="text-sm">Cannot reach alert database.</p>
                </div>
              ) : alerts.length === 0 ? (
                <div className="bg-[#0a0a0a] border border-dashed border-zinc-800 rounded-2xl p-8 md:p-12 text-center text-zinc-500">
                  <Bell className="w-8 h-8 mx-auto mb-4 opacity-20" />
                  <p className="tracking-widest text-sm uppercase">No Alerts Recorded</p>
                  <p className="text-xs mt-2">Flash crash alerts appear here when any asset drops ≥ 2% within a polling cycle.</p>
                </div>
              ) : (
                alerts.map((alert) => (
                  // ✅ MOBILE CARD RESTRUCTURE: Items start at the top, allowing the inner content to stack properly.
                  <div
                    key={alert.id}
                    className="flex items-start p-4 md:p-5 bg-[#0a0a0a] border border-zinc-800 rounded-xl hover:border-red-900/50 transition-colors group"
                  >
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center flex-shrink-0 mr-3 md:mr-5 group-hover:bg-red-500/20 transition-colors">
                      <AlertTriangle className="w-5 h-5 md:w-6 md:h-6 text-red-500" />
                    </div>

                    {/* ✅ Inner Wrapper: Stacks on mobile (flex-col), row on desktop (md:flex-row) */}
                    <div className="flex-1 min-w-0 flex flex-col md:flex-row md:items-center">
                      <div className="flex-1 min-w-0 pr-0 md:pr-4">
                        <h3 className="text-white font-bold tracking-wide text-base md:text-lg flex flex-wrap items-baseline gap-2 truncate">
                          {getSymbol(alert.asset_id)} CRITICAL
                          <span className="text-zinc-500 text-[10px] md:text-xs font-normal tracking-widest">
                            @{Number(alert.price_at_drop).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 })} USD
                          </span>
                        </h3>
                        <p className="text-zinc-400 text-xs md:text-sm mt-1 truncate">
                          Sudden price drop of {Math.abs(alert.drop_percentage).toFixed(2)}% triggered emergency protocols.
                        </p>
                      </div>

                      {/* ✅ Timestamp: Drops below text on mobile, aligns right on desktop */}
                      <div className="text-zinc-500 text-[9px] md:text-[10px] tracking-widest flex items-center gap-1.5 flex-shrink-0 mt-3 md:mt-0">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(alert.detected_at).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                          second: '2-digit',
                          hour12: true
                        })}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}