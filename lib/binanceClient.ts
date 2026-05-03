import {
  AggTrade,
  FundingRateRecord,
  FuturesDataPeriod,
  Interval,
  Kline,
  MarketType,
  OpenInterestHistoryPoint,
  OpenInterestSnapshot,
  OrderBook,
  RatioPoint,
  Ticker24hr
} from "@/lib/types";
import { normalizeKlines } from "@/lib/klineGuards";

const SPOT_BASE_URL = "https://api.binance.com/api/v3";
const FUTURES_BASE_URL = "https://fapi.binance.com/fapi/v1";
const FUTURES_DATA_BASE_URL = "https://fapi.binance.com/futures/data";

const MARKET_ENDPOINTS: Record<
  MarketType,
  {
    baseUrl: string;
    exchangeInfoPath: string;
    klinesPath: string;
    ticker24hrPath: string;
    depthPath: string;
    aggTradesPath: string;
  }
> = {
  spot: {
    baseUrl: SPOT_BASE_URL,
    exchangeInfoPath: "/api/v3/exchangeInfo",
    klinesPath: "/api/v3/klines",
    ticker24hrPath: "/api/v3/ticker/24hr",
    depthPath: "/api/v3/depth",
    aggTradesPath: "/api/v3/aggTrades"
  },
  futures: {
    baseUrl: FUTURES_BASE_URL,
    exchangeInfoPath: "/fapi/v1/exchangeInfo",
    klinesPath: "/fapi/v1/klines",
    ticker24hrPath: "/fapi/v1/ticker/24hr",
    depthPath: "/fapi/v1/depth",
    aggTradesPath: "/fapi/v1/aggTrades"
  }
};

export const DEFAULT_SYMBOLS = [
  "BTCUSDT",
  "ETHUSDT",
  "SOLUSDT",
  "BNBUSDT",
  "DOGEUSDT"
];

const cache = new Map<string, { expiresAt: number; value: unknown }>();

function buildUrl(baseUrl: string, path: string, params: Record<string, string | number>) {
  const url = new URL(path, baseUrl);

  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, String(value));
  }

  return url.toString();
}

async function fetchJson<T>(url: string, ttlMs = 15_000): Promise<T> {
  const cached = cache.get(url);
  const now = Date.now();

  if (cached && cached.expiresAt > now) {
    return cached.value as T;
  }

  const response = await fetch(url, {
    cache: "no-store",
    headers: {
      accept: "application/json"
    },
    signal: AbortSignal.timeout(10_000)
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Binance request failed ${response.status}: ${text || url}`);
  }

  const data = (await response.json()) as T;
  cache.set(url, { expiresAt: now + ttlMs, value: data });
  return data;
}

function toNumber(value: string | number | undefined, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

type BinanceKline = [
  number,
  string,
  string,
  string,
  string,
  string,
  number,
  string,
  number,
  string,
  string,
  string
];

function mapKline(row: BinanceKline): Kline {
  return {
    openTime: row[0],
    open: toNumber(row[1]),
    high: toNumber(row[2]),
    low: toNumber(row[3]),
    close: toNumber(row[4]),
    volume: toNumber(row[5]),
    closeTime: row[6]
  };
}

export async function getUsdtSpotSymbols() {
  type ExchangeInfo = {
    symbols: Array<{
      symbol: string;
      status: string;
      quoteAsset: string;
      isSpotTradingAllowed?: boolean;
    }>;
  };

  const url = buildUrl(
    MARKET_ENDPOINTS.spot.baseUrl,
    MARKET_ENDPOINTS.spot.exchangeInfoPath,
    {}
  );
  const data = await fetchJson<ExchangeInfo>(url, 10 * 60_000);

  return data.symbols
    .filter((item) => {
      const isLeveragedToken =
        item.symbol.includes("UPUSDT") ||
        item.symbol.includes("DOWNUSDT") ||
        item.symbol.includes("BULLUSDT") ||
        item.symbol.includes("BEARUSDT");

      return (
        item.status === "TRADING" &&
        item.quoteAsset === "USDT" &&
        /^[A-Z0-9]+USDT$/.test(item.symbol) &&
        item.isSpotTradingAllowed !== false &&
        !isLeveragedToken
      );
    })
    .map((item) => item.symbol)
    .sort();
}

export async function getUsdtFuturesSymbols() {
  type ExchangeInfo = {
    symbols: Array<{
      symbol: string;
      status: string;
      quoteAsset: string;
      contractType?: string;
    }>;
  };

  const url = buildUrl(
    MARKET_ENDPOINTS.futures.baseUrl,
    MARKET_ENDPOINTS.futures.exchangeInfoPath,
    {}
  );
  const data = await fetchJson<ExchangeInfo>(url, 10 * 60_000);

  return data.symbols
    .filter(
      (item) =>
        item.status === "TRADING" &&
        item.quoteAsset === "USDT" &&
        item.contractType === "PERPETUAL" &&
        /^[A-Z0-9]+USDT$/.test(item.symbol)
    )
    .map((item) => item.symbol)
    .sort();
}

export async function getMarketSymbols(market: MarketType) {
  return market === "futures" ? getUsdtFuturesSymbols() : getUsdtSpotSymbols();
}

export async function getMarketKlines(
  symbol: string,
  interval: Interval,
  limit = 240,
  market: MarketType = "spot"
): Promise<Kline[]> {
  const safeLimit = Math.min(Math.max(limit, 20), 1000);
  const endpoint = MARKET_ENDPOINTS[market];
  const url = buildUrl(endpoint.baseUrl, endpoint.klinesPath, {
    symbol,
    interval,
    limit: safeLimit
  });

  const rows = await fetchJson<BinanceKline[]>(url, 20_000);
  return normalizeKlines(rows.map(mapKline));
}

export async function getSpotKlines(
  symbol: string,
  interval: Interval,
  limit = 240
): Promise<Kline[]> {
  return getMarketKlines(symbol, interval, limit, "spot");
}

export async function get24hrTicker(
  symbol: string,
  market: MarketType = "spot"
): Promise<Ticker24hr> {
  type RawTicker = {
    symbol: string;
    lastPrice: string;
    priceChange: string;
    priceChangePercent: string;
    volume: string;
    quoteVolume: string;
  };

  const endpoint = MARKET_ENDPOINTS[market];
  const url = buildUrl(endpoint.baseUrl, endpoint.ticker24hrPath, { symbol });
  const raw = await fetchJson<RawTicker>(url, 15_000);

  return {
    symbol: raw.symbol,
    lastPrice: toNumber(raw.lastPrice),
    priceChange: toNumber(raw.priceChange),
    priceChangePercent: toNumber(raw.priceChangePercent),
    volume: toNumber(raw.volume),
    quoteVolume: toNumber(raw.quoteVolume)
  };
}

export async function getOrderBook(
  symbol: string,
  limit = 100,
  market: MarketType = "spot"
): Promise<OrderBook> {
  type RawOrderBook = {
    lastUpdateId: number;
    bids: [string, string][];
    asks: [string, string][];
  };

  const endpoint = MARKET_ENDPOINTS[market];
  const url = buildUrl(endpoint.baseUrl, endpoint.depthPath, {
    symbol,
    limit
  });
  const raw = await fetchJson<RawOrderBook>(url, 5_000);

  return {
    lastUpdateId: raw.lastUpdateId,
    bids: raw.bids.map(([price, quantity]) => ({
      price: toNumber(price),
      quantity: toNumber(quantity)
    })),
    asks: raw.asks.map(([price, quantity]) => ({
      price: toNumber(price),
      quantity: toNumber(quantity)
    }))
  };
}

export async function getAggTrades(
  symbol: string,
  limit = 500,
  market: MarketType = "spot"
): Promise<AggTrade[]> {
  type RawAggTrade = {
    a: number;
    p: string;
    q: string;
    f: number;
    l: number;
    T: number;
    m: boolean;
  };

  const endpoint = MARKET_ENDPOINTS[market];
  const url = buildUrl(endpoint.baseUrl, endpoint.aggTradesPath, {
    symbol,
    limit: Math.min(Math.max(limit, 50), 1000)
  });
  const rows = await fetchJson<RawAggTrade[]>(url, 10_000);

  return rows.map((row) => ({
    id: row.a,
    price: toNumber(row.p),
    quantity: toNumber(row.q),
    firstTradeId: row.f,
    lastTradeId: row.l,
    timestamp: row.T,
    isBuyerMaker: row.m
  }));
}

export async function getFundingRate(
  symbol: string,
  limit = 8
): Promise<FundingRateRecord[]> {
  type RawFunding = {
    symbol: string;
    fundingRate: string;
    fundingTime: number;
  };

  const url = buildUrl(FUTURES_BASE_URL, "/fapi/v1/fundingRate", {
    symbol,
    limit: Math.min(Math.max(limit, 1), 100)
  });
  const rows = await fetchJson<RawFunding[]>(url, 60_000);

  return rows.map((row) => ({
    symbol: row.symbol,
    fundingRate: toNumber(row.fundingRate),
    fundingTime: row.fundingTime
  }));
}

export async function getOpenInterest(
  symbol: string
): Promise<OpenInterestSnapshot> {
  type RawOpenInterest = {
    symbol: string;
    openInterest: string;
    time: number;
  };

  const url = buildUrl(FUTURES_BASE_URL, "/fapi/v1/openInterest", { symbol });
  const raw = await fetchJson<RawOpenInterest>(url, 20_000);

  return {
    symbol: raw.symbol,
    openInterest: toNumber(raw.openInterest),
    time: raw.time
  };
}

export async function getOpenInterestHistory(
  symbol: string,
  period: FuturesDataPeriod,
  limit = 12
): Promise<OpenInterestHistoryPoint[]> {
  type RawPoint = {
    symbol: string;
    sumOpenInterest: string;
    sumOpenInterestValue: string;
    timestamp: number;
  };

  const url = buildUrl(FUTURES_DATA_BASE_URL, "/futures/data/openInterestHist", {
    symbol,
    period,
    limit: Math.min(Math.max(limit, 2), 30)
  });
  const rows = await fetchJson<RawPoint[]>(url, 60_000);

  return rows.map((row) => ({
    symbol: row.symbol,
    sumOpenInterest: toNumber(row.sumOpenInterest),
    sumOpenInterestValue: toNumber(row.sumOpenInterestValue),
    timestamp: row.timestamp
  }));
}

export async function getLongShortRatio(
  symbol: string,
  period: FuturesDataPeriod,
  limit = 1
): Promise<RatioPoint | null> {
  type RawRatio = {
    symbol: string;
    longAccount: string;
    shortAccount: string;
    longShortRatio: string;
    timestamp: number;
  };

  const url = buildUrl(
    FUTURES_DATA_BASE_URL,
    "/futures/data/globalLongShortAccountRatio",
    {
      symbol,
      period,
      limit: Math.min(Math.max(limit, 1), 30)
    }
  );
  const rows = await fetchJson<RawRatio[]>(url, 60_000);
  const latest = rows.at(-1);

  if (!latest) {
    return null;
  }

  return {
    symbol: latest.symbol,
    longShortRatio: toNumber(latest.longShortRatio),
    longAccount: toNumber(latest.longAccount),
    shortAccount: toNumber(latest.shortAccount),
    timestamp: latest.timestamp
  };
}

export async function getTakerBuySellVolume(
  symbol: string,
  period: FuturesDataPeriod,
  limit = 1
): Promise<RatioPoint | null> {
  type RawRatio = {
    buySellRatio: string;
    buyVol: string;
    sellVol: string;
    timestamp: number;
  };

  const url = buildUrl(FUTURES_DATA_BASE_URL, "/futures/data/takerlongshortRatio", {
    symbol,
    period,
    limit: Math.min(Math.max(limit, 1), 30)
  });
  const rows = await fetchJson<RawRatio[]>(url, 60_000);
  const latest = rows.at(-1);

  if (!latest) {
    return null;
  }

  return {
    symbol,
    longShortRatio: toNumber(latest.buySellRatio),
    buySellRatio: toNumber(latest.buySellRatio),
    buyVol: toNumber(latest.buyVol),
    sellVol: toNumber(latest.sellVol),
    timestamp: latest.timestamp
  };
}
