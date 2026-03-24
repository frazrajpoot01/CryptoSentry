/**
 * Bitbash Crypto Sentry — Express Surveillance Engine
 * FIXED: Supports CoinGecko /coins/markets (ALL coins) with real logos
 * UPDATED: Dynamic Settings Support (Threshold & Polling)
 */

import 'dotenv/config';
import express, { Request, Response } from 'express';
import cors from 'cors';

import { PrismaClient, Prisma } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import https from 'https';

// ─── Constants & Dynamic Variables ─────────────────────

const PORT = process.env.PORT || 4000;
const ALERT_COOLDOWN_MS = 60_000;

// ✅ Made these variables dynamic for Mission Control overrides
let currentPollInterval = 60_000;
let currentThreshold = -2.0;
let pollingTimer: ReturnType<typeof setInterval> | null = null;

const COINGECKO_URL =
  'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&per_page=50&page=1&price_change_percentage=24h';

// ─── Types ─────────────────────────────────────────────

interface CachedPrice {
  assetId: string;
  assetName: string;
  priceUsd: number;
  change24h: number;
  logo: string; // ✅ added logo
  lastUpdated: Date;
}

// ─── Prisma Setup ──────────────────────────────────────

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool as any);

const prisma = new PrismaClient({
  adapter,
  log: ['warn', 'error'],
});

// ─── Memory Cache ──────────────────────────────────────

class MemoryCache {
  private store: Map<string, CachedPrice> = new Map();

  set(id: string, data: CachedPrice): void {
    this.store.set(id, data);
  }

  getAll(): CachedPrice[] {
    return Array.from(this.store.values());
  }
}

const memoryCache = new MemoryCache();

const baselineCache = new Map<string, number>();
const alertCooldownCache = new Map<string, Date>();

// ─── HTTP Fetch Helper ─────────────────────────────────

function fetchJson<T>(url: string): Promise<T> {
  return new Promise((resolve, reject) => {
    https
      .get(
        url,
        {
          headers: {
            'User-Agent': 'Bitbash-Crypto-Sentry/1.0',
            'Accept': 'application/json',
          },
        },
        (res) => {
          let raw = '';
          res.on('data', (chunk: Buffer) => {
            raw += chunk.toString();
          });
          res.on('end', () => {
            try {
              resolve(JSON.parse(raw) as T);
            } catch (err) {
              reject(new Error(`JSON parse error: ${String(err)}`));
            }
          });
        }
      )
      .on('error', reject);
  });
}

// ─── Flash Crash Detection ─────────────────────────────

async function checkFlashCrash(
  assetId: string,
  assetName: string,
  currentPrice: number
): Promise<void> {
  const baseline = baselineCache.get(assetId);
  if (!baseline) return;

  // 1. Calculate percentage change exactly as required: ((current - baseline) / baseline) * 100
  const dropPct = ((currentPrice - baseline) / baseline) * 100;

  // 2. ✅ Trigger if the drop is worse than the dynamic Mission Control threshold
  if (dropPct <= currentThreshold) {
    const now = new Date();
    const lastAlert = alertCooldownCache.get(assetId);

    // Memory cooldown check
    if (lastAlert && now.getTime() - lastAlert.getTime() < ALERT_COOLDOWN_MS) {
      return;
    }

    try {
      // 3. Database Idempotency Check (Prevent duplicates if server restarts)
      const existingAlert = await prisma.cryptoAlert.findFirst({
        where: {
          asset_id: assetId,
          detected_at: { gte: new Date(Date.now() - ALERT_COOLDOWN_MS) } // Last 60 seconds
        }
      });

      // 4. If no recent alert exists, write it to PostgreSQL
      if (!existingAlert) {
        console.warn(`[ALERT] 🚨 ${assetName} crashed by ${dropPct.toFixed(2)}%!`);

        await prisma.cryptoAlert.create({
          data: {
            asset_id: assetId,
            asset_name: assetName,
            price_at_drop: new Prisma.Decimal(currentPrice),
            drop_percentage: dropPct,
          },
        });

        // Update memory cooldown
        alertCooldownCache.set(assetId, now);
      }
    } catch (err) {
      console.error('[DB ERROR] Failed to save flash crash alert:', err);
    }
  }
}

// ─── MAIN POLL FUNCTION (FULL) ────────────────────────

async function fetchAndAnalyze(): Promise<void> {
  console.log(`\n[POLL] 🔍 ${new Date().toISOString()}`);

  try {
    const data = await fetchJson<any[]>(COINGECKO_URL);

    if (!Array.isArray(data)) {
      console.error('[ERROR] Unexpected API response:', data);
      return;
    }

    for (const coin of data) {
      const assetId = coin.id;
      const assetName = coin.name;
      const priceUsd = coin.current_price;
      const change24h = coin.price_change_percentage_24h;
      const logo = coin.image || `https://via.placeholder.com/30?text=${assetName[0]}`;

      if (typeof priceUsd !== 'number') continue;

      memoryCache.set(assetId, {
        assetId,
        assetName,
        priceUsd,
        change24h: change24h ?? 0,
        logo, // ✅ store real logo
        lastUpdated: new Date(),
      });

      await checkFlashCrash(assetId, assetName, priceUsd);
      baselineCache.set(assetId, priceUsd);

      console.log(
        `[PRICE] ${assetName}: $${priceUsd} (${change24h?.toFixed(2)}%)`
      );
    }
  } catch (err) {
    console.error('[POLL ERROR]', err);
  }
}

// ─── Express App ───────────────────────────────────────

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

app.get('/cache', (_req: Request, res: Response) => {
  const prices = memoryCache.getAll();

  res.json({
    success: true,
    count: prices.length,
    data: prices,
  });
});

// ✅ ADDED: Mission Control Settings Endpoint
app.post('/settings', (req: Request, res: Response) => {
  const { threshold, interval } = req.body;

  // Update Threshold if provided
  if (threshold !== undefined) {
    currentThreshold = Number(threshold);
    console.log(`\n[SETTINGS] ⚙️ Sensitivity updated to ${currentThreshold}%`);
  }

  // Update Polling Interval and Restart the Loop if provided
  if (interval !== undefined) {
    const newInterval = Number(interval);
    if (newInterval !== currentPollInterval) {
      currentPollInterval = newInterval;
      console.log(`[SETTINGS] ⏱️ Polling interval updated to ${currentPollInterval}ms`);

      // Destroy the old loop and start a new one
      if (pollingTimer) clearInterval(pollingTimer);
      pollingTimer = setInterval(() => {
        void fetchAndAnalyze();
      }, currentPollInterval);
    }
  }

  res.json({ success: true, message: "System protocols updated successfully" });
});

// ─── Bootstrap ─────────────────────────────────────────

async function bootstrap(): Promise<void> {
  try {
    await prisma.$connect();
    console.log('[DB] ✅ Connected');
  } catch {
    console.error('[DB] ❌ Failed');
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`🚀 Server: http://localhost:${PORT}`);
  });

  await fetchAndAnalyze();

  // ✅ Assigned to our dynamic polling timer variable
  pollingTimer = setInterval(() => {
    void fetchAndAnalyze();
  }, currentPollInterval);
}

bootstrap().catch((err) => {
  console.error('[FATAL]', err);
  process.exit(1);
});