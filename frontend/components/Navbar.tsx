'use client';

import { useState, useEffect } from 'react';
import { signOut, useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ShieldCheck, LogOut, Wifi, LayoutDashboard, Globe, Star, Bell } from 'lucide-react';

const NAV_ITEMS = [
  { href: '/', label: 'Dashboard', id: 'nav-dashboard', icon: LayoutDashboard },
  { href: '/market', label: 'Market', id: 'nav-market', icon: Globe },
  { href: '/watchlist', label: 'Watchlist', id: 'nav-watchlist', icon: Star },
  { href: '/alerts', label: 'Alerts', id: 'nav-alerts', icon: Bell },
];

export default function MobileNavbar() {
  const { data: session } = useSession();
  const pathname = usePathname();

  // State to handle the top bar visibility
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Hide if scrolling down and passed the very top, show if scrolling up
      if (currentScrollY > lastScrollY && currentScrollY > 50) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  return (
    <div className="md:hidden"> {/* Wrapper to hide entirely on desktop */}

      {/* 1. TOP HEADER - Hides on Scroll Down */}
      <header
        className={`fixed top-0 inset-x-0 z-50 border-b border-green-500/10 bg-[#0a0f1e]/90 backdrop-blur-xl transition-transform duration-300 ease-in-out ${isVisible ? 'translate-y-0' : '-translate-y-full'
          }`}
      >
        <div className="px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg border border-green-500/30 bg-green-500/10 flex items-center justify-center shadow-[0_0_10px_rgba(34,197,94,0.15)]">
              <ShieldCheck className="w-4 h-4 text-green-400" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-gray-100 text-sm tracking-widest uppercase">Bitbash</span>
              <div className="flex items-center gap-1 text-[9px] text-green-400 font-medium tracking-widest uppercase">
                <Wifi className="w-2 h-2 animate-pulse" />
                Sentry V4
              </div>
            </div>
          </div>

          <motion.button
            onClick={() => signOut({ callbackUrl: '/login' })}
            whileTap={{ scale: 0.95 }}
            className="flex items-center justify-center p-2 rounded-lg text-gray-500 hover:text-red-400 border border-transparent hover:border-red-500/20 hover:bg-red-500/10 transition-all"
          >
            <LogOut className="w-5 h-5" />
          </motion.button>
        </div>
      </header>

      {/* 2. BOTTOM NAVIGATION - Always Visible */}
      <nav className="fixed bottom-0 inset-x-0 z-50 border-t border-green-500/10 bg-[#0a0f1e]/95 backdrop-blur-xl pb-safe">
        <div className="flex items-center justify-around px-2 h-16">
          {NAV_ITEMS.map(({ href, label, id, icon: Icon }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                id={id}
                href={href}
                className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-all duration-200 ${isActive ? 'text-green-400' : 'text-gray-600 hover:text-gray-400'
                  }`}
              >
                <div className={`p-1.5 rounded-lg transition-all duration-300 ${isActive
                    ? 'bg-green-500/10 border border-green-500/30 shadow-[0_0_10px_rgba(34,197,94,0.1)]'
                    : 'bg-transparent border border-transparent'
                  }`}>
                  <Icon className={`w-5 h-5 ${isActive ? 'drop-shadow-[0_0_8px_rgba(34,197,94,0.6)]' : ''}`} />
                </div>
                <span className="text-[10px] font-medium tracking-wider">{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

    </div>
  );
}