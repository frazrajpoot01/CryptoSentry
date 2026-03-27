"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
    ShieldCheck,
    LayoutGrid,
    List,
    Bell,
    Search,
    User,
    Settings,
    BellRing,
    Save,
    Loader2 // Added for the loading spinner
} from 'lucide-react';

export default function SettingsPage() {
    const { data: session } = useSession();

    // Interactive State Variables
    const [sensitivity, setSensitivity] = useState(-2.0);
    const [aggressivePolling, setAggressivePolling] = useState(false);
    const [isSaving, setIsSaving] = useState(false); // New saving state

    // ✅ FIXED: Load ALL saved preferences on mount so the UI remembers after a refresh
    useEffect(() => {
        const savedSensitivity = localStorage.getItem('bitbash-sensitivity');
        const savedPolling = localStorage.getItem('bitbash-polling');

        if (savedSensitivity) setSensitivity(parseFloat(savedSensitivity));
        if (savedPolling) setAggressivePolling(savedPolling === 'true');
    }, []);

    // Extract user details or use fallbacks for sidebar
    const userName = session?.user?.name || 'OPERATOR';
    const userInitial = userName.charAt(0).toUpperCase();

    // ─── THE MAIN COMMIT HANDLER ───
    const handleCommitChanges = async () => {
        setIsSaving(true);

        // ✅ FIXED: Save ALL settings to local browser storage so they survive a refresh
        localStorage.setItem('bitbash-sensitivity', sensitivity.toString());
        localStorage.setItem('bitbash-polling', aggressivePolling.toString());

        // Determine interval (10s for aggressive, 60s for normal)
        const intervalToSet = aggressivePolling ? 10000 : 60000;

        try {
            // Send to our Next.js API Bridge
            const response = await fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    threshold: sensitivity,
                    interval: intervalToSet,
                }),
            });

            if (response.ok) {
                alert('✅ SYSTEM PROTOCOLS UPDATED');
            } else {
                alert('❌ FAILED TO UPDATE PROTOCOLS. Check Server.');
            }
        } catch (error) {
            console.error('Error saving settings:', error);
            alert('❌ NETWORK ERROR. Mission Control Unreachable.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="min-h-screen flex bg-[#050505] text-white font-mono selection:bg-green-500/30">
            {/* ─── DESKTOP SIDEBAR ─── */}
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
                        <a href="/" className="flex items-center p-3 hover:text-white hover:bg-white/5 rounded-lg transition-all cursor-pointer">
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

                        {/* ACTIVE STATE: SETTINGS */}
                        <a href="/settings" className="flex items-center bg-green-500/10 text-green-500 p-3 rounded-lg border border-green-500/20 font-bold transition-all cursor-pointer relative">
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-green-500 rounded-r" />
                            <Settings className="w-4 h-4 mr-3" /> Settings
                        </a>
                    </nav>
                </div>

                {/* Profile Widget with Image Support */}
                {session?.user && (
                    <div className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-xl mt-auto">
                        <div className="w-8 h-8 rounded bg-green-900 text-green-500 flex items-center justify-center font-bold overflow-hidden uppercase">
                            {session.user.image ? (
                                <img src={session.user.image} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                userInitial
                            )}
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-xs font-bold text-white truncate uppercase">{userName}</p>
                            <p className="text-[10px] text-zinc-500 truncate">{session.user.email}</p>
                        </div>
                    </div>
                )}
            </aside>

            {/* ─── MAIN CONTENT ─── */}
            <main className="flex-1 flex flex-col relative overflow-hidden">
                <div className="flex-1 overflow-y-auto p-6 md:p-10">
                    <div className="max-w-3xl mx-auto pb-24">

                        {/* ─── HEADER ─── */}
                        <header className="mb-10 flex items-center gap-4">
                            <div className="w-12 h-12 bg-transparent border border-green-500/30 rounded-xl flex items-center justify-center flex-shrink-0 shadow-[0_0_15px_rgba(34,197,94,0.05)]">
                                <Settings className="w-6 h-6 text-green-500" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-black italic tracking-wider text-white uppercase">
                                    System Settings
                                </h1>
                                <p className="text-xs text-zinc-500 tracking-widest uppercase mt-1">
                                    Global Protocol Configurations
                                </p>
                            </div>
                        </header>

                        <div className="space-y-6">

                            {/* ─── THRESHOLD MONITORING CARD ─── */}
                            <div className="bg-[#0a0a0a] border border-zinc-800 rounded-2xl p-8">
                                <h3 className="text-sm font-bold tracking-widest text-white uppercase flex items-center gap-2 mb-8">
                                    <BellRing className="w-4 h-4 text-green-500" />
                                    Threshold Monitoring
                                </h3>

                                {/* Slider Section */}
                                <div className="mb-10">
                                    <div className="flex justify-between items-end mb-4">
                                        <label className="text-xs font-bold text-zinc-300 tracking-widest uppercase">Critical Sensitivity</label>
                                        <span className="text-green-500 font-bold tracking-widest">{sensitivity.toFixed(1)}%</span>
                                    </div>

                                    {/* ✅ UPDATED: max changed to -0.1 */}
                                    <input
                                        type="range"
                                        min="-10.0"
                                        max="-0.1"
                                        step="0.1"
                                        value={sensitivity}
                                        onChange={(e) => setSensitivity(parseFloat(e.target.value))}
                                        className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-green-500 hover:accent-green-400 transition-all mb-4"
                                    />

                                    <p className="text-[10px] text-zinc-600 tracking-widest uppercase font-sans">
                                        Trigger emergency protocols when price drop exceeds this threshold within a 30s cycle.
                                    </p>
                                </div>

                                {/* Polling Toggle Section */}
                                <div className="flex items-center justify-between p-5 bg-black/40 border border-zinc-800/50 rounded-xl">
                                    <div>
                                        <p className="text-sm font-bold text-zinc-300 mb-1">Aggressive Polling</p>
                                        <p className="text-[10px] text-zinc-600 tracking-widest uppercase">Increase frequency to 10s intervals</p>
                                    </div>

                                    <button
                                        onClick={() => setAggressivePolling(!aggressivePolling)}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${aggressivePolling ? 'bg-green-500' : 'bg-zinc-800'}`}
                                    >
                                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${aggressivePolling ? 'translate-x-6' : 'translate-x-1'}`} />
                                    </button>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>

                {/* ─── FIXED FOOTER ACTIONS ─── */}
                <div className="absolute bottom-0 inset-x-0 p-6 bg-gradient-to-t from-[#050505] via-[#050505] to-transparent pointer-events-none flex justify-end">
                    <button
                        className={`pointer-events-auto flex items-center gap-2 px-8 py-4 rounded-xl font-bold tracking-widest uppercase text-sm transition-all shadow-[0_0_20px_rgba(34,197,94,0.2)] active:scale-95 ${isSaving ? 'bg-green-800 text-green-300 cursor-not-allowed' : 'bg-green-600 hover:bg-green-500 text-white'
                            }`}
                        onClick={handleCommitChanges}
                        disabled={isSaving}
                    >
                        {isSaving ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Processing...
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4" />
                                Commit Changes
                            </>
                        )}
                    </button>
                </div>
            </main>
        </div>
    );
}