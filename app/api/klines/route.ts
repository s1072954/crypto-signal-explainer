import { NextRequest, NextResponse } from "next/server";
import { getMarketKlines } from "@/lib/binanceClient";
import {
  Interval,
  KlinesResponse,
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

export async function GET(request: NextRequest) {
  const symbol = cleanSymbol(request.nextUrl.searchParams.get("symbol"));
  const marketParam = request.nextUrl.searchParams.get("market");
  const market = isMarket(marketParam) ? marketParam : "spot";
  const intervalParam = request.nextUrl.searchParams.get("interval");
  const interval = isInterval(intervalParam) ? intervalParam : "4h";
  const rawLimit = Number(request.nextUrl.searchParams.get("limit") || 240);
  const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 20), 1000) : 240;

  try {
    const klines = await getMarketKlines(symbol, interval, limit, market);

    return NextResponse.json<KlinesResponse>({
      symbol,
      market,
      interval,
      klines
    });
  } catch (error) {
    console.error("Failed to load Binance klines", error);

    return NextResponse.json(
      {
        error: "Unable to load klines from Binance.",
        symbol,
        market,
        interval
      },
      { status: 502 }
    );
  }
}
