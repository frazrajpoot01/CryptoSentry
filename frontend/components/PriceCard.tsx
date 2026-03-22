'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { AlertTriangle, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface PriceCardProps {
  assetId: string;
  assetName: string;
  priceUsd: number;
  change24h: number;
  status: 'stable' | 'alert';
  index: number;
  logo: string; // ✅ pass the logo URL
}

const ASSET_COLORS: Record<string, { from: string; to: string }> = {
  bitcoin: { from: '#f97316', to: '#f59e0b' },
  ethereum: { from: '#8b5cf6', to: '#6366f1' },
  cardano: { from: '#06b6d4', to: '#3b82f6' },
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
  const isAlert = status === 'alert';
  const isPositive = change24h > 0;
  const isNeutral = change24h === 0;
  const colors = ASSET_COLORS[assetId] ?? { from: '#6366f1', to: '#8b5cf6' };

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
      className={`relative rounded-2xl p-5 overflow-hidden cursor-default select-none
        ${isAlert
          ? 'border-2 border-red-500/70 bg-red-950/20'
          : 'border border-green-500/20 bg-white/4'
        }
      `}
    >
      {/* Background gradient glow */}
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at top left, ${colors.from}, transparent 70%)`,
        }}
      />

      {/* Alert pulse overlay */}
      {isAlert && (
        <motion.div
          className="absolute inset-0 rounded-2xl border-2 border-red-500/50 pointer-events-none"
          animate={{ opacity: [0.3, 0.8, 0.3] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-4 relative z-10">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg overflow-hidden"
            style={{
              background: `linear-gradient(135deg, ${colors.from}, ${colors.to})`,
            }}
          >
            {/* ✅ Render the coin logo */}
            <Image
              src={logo}
              alt={assetName}
              width={40}
              height={40}
              className="object-contain"
            />
          </div>
          <div>
            <p className="text-white font-semibold text-sm">{assetName}</p>
            <p className="text-gray-500 text-xs capitalize">{assetId}</p>
          </div>
        </div>

        {/* Status badge */}
        <div className="flex items-center gap-1.5">
          {isAlert ? (
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
              className="flex items-center gap-1 bg-red-500/20 text-red-400 border border-red-500/30 rounded-full px-2.5 py-1 text-xs font-semibold"
            >
              <AlertTriangle className="w-3 h-3" />
              ALERT
            </motion.div>
          ) : (
            <div className="flex items-center gap-1 bg-green-500/10 text-green-400 border border-green-500/20 rounded-full px-2.5 py-1 text-xs font-semibold">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full" />
              STABLE
            </div>
          )}
        </div>
      </div>

      {/* Price */}
      <div className="relative z-10 mb-3">
        <motion.p
          key={priceUsd}
          initial={{ opacity: 0.6, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl font-bold text-white tracking-tight"
        >
          {formattedPrice}
        </motion.p>
      </div>

      {/* 24h Change */}
      <div className="relative z-10 flex items-center gap-1.5">
        {isNeutral ? (
          <Minus className="w-3.5 h-3.5 text-gray-500" />
        ) : isPositive ? (
          <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
        ) : (
          <TrendingDown className="w-3.5 h-3.5 text-red-400" />
        )}
        <span
          className={`text-sm font-semibold ${isNeutral
              ? 'text-gray-500'
              : isPositive
                ? 'text-emerald-400'
                : 'text-red-400'
            }`}
        >
          {formattedChange}
        </span>
        <span className="text-xs text-gray-600">24h</span>
      </div>
    </motion.div>
  );
}