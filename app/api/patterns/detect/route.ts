import { NextRequest, NextResponse } from "next/server";
import { getSpotKlines } from "@/lib/binanceClient";
import { detectPatterns } from "@/lib/patterns/detectPatterns";
import { Interval, SUPPORTED_INTERVALS } from "@/lib/types";

export const dynamic = "force-dynamic";

function isInterval(value: string | null): value is Interval {
  return SUPPORTED_INTERVALS.includes(value as Interval);
}

function cleanSymbol(value: string | null) {
  const symbol = (value || "BTCUSDT").toUpperCase().trim();
  return /^[A-Z0-9]{5,20}$/.test(symbol) ? symbol : "BTCUSDT";
}

function detectionLimit(interval: Interval) {
  switch (interval) {
    case "1m":
    case "5m":
    case "15m":
    case "30m":
      return 240;
    case "1h":
    case "4h":
      return 220;
    case "1d":
    case "1w":
    case "1M":
      return 160;
    default:
      return 220;
  }
}

export async function GET(request: NextRequest) {
  const symbol = cleanSymbol(request.nextUrl.searchParams.get("symbol"));
  const intervalParam = request.nextUrl.searchParams.get("interval");
  const interval = isInterval(intervalParam) ? intervalParam : "4h";

  try {
    const klines = await getSpotKlines(symbol, interval, detectionLimit(interval));

    return NextResponse.json({
      symbol,
      interval,
      patterns: detectPatterns(klines),
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error("Failed to detect patterns", error);

    return NextResponse.json(
      {
        error: "Unable to detect patterns from Binance klines.",
        symbol,
        interval
      },
      { status: 502 }
    );
  }
}
