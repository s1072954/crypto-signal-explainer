import { NextRequest, NextResponse } from "next/server";
import {
  get24hrTicker,
  getAggTrades,
  getFundingRate,
  getLongShortRatio,
  getOpenInterest,
  getOpenInterestHistory,
  getOrderBook,
  getSpotKlines,
  getTakerBuySellVolume
} from "@/lib/binanceClient";
import { buildOverallAnalysis } from "@/lib/signalEngine";
import {
  AnalysisInput,
  FundingRateRecord,
  FuturesDataPeriod,
  Interval,
  Kline,
  OpenInterestHistoryPoint,
  OpenInterestSnapshot,
  RatioPoint,
  SUPPORTED_INTERVALS
} from "@/lib/types";

export const dynamic = "force-dynamic";

function isInterval(value: string | null): value is Interval {
  return SUPPORTED_INTERVALS.includes(value as Interval);
}

function cleanSymbol(value: string | null) {
  const symbol = (value || "BTCUSDT").toUpperCase().trim();
  return /^[A-Z0-9]{5,20}$/.test(symbol) ? symbol : "BTCUSDT";
}

function analysisLimit(interval: Interval) {
  switch (interval) {
    case "1m":
    case "5m":
    case "15m":
    case "30m":
      return 1000;
    case "1h":
      return 500;
    case "4h":
      return 240;
    case "1d":
      return 220;
    case "1w":
      return 160;
    case "1M":
      return 120;
    default:
      return 240;
  }
}

function futuresPeriodForInterval(interval: Interval): FuturesDataPeriod {
  switch (interval) {
    case "1m":
      return "5m";
    case "5m":
    case "15m":
    case "30m":
    case "1h":
    case "4h":
    case "1d":
      return interval;
    case "1w":
    case "1M":
      return "1d";
    default:
      return "4h";
  }
}

async function optional<T>(promise: Promise<T>, fallback: T): Promise<T> {
  try {
    return await promise;
  } catch (error) {
    console.warn("Optional Binance dataset unavailable", error);
    return fallback;
  }
}

export async function GET(request: NextRequest) {
  const symbol = cleanSymbol(request.nextUrl.searchParams.get("symbol"));
  const intervalParam = request.nextUrl.searchParams.get("interval");
  const interval = isInterval(intervalParam) ? intervalParam : "4h";
  const limit = analysisLimit(interval);

  try {
    const [klines, ticker, orderBook, aggTrades] = await Promise.all([
      getSpotKlines(symbol, interval, limit),
      get24hrTicker(symbol),
      getOrderBook(symbol, 100),
      getAggTrades(symbol, 500)
    ]);
    const futuresPeriod = futuresPeriodForInterval(interval);
    const benchmarkPromise: Promise<Kline[] | undefined> =
      symbol === "BTCUSDT"
        ? Promise.resolve(undefined)
        : optional<Kline[] | undefined>(
            getSpotKlines("BTCUSDT", interval, limit),
            undefined
          );
    const [
      fundingRates,
      openInterest,
      openInterestHistory,
      longShortRatio,
      takerBuySellVolume,
      benchmarkKlines
    ] = await Promise.all([
      optional<FundingRateRecord[]>(getFundingRate(symbol, 8), []),
      optional<OpenInterestSnapshot | null>(getOpenInterest(symbol), null),
      optional<OpenInterestHistoryPoint[]>(
        getOpenInterestHistory(symbol, futuresPeriod, 12),
        []
      ),
      optional<RatioPoint | null>(getLongShortRatio(symbol, futuresPeriod, 1), null),
      optional<RatioPoint | null>(
        getTakerBuySellVolume(symbol, futuresPeriod, 1),
        null
      ),
      benchmarkPromise
    ]);
    const input: AnalysisInput = {
      symbol,
      interval,
      klines,
      ticker,
      orderBook,
      aggTrades,
      fundingRates,
      openInterest,
      openInterestHistory,
      longShortRatio,
      takerBuySellVolume,
      benchmarkKlines
    };

    return NextResponse.json(buildOverallAnalysis(input));
  } catch (error) {
    console.error("Failed to build market analysis", error);

    return NextResponse.json(
      {
        error: "Unable to build analysis from Binance data.",
        symbol,
        interval
      },
      { status: 502 }
    );
  }
}
