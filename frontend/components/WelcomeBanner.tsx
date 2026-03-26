'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, CheckCircle2 } from 'lucide-react';

export default function WelcomeBanner() {
    const [show, setShow] = useState(false);

    useEffect(() => {
        // 1. Check for manual signup note
        const manualSignup = sessionStorage.getItem('triggerWelcome');

        // 2. Check for Google signup cookie
        const isNewGoogleUser = document.cookie.includes('is_new_user=true');

        if (manualSignup === 'true' || isNewGoogleUser) {
            setShow(true);

            // 3. Cleanup: Wipe both so it never shows again
            sessionStorage.removeItem('triggerWelcome');
            document.cookie = "is_new_user=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";

            const timer = setTimeout(() => setShow(false), 8000);
            return () => clearTimeout(timer);
        }
    }, []);

    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    initial={{ opacity: 0, y: -12, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                    exit={{ opacity: 0, y: -12, height: 0 }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                    className="w-full overflow-hidden"
                >
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
                        <div className="flex items-center gap-3 bg-green-500/10 border border-green-500/25 text-green-400 rounded-xl px-4 py-3 text-sm shadow-[0_0_15px_rgba(34,197,94,0.1)]">
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                            >
                                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                            </motion.div>

                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                <span className="font-semibold tracking-wide">UPLINK SECURED</span>
                                <span className="hidden sm:inline text-green-400/50">—</span>
                                <span className="hidden sm:inline text-green-400/80 truncate tracking-wide">
                                    Welcome transmission routed to operator inbox.
                                </span>
                            </div>

                            <motion.div
                                animate={{ y: [0, -3, 0] }}
                                transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                            >
                                <Mail className="w-4 h-4 flex-shrink-0 text-green-500/60" />
                            </motion.div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}