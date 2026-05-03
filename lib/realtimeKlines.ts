import { Interval, Kline } from "@/lib/types";
import {
  isPlausiblePriceAgainstReference,
  isPositiveFiniteNumber,
  isValidKline,
  normalizeKlines
} from "@/lib/klineGuards";

export interface TradeTick {
  id: number;
  price: number;
  quantity: number;
  timestamp: number;
}

const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

const FIXED_INTERVAL_MS: Partial<Record<Interval, number>> = {
  "1m": MINUTE_MS,
  "5m": 5 * MINUTE_MS,
  "15m": 15 * MINUTE_MS,
  "30m": 30 * MINUTE_MS,
  "1h": HOUR_MS,
  "4h": 4 * HOUR_MS,
  "1d": DAY_MS
};

function monthStart(timestamp: number) {
  const date = new Date(timestamp);
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1);
}

function nextMonthStart(timestamp: number) {
  const date = new Date(timestamp);
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1);
}

function weekStart(timestamp: number) {
  const date = new Date(timestamp);
  const day = date.getUTCDay();
  const daysSinceMonday = day === 0 ? 6 : day - 1;
  const startOfDay = Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate()
  );

  return startOfDay - daysSinceMonday * DAY_MS;
}

export function intervalOpenTime(timestamp: number, interval: Interval) {
  if (interval === "1M") {
    return monthStart(timestamp);
  }

  if (interval === "1w") {
    return weekStart(timestamp);
  }

  const intervalMs = FIXED_INTERVAL_MS[interval] ?? HOUR_MS;
  return Math.floor(timestamp / intervalMs) * intervalMs;
}

export function intervalCloseTime(openTime: number, interval: Interval) {
  if (interval === "1M") {
    return nextMonthStart(openTime) - 1;
  }

  if (interval === "1w") {
    return openTime + 7 * DAY_MS - 1;
  }

  const intervalMs = FIXED_INTERVAL_MS[interval] ?? HOUR_MS;
  return openTime + intervalMs - 1;
}

function applyTradeToKline(kline: Kline, trade: TradeTick): Kline {
  return {
    ...kline,
    high: Math.max(kline.high, trade.price),
    low: Math.min(kline.low, trade.price),
    close: trade.price,
    volume: kline.volume + trade.quantity
  };
}

function createKlineFromTrade(trade: TradeTick, interval: Interval): Kline {
  const openTime = intervalOpenTime(trade.timestamp, interval);

  return {
    openTime,
    open: trade.price,
    high: trade.price,
    low: trade.price,
    close: trade.price,
    volume: trade.quantity,
    closeTime: intervalCloseTime(openTime, interval)
  };
}

function isValidTrade(trade: TradeTick) {
  return (
    Number.isFinite(trade.id) &&
    isPositiveFiniteNumber(trade.price) &&
    isPositiveFiniteNumber(trade.quantity) &&
    Number.isFinite(trade.timestamp) &&
    trade.timestamp > 0
  );
}

function isPlausibleTrade(trade: TradeTick, reference?: Kline) {
  return isPlausiblePriceAgainstReference(
    trade.price,
    reference?.close ?? trade.price
  );
}

export function aggregateTradesIntoKlines(
  klines: Kline[],
  trades: TradeTick[],
  interval: Interval,
  limit = 240
) {
  if (!trades.length) {
    return normalizeKlines(klines).slice(-limit);
  }

  const next = normalizeKlines(klines);
  const orderedTrades = [...trades].sort((a, b) => a.timestamp - b.timestamp);

  for (const trade of orderedTrades) {
    if (!isValidTrade(trade)) {
      continue;
    }

    const openTime = intervalOpenTime(trade.timestamp, interval);
    const existingIndex = next.findIndex((kline) => kline.openTime === openTime);

    if (existingIndex >= 0) {
      if (!isPlausibleTrade(trade, next[existingIndex])) {
        continue;
      }

      next[existingIndex] = applyTradeToKline(next[existingIndex], trade);
      continue;
    }

    const last = next.at(-1);

    if (last && openTime < last.openTime) {
      continue;
    }

    if (last && !isPlausibleTrade(trade, last)) {
      continue;
    }

    const kline = createKlineFromTrade(trade, interval);

    if (isValidKline(kline)) {
      next.push(kline);
    }
  }

  return normalizeKlines(next).slice(-limit);
}
