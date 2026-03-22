import Navbar from '@/components/Navbar';
import LivePriceGrid from '@/components/LivePriceGrid';
import { ShieldCheck, TerminalSquare, LayoutGrid, List, Bell, Search, User, Settings } from 'lucide-react';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

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

async function getInitialPrices(): Promise<{ data: CachedPrice[]; stale: boolean }> {
  try {
    const res = await fetch(
      `${process.env.EXPRESS_SERVER_URL || 'http://localhost:4000'}/cache`,
      { cache: 'no-store' }
    );

    if (!res.ok) return { data: [], stale: true };

    const payload: PricesResponse = await res.json();
    const ageMs = Date.now() - new Date(payload.fetchedAt).getTime();
    const stale = ageMs > 60_000;

    return { data: payload.data ?? [], stale };
  } catch {
    return { data: [], stale: true };
  }
}

export default async function DashboardPage() {
  // Fetch initial prices and secure user session
  const { data: initialData, stale: initialStale } = await getInitialPrices();
  const session = await getServerSession(authOptions);

  return (
    <div className="min-h-screen flex bg-[#050505] text-white font-mono selection:bg-green-500/30">

      {/* ✅ INJECT MOBILE NAVBAR HERE */}
      <Navbar />

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
            {/* ACTIVE STATE: DASHBOARD */}
            <a href="/" className="flex items-center bg-green-500/10 text-green-500 p-3 rounded-lg border border-green-500/20 font-bold transition-all cursor-pointer relative">
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-green-500 rounded-r" />
              <LayoutGrid className="w-4 h-4 mr-3" /> Dashboard
            </a>
            <a href="/watchlist" className="flex items-center p-3 hover:text-white hover:bg-white/5 rounded-lg transition-all cursor-pointer">
              <List className="w-4 h-4 mr-3" /> Watchlist
            </a>
            <a href="/alerts" className="flex items-center p-3 hover:text-white hover:bg-white/5 rounded-lg transition-all cursor-pointer">
              <Bell className="w-4 h-4 mr-3" /> Alerts
            </a>
            <a href="/market" className="flex items-center p-3 hover:text-white hover:bg-white/5 rounded-lg transition-all cursor-pointer">
              <Search className="w-4 h-4 mr-3" /> Market Data
            </a>
            <a href="/profile" className="flex items-center p-3 hover:text-white hover:bg-white/5 rounded-lg transition-all cursor-pointer mt-8">
              <User className="w-4 h-4 mr-3" /> Profile
            </a>
            <a href="/settings" className="flex items-center p-3 hover:text-white hover:bg-white/5 rounded-lg transition-all cursor-pointer">
              <Settings className="w-4 h-4 mr-3" /> Settings
            </a>
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
      <main className="flex-1 flex flex-col relative overflow-hidden z-0">
        {/* Ambient cyber glow */}
        <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-green-900/10 rounded-full blur-[120px] pointer-events-none -z-10" />

        {/* ✅ MOBILE PADDING ADDED (px-4 pt-24 pb-28 md:p-10) */}
        <div className="flex-1 overflow-y-auto px-4 pt-24 pb-28 md:p-10">
          <div className="max-w-7xl mx-auto">

            {/* ─── TERMINAL HEADER ─── */}
            <header className="mb-8 md:mb-10">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(34,197,94,0.1)] flex-shrink-0">
                  <TerminalSquare className="w-5 h-5 md:w-6 md:h-6 text-green-500" />
                </div>
                <div>
                  {/* ✅ Text dynamically scales for mobile */}
                  <h1 className="text-2xl md:text-3xl font-black italic tracking-wider text-white">
                    TERMINAL ONE
                  </h1>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.8)]" />
                    <span className="text-[10px] md:text-xs text-green-500/70 tracking-widest uppercase truncate">
                      Real-Time Intelligence Aggregate V4.2.0
                    </span>
                  </div>
                </div>
              </div>
            </header>

            {/* ─── LIVE GRID COMPONENT ─── */}
            {/* Note: If your LivePriceGrid cards look squished on mobile, make sure the grid inside LivePriceGrid has `grid-cols-1 md:grid-cols-2 lg:grid-cols-3` */}
            <LivePriceGrid initialData={initialData} initialStale={initialStale} />

          </div>
        </div>
      </main>
    </div>
  );
}