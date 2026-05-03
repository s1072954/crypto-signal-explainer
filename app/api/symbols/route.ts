import { NextResponse } from "next/server";
import { DEFAULT_SYMBOLS, getMarketSymbols } from "@/lib/binanceClient";
import { MarketType, SUPPORTED_MARKETS, SymbolsResponse } from "@/lib/types";

export const dynamic = "force-dynamic";

function isMarket(value: string | null): value is MarketType {
  return SUPPORTED_MARKETS.includes(value as MarketType);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const marketParam = searchParams.get("market");
  const market = isMarket(marketParam) ? marketParam : "spot";

  try {
    const symbols = await getMarketSymbols(market);

    return NextResponse.json<SymbolsResponse>({
      symbols: symbols.length ? symbols : DEFAULT_SYMBOLS,
      fallback: !symbols.length,
      market
    });
  } catch (error) {
    console.error("Failed to load Binance symbols", error);

    return NextResponse.json<SymbolsResponse>({
      symbols: DEFAULT_SYMBOLS,
      fallback: true,
      market
    });
  }
}
