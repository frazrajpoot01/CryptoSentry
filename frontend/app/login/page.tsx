'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Mail, Lock, AlertCircle, Loader2, ArrowRight } from 'lucide-react';

type Mode = 'login' | 'signup';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'signup') {
        const res = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || 'Access Denied: Signup failed');
          setLoading(false);
          return;
        }
      }

      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("AUTHENTICATION_FAILURE: Invalid Credentials");
      } else {
        router.push('/');
        router.refresh();
      }
    } catch {
      setError('SYSTEM_ERROR: Connection timed out');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex text-white font-mono selection:bg-green-500/30">

      {/* ─── LEFT SIDE: ACCESS FORM ─── */}
      <div className="w-full lg:w-[45%] flex flex-col justify-center px-8 md:px-16 lg:px-24 z-10">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="max-w-md w-full"
        >
          {/* Sentry Icon */}
          <div className="w-12 h-12 border border-green-500/50 rounded-xl flex items-center justify-center mb-8 shadow-[0_0_15px_rgba(34,197,94,0.2)]">
            <Shield className="w-6 h-6 text-green-500" />
          </div>

          <header className="mb-10">
            <h1 className="text-4xl font-black italic tracking-tighter uppercase leading-none">
              Access Terminal
            </h1>
            <p className="text-[10px] text-zinc-500 tracking-[0.2em] uppercase mt-2">
              Establish Secure Link / Bitbash Sentry
            </p>
          </header>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div>
              <label className="text-[10px] text-zinc-500 tracking-widest uppercase mb-2 block">
                Email Identifier
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl pl-12 pr-4 py-4 text-sm focus:outline-none focus:border-green-500/50 transition-all"
                  placeholder="name@protocol.com"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="text-[10px] text-zinc-500 tracking-widest uppercase mb-2 block">
                Secure Passkey
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl pl-12 pr-4 py-4 text-sm focus:outline-none focus:border-green-500/50 transition-all"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {/* Error Message */}
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-center gap-2 text-red-500 text-[10px] uppercase tracking-widest bg-red-500/5 border border-red-500/20 rounded-lg p-3"
                >
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-500 hover:bg-green-400 text-black font-black uppercase italic py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(34,197,94,0.3)] disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin text-black" />
              ) : (
                <>
                  {mode === 'login' ? 'Initiate Login' : 'Register Operator'}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Divider */}
            <div className="flex items-center gap-4 my-8">
              <div className="h-[1px] flex-1 bg-zinc-800" />
              <span className="text-[10px] text-zinc-600 uppercase">or</span>
              <div className="h-[1px] flex-1 bg-zinc-800" />
            </div>

            {/* ✅ UPDATED: Google Sign In with official SVG and Callback URL */}
            <button
              type="button"
              onClick={() => signIn('google', { callbackUrl: '/' })}
              className="w-full bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 py-4 rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-3 transition-all"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Sign in with Google
            </button>
          </form>

          {/* Mode Toggle */}
          <p className="mt-10 text-center text-[10px] tracking-widest text-zinc-500 uppercase">
            {mode === 'login' ? "New operative?" : "Already cleared?"}{' '}
            <button
              onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
              className="text-green-500 font-bold hover:underline"
            >
              {mode === 'login' ? 'Request Access' : 'Return to Login'}
            </button>
          </p>
        </motion.div>
      </div>

      {/* ─── RIGHT SIDE: VISUAL SECTION ─── */}
      <div className="hidden lg:flex flex-1 relative bg-[#0a0a0a] border-l border-zinc-900 overflow-hidden">
        {/* Grid Overlay */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />

        {/* Placeholder for your 3D Asset/Chart Graphic */}
        <div className="absolute inset-0 flex flex-col items-center justify-center p-20">
          <div className="relative w-full h-full border border-zinc-800/50 rounded-2xl bg-zinc-950/50 backdrop-blur-sm p-8 flex flex-col justify-end">
            {/* Protocol Active Badge */}
            <div className="absolute top-8 left-8 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[10px] text-green-500 font-bold tracking-[0.3em] uppercase">Protocol Active</span>
            </div>

            <div className="max-w-md">
              <h2 className="text-3xl font-black italic uppercase leading-none mb-4">
                Secure Asset Monitoring //
              </h2>
              <p className="text-xs text-zinc-500 leading-relaxed uppercase tracking-wider">
                Join the network of thousands of operatives monitoring the global liquidity deltas in real-time.
              </p>
            </div>

            {/* Decorative Elements */}
            <div className="absolute right-0 top-1/4 opacity-10 select-none pointer-events-none">
              <div className="text-[12rem] font-black italic leading-none">SENTRY</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}