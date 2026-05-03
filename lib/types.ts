export type Direction = "bullish" | "bearish" | "neutral" | "warning";

export const SUPPORTED_MARKETS = ["spot", "futures"] as const;

export type MarketType = (typeof SUPPORTED_MARKETS)[number];

export type Confidence =
  | "high"
  | "medium_high"
  | "medium"
  | "medium_low"
  | "low";

export const SUPPORTED_INTERVALS = [
  "1m",
  "5m",
  "15m",
  "30m",
  "1h",
  "4h",
  "1d",
  "1w",
  "1M"
] as const;

export type Interval = (typeof SUPPORTED_INTERVALS)[number];

export const FUTURES_DATA_PERIODS = [
  "5m",
  "15m",
  "30m",
  "1h",
  "2h",
  "4h",
  "6h",
  "12h",
  "1d"
] as const;

export type FuturesDataPeriod = (typeof FUTURES_DATA_PERIODS)[number];

export type ModuleKey =
  | "trend"
  | "momentum"
  | "derivatives"
  | "liquidity";

export interface Kline {
  openTime: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  closeTime: number;
}

export interface MovingAveragePoint {
  time: number;
  value: number;
}

export interface Ticker24hr {
  symbol: string;
  lastPrice: number;
  priceChange: number;
  priceChangePercent: number;
  volume: number;
  quoteVolume: number;
}

export interface OrderBookLevel {
  price: number;
  quantity: number;
}

export interface OrderBook {
  lastUpdateId: number;
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
}

export interface AggTrade {
  id: number;
  price: number;
  quantity: number;
  firstTradeId: number;
  lastTradeId: number;
  timestamp: number;
  isBuyerMaker: boolean;
}

export interface FundingRateRecord {
  symbol: string;
  fundingRate: number;
  fundingTime: number;
}

export interface OpenInterestSnapshot {
  symbol: string;
  openInterest: number;
  time?: number;
}

export interface OpenInterestHistoryPoint {
  symbol: string;
  sumOpenInterest: number;
  sumOpenInterestValue: number;
  timestamp: number;
}

export interface RatioPoint {
  symbol: string;
  longShortRatio: number;
  longAccount?: number;
  shortAccount?: number;
  buySellRatio?: number;
  buyVol?: number;
  sellVol?: number;
  timestamp: number;
}

export interface IndicatorItem {
  key: string;
  name: string;
  value: number | string;
  unit?: string;
  direction: Direction;
  confidence: Confidence;
  meaning: string;
  bullishInterpretation: string;
  bearishInterpretation: string;
  riskNote: string;
  source: string;
  applicableTimeframes: Interval[];
}

export interface ModuleAnalysis {
  key: ModuleKey;
  label: string;
  score: number;
  direction: Direction;
  confidence: Confidence;
  summary: string;
  items: IndicatorItem[];
}

export interface OverallAnalysis {
  symbol: string;
  market: MarketType;
  interval: Interval;
  lastPrice: number;
  overallStatus: string;
  overallLabel: string;
  overallScore: number;
  summary: string;
  modules: ModuleAnalysis[];
  warnings: string[];
  updatedAt: string;
}

export interface KlinesResponse {
  symbol: string;
  market: MarketType;
  interval: Interval;
  klines: Kline[];
}

export interface SymbolsResponse {
  symbols: string[];
  fallback: boolean;
  market: MarketType;
}

export interface AnalysisInput {
  symbol: string;
  market: MarketType;
  interval: Interval;
  klines: Kline[];
  ticker: Ticker24hr;
  orderBook: OrderBook;
  aggTrades: AggTrade[];
  fundingRates: FundingRateRecord[];
  openInterest: OpenInterestSnapshot | null;
  openInterestHistory: OpenInterestHistoryPoint[];
  longShortRatio: RatioPoint | null;
  takerBuySellVolume: RatioPoint | null;
  benchmarkKlines?: Kline[];
}
