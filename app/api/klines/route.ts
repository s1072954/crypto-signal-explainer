import { NextRequest, NextResponse } from "next/server";
import { getSpotKlines } from "@/lib/binanceClient";
import { Interval, KlinesResponse, SUPPORTED_INTERVALS } from "@/lib/types";

export const dynamic = "force-dynamic";

function isInterval(value: string | null): value is Interval {
  return SUPPORTED_INTERVALS.includes(value as Interval);
}

function cleanSymbol(value: string | null) {
  const symbol = (value || "BTCUSDT").toUpperCase().trim();
  return /^[A-Z0-9]{5,20}$/.test(symbol) ? symbol : "BTCUSDT";
}

export async function GET(request: NextRequest) {
  const symbol = cleanSymbol(request.nextUrl.searchParams.get("symbol"));
  const intervalParam = request.nextUrl.searchParams.get("interval");
  const interval = isInterval(intervalParam) ? intervalParam : "4h";
  const rawLimit = Number(request.nextUrl.searchParams.get("limit") || 240);
  const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 20), 1000) : 240;

  try {
    const klines = await getSpotKlines(symbol, interval, limit);

    return NextResponse.json<KlinesResponse>({
      symbol,
      interval,
      klines
    });
  } catch (error) {
    console.error("Failed to load Binance klines", error);

    return NextResponse.json(
      {
        error: "Unable to load klines from Binance.",
        symbol,
        interval
      },
      { status: 502 }
    );
  }
}
