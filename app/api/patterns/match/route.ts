import { NextRequest, NextResponse } from "next/server";
import { getSpotKlines } from "@/lib/binanceClient";
import { buildHistoricalPatternMatches } from "@/lib/patterns/matchPatterns";
import { Interval, SUPPORTED_INTERVALS } from "@/lib/types";

export const dynamic = "force-dynamic";

function isInterval(value: string | null): value is Interval {
  return SUPPORTED_INTERVALS.includes(value as Interval);
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
    const klines = await getSpotKlines(symbol, interval, matchLimit(interval));

    if (klines.length < lookback + 50) {
      return NextResponse.json(
        {
          error: "Not enough historical klines for pattern matching.",
          symbol,
          interval,
          available: klines.length
        },
        { status: 422 }
      );
    }

    return NextResponse.json(
      buildHistoricalPatternMatches(symbol, interval, klines, lookback, topK)
    );
  } catch (error) {
    console.error("Failed to match historical patterns", error);

    return NextResponse.json(
      {
        error: "Unable to match historical patterns from Binance klines.",
        symbol,
        interval
      },
      { status: 502 }
    );
  }
}
