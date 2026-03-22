"use client";

import { useState, useRef, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { useUploadThing } from '@/lib/uploadthing'; // ✅ NEW: Cloud Upload Hook
import {
    ShieldCheck, LayoutGrid, List, Bell, Search, User, Settings,
    LogOut, Zap, Camera, Edit2, Check, X, Loader2, MapPin, Mail
} from 'lucide-react';

export default function ProfilePage() {
    // Grab the 'status' so we know exactly when NextAuth finishes loading
    const { data: session, status, update } = useSession();
    const fileInputRef = useRef<HTMLInputElement>(null);

    // ─── STATE ───
    const [isEditingName, setIsEditingName] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [isUploadingImage, setIsUploadingImage] = useState(false);

    // Local state (Starts empty, gets filled by useEffect when session loads)
    const [tempName, setTempName] = useState('FRAZ_OPERATOR');
    const [profileImage, setProfileImage] = useState<string | null>(null);

    // Watch the session. When it's ready, instantly update our UI state.
    useEffect(() => {
        if (session?.user) {
            setTempName(session.user.name || 'FRAZ_OPERATOR');
            setProfileImage(session.user.image || null);
        }
    }, [session]);

    // ─── NEW: CLOUD UPLOAD HOOK ───
    const { startUpload } = useUploadThing("agentAvatar", {
        onClientUploadComplete: async (res) => {
            if (res && res[0]) {
                const newCloudUrl = res[0].url;
                setProfileImage(newCloudUrl); // Update local UI immediately
                await update({ image: newCloudUrl }); // Sync with NextAuth session
            }
            setIsUploadingImage(false);
        },
        onUploadError: (error) => {
            console.error("Cloud upload failed:", error);
            setIsUploadingImage(false);
            alert(`Upload failed: ${error.message}`);
        },
    });

    // ─── HANDLERS ───

    const triggerFilePicker = () => fileInputRef.current?.click();

    // ✅ UPDATED: Now uses UploadThing instead of base64
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploadingImage(true);

        // This securely sends the file to the cloud, which updates your DB!
        await startUpload([file]);
    };

    const handleRemovePhoto = async (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsUploadingImage(true);
        try {
            const res = await fetch('/api/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image: null })
            });

            if (res.ok) {
                setProfileImage(null);
                await update({ image: null });
            } else {
                console.error("Failed to remove image from DB");
            }
        } catch (error) {
            console.error("Error removing image:", error);
        } finally {
            setIsUploadingImage(false);
        }
    };

    const handleNameSave = async () => {
        setIsUpdating(true);

        try {
            const res = await fetch('/api/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: tempName })
            });

            if (res.ok) {
                await update({ name: tempName });
                setIsEditingName(false);
            } else {
                console.error("Failed to save name to DB");
            }
        } catch (error) {
            console.error("Error saving name:", error);
        } finally {
            setIsUpdating(false);
        }
    };

    // Sleek Loading Screen to prevent the FOUC (Flash of Unstyled Content)
    if (status === "loading") {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#050505]">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 animate-spin text-green-500" />
                    <p className="text-[10px] text-green-500 font-mono tracking-[0.3em] uppercase animate-pulse">
                        Decrypting Identity Hub...
                    </p>
                </div>
            </div>
        );
    }

    const userInitial = tempName.charAt(0).toUpperCase();

    return (
        <div className="min-h-screen flex bg-[#050505] text-white font-mono selection:bg-green-500/30">

            {/* ─── SIDEBAR ─── */}
            <aside className="w-64 border-r border-green-900/20 bg-[#0a0a0a] p-6 hidden md:flex flex-col justify-between z-10">
                <div>
                    <div className="flex items-center gap-3 mb-12 text-green-500">
                        <ShieldCheck className="w-8 h-8" />
                        <div>
                            <h1 className="font-bold tracking-widest text-lg">BITBASH</h1>
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
                        <Link href="/market" className="flex items-center p-3 hover:text-white hover:bg-white/5 rounded-lg transition-all">
                            <Search className="w-4 h-4 mr-3" /> Market Data
                        </Link>
                        <Link href="/profile" className="flex items-center bg-green-500/10 text-green-500 p-3 mt-8 rounded-lg border border-green-500/20 font-bold relative transition-all">
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-green-500 rounded-r" />
                            <User className="w-4 h-4 mr-3" /> Profile
                        </Link>
                        <Link href="/settings" className="flex items-center p-3 hover:text-white hover:bg-white/5 rounded-lg transition-all">
                            <Settings className="w-4 h-4 mr-3" /> Settings
                        </Link>
                    </nav>
                </div>

                {/* Sidebar Profile Mini-Badge */}
                <div className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-xl">
                    <div className="w-8 h-8 rounded bg-green-900 text-green-500 flex items-center justify-center font-bold overflow-hidden uppercase">
                        {profileImage ? <img src={profileImage} className="w-full h-full object-cover" /> : userInitial}
                    </div>
                    <div className="overflow-hidden">
                        <p className="text-xs font-bold text-white truncate uppercase">{tempName}</p>
                        <p className="text-[10px] text-zinc-500 truncate">{session?.user?.email}</p>
                    </div>
                </div>
            </aside>

            {/* ─── MAIN CONTENT ─── */}
            <main className="flex-1 overflow-y-auto p-6 md:p-10">
                <div className="max-w-4xl mx-auto">

                    <header className="mb-12">
                        <h1 className="text-4xl font-black italic tracking-tighter uppercase leading-none">Agent Profile</h1>
                        <p className="text-[10px] text-zinc-500 tracking-[0.3em] uppercase mt-2">Central Identity Hub</p>
                    </header>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                        {/* LEFT: IDENTITY SECTION */}
                        <div className="bg-[#0a0a0a] border border-zinc-800 rounded-2xl p-8 flex flex-col items-center text-center">

                            <div className="flex flex-col items-center mb-8">
                                <div className="relative group cursor-pointer" onClick={triggerFilePicker}>
                                    <div className="w-32 h-32 border-2 border-dashed border-zinc-700 rounded-2xl flex items-center justify-center text-green-500 text-5xl font-black overflow-hidden relative shadow-[0_0_40px_rgba(34,197,94,0.1)] group-hover:border-green-500 transition-all">
                                        {isUploadingImage ? (
                                            <Loader2 className="w-8 h-8 animate-spin text-green-500" />
                                        ) : profileImage ? (
                                            <img src={profileImage} alt="Profile" className="w-full h-full object-cover group-hover:opacity-40 transition-opacity" />
                                        ) : (
                                            userInitial
                                        )}
                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/60 transition-opacity">
                                            <Camera className="w-8 h-8 text-white" />
                                        </div>
                                    </div>
                                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-[4px] border-[#0a0a0a] rounded-full animate-pulse" />
                                </div>

                                {/* Remove Photo Button */}
                                {profileImage && (
                                    <button
                                        onClick={handleRemovePhoto}
                                        disabled={isUploadingImage}
                                        className="mt-4 text-[10px] text-red-500 hover:text-red-400 hover:bg-red-500/10 py-1 px-3 rounded transition-all flex items-center gap-1 font-bold uppercase tracking-widest z-20 disabled:opacity-50"
                                    >
                                        {isUploadingImage ? <Loader2 className="w-3 h-3 animate-spin" /> : <X className="w-3 h-3" />} Remove Photo
                                    </button>
                                )}
                            </div>

                            {/* EDITABLE NAME SECTION */}
                            <div className="w-full mb-10">
                                {isEditingName ? (
                                    <div className="space-y-3">
                                        <label className="text-[10px] text-zinc-500 tracking-widest uppercase block text-left">New Identity Handle</label>
                                        <input
                                            value={tempName}
                                            onChange={(e) => setTempName(e.target.value.toUpperCase())}
                                            className="w-full bg-zinc-900 border border-green-500/50 rounded-xl px-4 py-3 text-center text-sm text-white focus:outline-none focus:ring-1 focus:ring-green-500"
                                            autoFocus
                                            placeholder="ENTER_NAME"
                                        />
                                        <div className="flex gap-2 justify-center">
                                            <button
                                                onClick={handleNameSave}
                                                disabled={isUpdating}
                                                className="flex-1 py-2 bg-green-500/10 text-green-500 rounded-lg text-[10px] font-bold uppercase hover:bg-green-500/20 transition-all flex items-center justify-center gap-1 disabled:opacity-50"
                                            >
                                                {isUpdating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />} Sync
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setIsEditingName(false);
                                                    setTempName(session?.user?.name || 'FRAZ_OPERATOR');
                                                }}
                                                disabled={isUpdating}
                                                className="flex-1 py-2 bg-red-500/10 text-red-500 rounded-lg text-[10px] font-bold uppercase hover:bg-red-500/20 transition-all flex items-center justify-center gap-1 disabled:opacity-50"
                                            >
                                                <X className="w-3 h-3" /> Cancel
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="group/name relative">
                                        <h2 className="text-2xl font-black tracking-tighter uppercase flex items-center justify-center gap-3">
                                            {tempName}
                                            <Edit2
                                                onClick={() => setIsEditingName(true)}
                                                className="w-4 h-4 text-zinc-600 cursor-pointer hover:text-green-500 transition-all opacity-0 group-hover/name:opacity-100"
                                            />
                                        </h2>
                                        <p className="text-[10px] text-zinc-600 tracking-[0.3em] uppercase mt-1">Operator Badge 04</p>
                                    </div>
                                )}
                            </div>

                            {/* Terminate Session Button */}
                            <button
                                onClick={() => signOut({ callbackUrl: '/login' })}
                                className="w-full py-3 flex items-center justify-center gap-2 border border-red-500/30 bg-red-500/5 hover:bg-red-500/10 text-red-500 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all"
                            >
                                <LogOut className="w-4 h-4" /> Terminate Session
                            </button>
                        </div>

                        {/* RIGHT: SYSTEM INFO SECTION */}
                        <div className="lg:col-span-2 space-y-6">
                            <div className="bg-[#0a0a0a] border border-zinc-800 rounded-2xl p-8">
                                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-8 flex items-center gap-2">
                                    <Zap className="w-4 h-4 text-green-500" /> Operational Credentials
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="p-5 bg-black/40 border border-zinc-800/50 rounded-xl">
                                        <div className="flex items-center gap-2 text-zinc-500 mb-2">
                                            <Mail className="w-3 h-3" /> <span className="text-[10px] uppercase tracking-widest">Linked Email</span>
                                        </div>
                                        <p className="text-sm font-bold truncate text-zinc-300">{session?.user?.email}</p>
                                    </div>
                                    <div className="p-5 bg-black/40 border border-zinc-800/50 rounded-xl">
                                        <div className="flex items-center gap-2 text-zinc-500 mb-2">
                                            <MapPin className="w-3 h-3" /> <span className="text-[10px] uppercase tracking-widest">Base Location</span>
                                        </div>
                                        <p className="text-sm font-bold text-zinc-300">LAHORE, PK</p>
                                    </div>
                                </div>

                                <div className="mt-6 p-5 bg-green-500/5 border border-green-500/10 rounded-xl flex items-center justify-between">
                                    <div>
                                        <p className="text-[10px] text-green-700 font-bold uppercase tracking-widest">Node Encryption Status</p>
                                        <p className="text-xs font-bold text-green-500 mt-1">VERIFIED_SECURE</p>
                                    </div>
                                    <ShieldCheck className="w-8 h-8 text-green-500/30" />
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </main>
        </div>
    );
}