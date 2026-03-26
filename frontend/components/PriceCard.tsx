'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface PriceCardProps {
  assetId: string;
  assetName: string;
  priceUsd: number;
  change24h: number;
  status: 'stable' | 'alert';
  index: number;
  logo: string;
}

const ASSET_COLORS: Record<string, { from: string; to: string }> = {
  bitcoin: { from: '#f97316', to: '#f59e0b' },
  ethereum: { from: '#8b5cf6', to: '#6366f1' },
  cardano: { from: '#06b6d4', to: '#3b82f6' },
  solana: { from: '#14F195', to: '#9945FF' },
};

export default function PriceCard({
  assetId,
  assetName,
  priceUsd,
  change24h,
  status,
  index,
  logo,
}: PriceCardProps) {
  const [imgError, setImgError] = useState(false);

  const isAlert = status === 'alert';
  const isPositive = change24h > 0;
  const isNeutral = change24h === 0;

  const colors = ASSET_COLORS[assetId] ?? { from: '#52525b', to: '#3f3f46' };

  // ✅ YOUR WATCHLIST FALLBACK LOGIC
  const initial = assetName.charAt(0).toUpperCase();
  const fallbackColors = ['bg-orange-500', 'bg-indigo-500', 'bg-blue-500', 'bg-green-500', 'bg-purple-500'];
  const fallbackColorClass = fallbackColors[assetName.length % fallbackColors.length];

  const formattedPrice = priceUsd.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: priceUsd < 1 ? 6 : 2,
  });

  const formattedChange = `${isPositive ? '+' : ''}${change24h.toFixed(2)}%`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{
        opacity: 1,
        y: 0,
        boxShadow: isAlert
          ? [
            '0 0 0px rgba(239,68,68,0)',
            '0 0 20px rgba(239,68,68,0.35)',
            '0 0 0px rgba(239,68,68,0)',
          ]
          : '0 0 0px rgba(0,0,0,0)',
      }}
      transition={{
        opacity: { delay: index * 0.1, duration: 0.4 },
        y: { delay: index * 0.1, duration: 0.4 },
        boxShadow: isAlert
          ? { duration: 1.5, repeat: Infinity, ease: 'easeInOut' }
          : { duration: 0.3 },
      }}
      className={`relative rounded-2xl p-4 md:p-6 overflow-hidden cursor-default select-none h-full flex flex-col justify-start gap-4 md:gap-6
        ${isAlert
          ? 'border-2 border-red-500/70 bg-red-950/20'
          : 'border border-green-500/20 bg-[#0a0a0a]'
        }
      `}
    >
      {/* Background Gradient */}
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at top left, ${colors.from}, transparent 70%)`,
        }}
      />

      {/* Alert Pulse */}
      {isAlert && (
        <motion.div
          className="absolute inset-0 rounded-2xl border-2 border-red-500/50 pointer-events-none"
          animate={{ opacity: [0.3, 0.8, 0.3] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}

      {/* HEADER */}
      <div className="flex items-start justify-between gap-1 relative z-10">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg overflow-hidden flex-shrink-0 ${imgError ? fallbackColorClass : ''}`}
            style={!imgError ? {
              background: `linear-gradient(135deg, ${colors.from}, ${colors.to})`,
            } : undefined}
          >
            {/* ✅ IMPLEMENTED FALLBACK TOGGLE */}
            {!imgError ? (
              <img
                src={logo}
                alt={assetName}
                className="object-contain w-6 h-6"
                onError={() => setImgError(true)}
              />
            ) : (
              <span className="text-white font-bold text-lg">{initial}</span>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-white font-semibold text-sm truncate">{assetName}</p>
            <p className="text-gray-500 text-xs capitalize truncate">{assetId}</p>
          </div>
        </div>

        {/* STATUS BADGE */}
        <div className="flex items-center flex-shrink-0">
          {isAlert ? (
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
              className="flex items-center gap-1 bg-red-500/20 text-red-400 border border-red-500/30 rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap"
            >
              <AlertTriangle className="w-3 h-3 flex-shrink-0" />
              ALERT
            </motion.div>
          ) : (
            <div className="flex items-center gap-1 bg-green-500/10 text-green-400 border border-green-500/20 rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full flex-shrink-0" />
              STABLE
            </div>
          )}
        </div>
      </div>

      {/* PRICE */}
      <div className="relative z-10">
        <motion.p
          key={priceUsd}
          initial={{ opacity: 0.6, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl font-bold text-white tracking-tight truncate"
        >
          {formattedPrice}
        </motion.p>
      </div>

      {/* 24H CHANGE */}
      <div className="relative z-10 flex items-center gap-1.5">
        {isNeutral ? (
          <Minus className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
        ) : isPositive ? (
          <TrendingUp className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
        ) : (
          <TrendingDown className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
        )}
        <span
          className={`text-sm font-semibold whitespace-nowrap ${isNeutral
            ? 'text-gray-500'
            : isPositive
              ? 'text-emerald-400'
              : 'text-red-400'
            }`}
        >
          {formattedChange}
        </span>
        <span className="text-xs text-gray-600 whitespace-nowrap">24h</span>
      </div>
    </motion.div>
  );
}