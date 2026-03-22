"use client";

import useSWR from 'swr';
import Image from 'next/image';
import { TrendingDown, TrendingUp, Activity } from 'lucide-react';

const fetcher = (url: string) => fetch(url).then(res => res.json());

interface PriceData {
    assetId: string;
    assetName: string;
    priceUsd: number;
    change24h: number;
    lastUpdated: string;
}

// Map CoinGecko IDs to their image IDs
const COINGECKO_LOGOS: Record<string, string> = {
    bitcoin: "1",
    ethereum: "279",
    cardano: "975",
    // Add more coins as needed
};

export default function MarketGrid() {
    const { data, error, isLoading } = useSWR('http://localhost:4000/cache', fetcher, {
        refreshInterval: 10000,
    });

    if (isLoading) return (
        <div className="flex items-center justify-center p-12 text-gray-400">
            <Activity className="w-6 h-6 animate-pulse mr-2" />
            <span>Loading live market data...</span>
        </div>
    );

    if (error || !data?.success) return (
        <div className="p-6 bg-red-900/20 border border-red-500/50 rounded-xl text-red-400">
            <p className="font-bold">Connection Error</p>
            <p className="text-sm">Could not reach the backend. Is your Express server running on port 4000?</p>
        </div>
    );

    const prices: PriceData[] = data.data;

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {prices.map(coin => {
                const isPositive = coin.change24h >= 0;
                const logoId = COINGECKO_LOGOS[coin.assetId];
                const logoUrl = logoId
                    ? `https://assets.coingecko.com/coins/images/${logoId}/large.png`
                    : 'https://via.placeholder.com/40';

                return (
                    <div
                        key={coin.assetId}
                        className="bg-gray-800/40 backdrop-blur-md border border-gray-700/50 p-6 rounded-2xl shadow-xl transition-all hover:border-gray-600"
                    >
                        {/* Header with logo */}
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 relative">
                                    <Image
                                        src={logoUrl}
                                        alt={coin.assetName}
                                        fill
                                        className="object-contain"
                                    />
                                </div>
                                <h3 className="text-xl font-bold text-gray-100">{coin.assetName}</h3>
                            </div>
                            <span className="text-xs font-mono text-gray-500 uppercase bg-gray-900/50 px-2 py-1 rounded">
                                {coin.assetId}
                            </span>
                        </div>

                        {/* Price */}
                        <p className="text-4xl font-bold text-white mb-4 tracking-tight">
                            ${coin.priceUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                        </p>

                        {/* 24h Change */}
                        <div className={`flex items-center text-sm font-medium px-3 py-1.5 rounded-lg w-max ${isPositive ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                            {isPositive ? <TrendingUp className="w-4 h-4 mr-1.5" /> : <TrendingDown className="w-4 h-4 mr-1.5" />}
                            {Math.abs(coin.change24h).toFixed(2)}% (24h)
                        </div>
                    </div>
                );
            })}
        </div>
    );
}