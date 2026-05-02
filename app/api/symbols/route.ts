import { NextResponse } from "next/server";
import { DEFAULT_SYMBOLS, getUsdtSpotSymbols } from "@/lib/binanceClient";
import { SymbolsResponse } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const symbols = await getUsdtSpotSymbols();

    return NextResponse.json<SymbolsResponse>({
      symbols: symbols.length ? symbols : DEFAULT_SYMBOLS,
      fallback: !symbols.length
    });
  } catch (error) {
    console.error("Failed to load Binance symbols", error);

    return NextResponse.json<SymbolsResponse>({
      symbols: DEFAULT_SYMBOLS,
      fallback: true
    });
  }
}
