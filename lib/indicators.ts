import { AggTrade, Interval, Kline, MovingAveragePoint, OrderBook } from "@/lib/types";

const DAY_MS = 24 * 60 * 60 * 1000;

const INTERVAL_MS: Record<Interval, number> = {
  "1m": 60 * 1000,
  "5m": 5 * 60 * 1000,
  "15m": 15 * 60 * 1000,
  "30m": 30 * 60 * 1000,
  "1h": 60 * 60 * 1000,
  "4h": 4 * 60 * 60 * 1000,
  "1d": DAY_MS,
  "1w": 7 * DAY_MS,
  "1M": 30 * DAY_MS
};

export function round(value: number, digits = 4) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

export function safeDivide(numerator: number, denominator: number) {
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator === 0) {
    return 0;
  }

  return numerator / denominator;
}

export function calculateMA(data: Kline[], period: number): MovingAveragePoint[] {
  if (data.length < period) {
    return [];
  }

  const points: MovingAveragePoint[] = [];
  let rollingSum = 0;

  data.forEach((kline, index) => {
    rollingSum += kline.close;

    if (index >= period) {
      rollingSum -= data[index - period].close;
    }

    if (index >= period - 1) {
      points.push({
        time: kline.openTime,
        value: rollingSum / period
      });
    }
  });

  return points;
}

export function latestMA(data: Kline[], period: number) {
  const ma = calculateMA(data, period);
  return ma.length ? ma[ma.length - 1].value : null;
}

export function calculateRSI(data: Kline[], period = 14) {
  if (data.length <= period) {
    return null;
  }

  let gains = 0;
  let losses = 0;

  for (let index = 1; index <= period; index += 1) {
    const change = data[index].close - data[index - 1].close;
    gains += Math.max(change, 0);
    losses += Math.max(-change, 0);
  }

  let averageGain = gains / period;
  let averageLoss = losses / period;

  for (let index = period + 1; index < data.length; index += 1) {
    const change = data[index].close - data[index - 1].close;
    averageGain = (averageGain * (period - 1) + Math.max(change, 0)) / period;
    averageLoss = (averageLoss * (period - 1) + Math.max(-change, 0)) / period;
  }

  if (averageLoss === 0) {
    return 100;
  }

  const relativeStrength = averageGain / averageLoss;
  return 100 - 100 / (1 + relativeStrength);
}

function ema(values: number[], period: number) {
  if (values.length < period) {
    return [];
  }

  const multiplier = 2 / (period + 1);
  const result: number[] = [];
  let previous = values.slice(0, period).reduce((sum, value) => sum + value, 0) / period;

  result.push(previous);

  for (let index = period; index < values.length; index += 1) {
    previous = (values[index] - previous) * multiplier + previous;
    result.push(previous);
  }

  return result;
}

export function calculateMACD(data: Kline[]) {
  const closes = data.map((item) => item.close);
  const ema12 = ema(closes, 12);
  const ema26 = ema(closes, 26);

  if (!ema12.length || !ema26.length) {
    return null;
  }

  const offset = ema12.length - ema26.length;
  const macdLine = ema26.map((slow, index) => ema12[index + offset] - slow);
  const signalLine = ema(macdLine, 9);

  if (!signalLine.length) {
    return null;
  }

  const latestMacd = macdLine[macdLine.length - 1];
  const latestSignal = signalLine[signalLine.length - 1];

  return {
    macd: latestMacd,
    signal: latestSignal,
    histogram: latestMacd - latestSignal
  };
}

export function calculateReturns(data: Kline[], lookbackCandles: number) {
  if (lookbackCandles <= 0 || data.length <= lookbackCandles) {
    return null;
  }

  const latest = data[data.length - 1].close;
  const past = data[data.length - 1 - lookbackCandles].close;

  return safeDivide(latest - past, past) * 100;
}

export function calculateReturnOverDays(
  data: Kline[],
  interval: Interval,
  days: number
) {
  const latest = data.at(-1);

  if (!latest) {
    return null;
  }

  const targetTime = latest.openTime - days * DAY_MS;
  let past: Kline | undefined;

  for (let index = data.length - 1; index >= 0; index -= 1) {
    if (data[index].openTime <= targetTime) {
      past = data[index];
      break;
    }
  }

  if (!past) {
    const lookbackCandles = Math.round((days * DAY_MS) / INTERVAL_MS[interval]);
    return Number.isFinite(lookbackCandles)
      ? calculateReturns(data, lookbackCandles)
      : null;
  }

  return safeDivide(latest.close - past.close, past.close) * 100;
}

export function calculateVolumeMA(data: Kline[], period = 20) {
  if (data.length < period) {
    return null;
  }

  const window = data.slice(-period);
  const total = window.reduce((sum, item) => sum + item.volume, 0);
  return total / period;
}

export function calculateVolumeBreakout(data: Kline[], period = 20) {
  const volumeMA = calculateVolumeMA(data, period);
  const latest = data.at(-1);

  if (!volumeMA || !latest) {
    return null;
  }

  return safeDivide(latest.volume, volumeMA);
}

export function calculateSpread(orderBook: OrderBook) {
  const bestBid = orderBook.bids[0]?.price ?? 0;
  const bestAsk = orderBook.asks[0]?.price ?? 0;
  const spread = bestAsk - bestBid;
  const midPrice = (bestAsk + bestBid) / 2;

  return {
    bestBid,
    bestAsk,
    spread,
    spreadPercent: safeDivide(spread, midPrice) * 100
  };
}

export function calculateOrderBookDepth(orderBook: OrderBook, levels = 20) {
  const bids = orderBook.bids.slice(0, levels);
  const asks = orderBook.asks.slice(0, levels);

  const bidBase = bids.reduce((sum, level) => sum + level.quantity, 0);
  const askBase = asks.reduce((sum, level) => sum + level.quantity, 0);
  const bidNotional = bids.reduce(
    (sum, level) => sum + level.price * level.quantity,
    0
  );
  const askNotional = asks.reduce(
    (sum, level) => sum + level.price * level.quantity,
    0
  );

  return {
    bidBase,
    askBase,
    bidNotional,
    askNotional,
    totalNotional: bidNotional + askNotional
  };
}

export function calculateOrderBookImbalance(orderBook: OrderBook, levels = 20) {
  const depth = calculateOrderBookDepth(orderBook, levels);
  const total = depth.bidNotional + depth.askNotional;
  const bidShare = safeDivide(depth.bidNotional, total);
  const imbalance = safeDivide(depth.bidNotional - depth.askNotional, total);

  return {
    bidShare,
    imbalance,
    ...depth
  };
}

export function calculateCVD(trades: AggTrade[]) {
  let buyVolume = 0;
  let sellVolume = 0;

  trades.forEach((trade) => {
    if (trade.isBuyerMaker) {
      sellVolume += trade.quantity;
      return;
    }

    buyVolume += trade.quantity;
  });

  const cvd = buyVolume - sellVolume;

  return {
    buyVolume,
    sellVolume,
    cvd,
    cvdRatio: safeDivide(cvd, buyVolume + sellVolume)
  };
}

export function clampScore(value: number) {
  return Math.max(-2, Math.min(2, value));
}
