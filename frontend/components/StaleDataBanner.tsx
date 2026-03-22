'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Clock } from 'lucide-react';

interface StaleDataBannerProps {
  stale: boolean;
}

export default function StaleDataBanner({ stale }: StaleDataBannerProps) {
  return (
    <AnimatePresence>
      {stale && (
        <motion.div
          initial={{ opacity: 0, y: -12, height: 0 }}
          animate={{ opacity: 1, y: 0, height: 'auto' }}
          exit={{ opacity: 0, y: -12, height: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="w-full overflow-hidden"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
            <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/25 text-amber-400 rounded-xl px-4 py-3 text-sm">
              <motion.div
                animate={{ rotate: [0, -5, 5, -5, 0] }}
                transition={{ repeat: Infinity, repeatDelay: 4, duration: 0.5 }}
              >
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              </motion.div>
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="font-semibold">Stale Data Warning</span>
                <span className="hidden sm:inline text-amber-400/70">—</span>
                <span className="hidden sm:inline text-amber-400/70 truncate">
                  Price data is older than 60 seconds. The surveillance engine may be offline.
                </span>
              </div>
              <Clock className="w-4 h-4 flex-shrink-0 text-amber-500/60" />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
