import { NextRequest, NextResponse } from "next/server";
import { getMarketKlines } from "@/lib/binanceClient";
import { buildHistoricalPatternMatches } from "@/lib/patterns/matchPatterns";
import {
  Interval,
  MarketType,
  SUPPORTED_INTERVALS,
  SUPPORTED_MARKETS
} from "@/lib/types";

export const dynamic = "force-dynamic";

function isInterval(value: string | null): value is Interval {
  return SUPPORTED_INTERVALS.includes(value as Interval);
}

function isMarket(value: string | null): value is MarketType {
  return SUPPORTED_MARKETS.includes(value as MarketType);
}

function cleanSymbol(value: string | null) {
  const symbol = (value || "BTCUSDT").toUpperCase().trim();
  return /^[A-Z0-9]{5,20}$/.test(symbol) ? symbol : "BTCUSDT";
}

function numericParam(value: string | null, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function matchLimit(interval: Interval) {
  switch (interval) {
    case "1M":
      return 360;
    case "1w":
      return 520;
    default:
      return 1000;
  }
}

export async function GET(request: NextRequest) {
  const symbol = cleanSymbol(request.nextUrl.searchParams.get("symbol"));
  const marketParam = request.nextUrl.searchParams.get("market");
  const market = isMarket(marketParam) ? marketParam : "spot";
  const intervalParam = request.nextUrl.searchParams.get("interval");
  const interval = isInterval(intervalParam) ? intervalParam : "4h";
  const lookback = Math.min(
    Math.max(Math.round(numericParam(request.nextUrl.searchParams.get("lookback"), 60)), 20),
    180
  );
  const topK = Math.min(
    Math.max(Math.round(numericParam(request.nextUrl.searchParams.get("topK"), 20)), 3),
    30
  );

  try {
    const klines = await getMarketKlines(symbol, interval, matchLimit(interval), market);

    if (klines.length < lookback + 50) {
      return NextResponse.json(
        {
          error: "Not enough historical klines for pattern matching.",
          symbol,
          market,
          interval,
          available: klines.length
        },
        { status: 422 }
      );
    }

    return NextResponse.json(
      buildHistoricalPatternMatches(symbol, market, interval, klines, lookback, topK)
    );
  } catch (error) {
    console.error("Failed to match historical patterns", error);

    return NextResponse.json(
      {
        error: "Unable to match historical patterns from Binance klines.",
        symbol,
        market,
        interval
      },
      { status: 502 }
    );
  }
}
