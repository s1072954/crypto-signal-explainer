"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, BarChart3, RefreshCw, WifiOff } from "lucide-react";
import { IndicatorExplanationTable } from "@/components/IndicatorExplanationTable";
import { IndicatorModuleCard } from "@/components/IndicatorModuleCard";
import { IntervalSelector } from "@/components/IntervalSelector";
import { MarketSelector } from "@/components/MarketSelector";
import { OverallSignalCard } from "@/components/OverallSignalCard";
import { PriceChart } from "@/components/PriceChart";
import { RiskWarningCard } from "@/components/RiskWarningCard";
import { SymbolSelector } from "@/components/SymbolSelector";
import { PatternDetectionCard } from "@/components/patterns/PatternDetectionCard";
import { HistoricalPatternMatcher } from "@/components/patterns/HistoricalPatternMatcher";
import { useTradeKlineStream } from "@/components/useTradeKlineStream";
import {
  Interval,
  Kline,
  KlinesResponse,
  MarketType,
  OverallAnalysis,
  SymbolsResponse
} from "@/lib/types";
import {
  PatternDetectionResponse,
  PatternMatch,
  PatternMatchResponse
} from "@/lib/patterns/patternTypes";
import { aggregateTradesIntoKlines, TradeTick } from "@/lib/realtimeKlines";

const DEFAULT_SYMBOLS = ["BTCUSDT", "ETHUSDT", "SOLUSDT", "BNBUSDT", "DOGEUSDT"];
const BASE_PATH = (process.env.NEXT_PUBLIC_BASE_PATH || "").replace(/\/$/, "");

function apiPath(path: string) {
  return `${BASE_PATH}${path}`;
}

function patternMatchKey(match: Pick<PatternMatch, "startTime" | "endTime">) {
  return `${match.startTime}-${match.endTime}`;
}

async function fetchJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(url, {
    signal,
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`);
  }

  return (await response.json()) as T;
}

async function fetchOptionalJson<T>(
  url: string,
  fallback: T,
  signal?: AbortSignal
): Promise<T> {
  try {
    return await fetchJson<T>(url, signal);
  } catch (error) {
    if ((error as Error).name === "AbortError") {
      throw error;
    }

    return fallback;
  }
}

export function Dashboard() {
  const [symbols, setSymbols] = useState(DEFAULT_SYMBOLS);
  const [market, setMarket] = useState<MarketType>("spot");
  const [symbol, setSymbol] = useState("BTCUSDT");
  const [interval, setInterval] = useState<Interval>("4h");
  const [analysis, setAnalysis] = useState<OverallAnalysis | null>(null);
  const [klines, setKlines] = useState<Kline[]>([]);
  const [patterns, setPatterns] = useState<PatternDetectionResponse | null>(null);
  const [patternMatches, setPatternMatches] =
    useState<PatternMatchResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [symbolsLoading, setSymbolsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshNonce, setRefreshNonce] = useState(0);
  const [selectedPatternMatchKey, setSelectedPatternMatchKey] =
    useState<string | null>(null);

  const validSymbol = useMemo(() => /^[A-Z0-9]{5,20}$/.test(symbol), [symbol]);
  const selectedPatternMatch = useMemo(() => {
    const matches = patternMatches?.matches ?? [];

    if (!matches.length) {
      return null;
    }

    return (
      matches.find((match) => patternMatchKey(match) === selectedPatternMatchKey) ??
      matches[0]
    );
  }, [patternMatches, selectedPatternMatchKey]);
  const handleRealtimeTrades = useCallback(
    (trades: TradeTick[]) => {
      setKlines((currentKlines) =>
        aggregateTradesIntoKlines(currentKlines, trades, interval, 240)
      );
    },
    [interval]
  );
  const streamEnabled =
    validSymbol &&
    Boolean(klines.length) &&
    analysis?.symbol === symbol &&
    analysis?.market === market &&
    analysis?.interval === interval;
  const { status: streamStatus, lastTradeAt } = useTradeKlineStream({
    enabled: streamEnabled,
    market,
    symbol,
    interval,
    onTrades: handleRealtimeTrades
  });

  useEffect(() => {
    let active = true;

    fetchJson<SymbolsResponse>(apiPath(`/api/symbols?market=${market}`))
      .then((payload) => {
        if (!active) {
          return;
        }

        const nextSymbols = payload.symbols.length ? payload.symbols : DEFAULT_SYMBOLS;

        setSymbols(nextSymbols);
        setSymbol((currentSymbol) =>
          nextSymbols.includes(currentSymbol)
            ? currentSymbol
            : nextSymbols.includes("BTCUSDT")
              ? "BTCUSDT"
              : (nextSymbols[0] ?? "BTCUSDT")
        );
      })
      .catch(() => {
        if (active) {
          setSymbols(DEFAULT_SYMBOLS);
        }
      })
      .finally(() => {
        if (active) {
          setSymbolsLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [market]);

  const handleMarketChange = useCallback((nextMarket: MarketType) => {
    setMarket(nextMarket);
    setSymbolsLoading(true);
    setAnalysis(null);
    setKlines([]);
    setPatterns(null);
    setPatternMatches(null);
    setSelectedPatternMatchKey(null);
    setError(null);
  }, []);

  const handleSymbolChange = useCallback((nextSymbol: string) => {
    setSymbol(nextSymbol);
    setSelectedPatternMatchKey(null);
  }, []);

  const handleIntervalChange = useCallback((nextInterval: Interval) => {
    setInterval(nextInterval);
    setSelectedPatternMatchKey(null);
  }, []);

  const handleSelectPatternMatch = useCallback((match: PatternMatch) => {
    setSelectedPatternMatchKey(patternMatchKey(match));
  }, []);

  const loadData = useCallback(
    async (signal?: AbortSignal) => {
      await Promise.resolve();

      if (!validSymbol) {
        setError("交易對格式不正確");
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const [analysisPayload, klinesPayload, patternsPayload, matchesPayload] =
          await Promise.all([
          fetchJson<OverallAnalysis>(
            apiPath(
              `/api/analysis?market=${market}&symbol=${encodeURIComponent(
                symbol
              )}&interval=${interval}`
            ),
            signal
          ),
          fetchJson<KlinesResponse>(
            apiPath(
              `/api/klines?market=${market}&symbol=${encodeURIComponent(
                symbol
              )}&interval=${interval}&limit=240`
            ),
            signal
          ),
          fetchOptionalJson<PatternDetectionResponse | null>(
            apiPath(
              `/api/patterns/detect?market=${market}&symbol=${encodeURIComponent(
                symbol
              )}&interval=${interval}`
            ),
            null,
            signal
          ),
          fetchOptionalJson<PatternMatchResponse | null>(
            apiPath(
              `/api/patterns/match?market=${market}&symbol=${encodeURIComponent(
                symbol
              )}&interval=${interval}&lookback=60&topK=20`
            ),
            null,
            signal
          )
        ]);

        setAnalysis(analysisPayload);
        setKlines(klinesPayload.klines);
        setPatterns(patternsPayload);
        setPatternMatches(matchesPayload);
      } catch (loadError) {
        if ((loadError as Error).name === "AbortError") {
          return;
        }

        setError("無法取得 Binance 資料，請稍後重試或換一個交易對。");
      } finally {
        if (!signal?.aborted) {
          setLoading(false);
        }
      }
    },
    [interval, market, symbol, validSymbol]
  );

  useEffect(() => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => {
      void loadData(controller.signal);
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [loadData, refreshNonce]);

  return (
    <main className="min-h-screen px-4 py-5 text-ink sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-5">
        <header className="flex flex-col gap-4 border-b border-line pb-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-md bg-slate-900 text-white">
              <BarChart3 className="h-6 w-6" aria-hidden="true" />
            </span>
            <div>
              <h1 className="text-2xl font-semibold tracking-normal text-ink">
                Crypto Signal Explainer
              </h1>
              <p className="text-sm text-slate-500">
                Binance spot and futures signal dashboard
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
            <MarketSelector
              disabled={loading}
              value={market}
              onChange={handleMarketChange}
            />
            <SymbolSelector
              disabled={symbolsLoading}
              symbols={symbols}
              value={symbol}
              onChange={handleSymbolChange}
            />
            <IntervalSelector
              disabled={loading}
              value={interval}
              onChange={handleIntervalChange}
            />
            <button
              className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
              disabled={loading}
              type="button"
              onClick={() => setRefreshNonce((value) => value + 1)}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} aria-hidden="true" />
              Refresh
            </button>
          </div>
        </header>

        {error ? (
          <div className="flex items-start gap-3 rounded-lg border border-rose-200 bg-rose-50 p-4 text-rose-900">
            <WifiOff className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        ) : null}

        {!validSymbol ? (
          <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-950">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
            <p className="text-sm font-medium">請輸入有效的 USDT 交易對，例如 BTCUSDT。</p>
          </div>
        ) : null}

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_24rem]">
          <PriceChart
            klines={klines}
            lastTradeAt={lastTradeAt}
            loading={loading}
            streamStatus={streamStatus}
            market={market}
            projectionMatch={selectedPatternMatch}
            symbol={symbol}
          />
          <OverallSignalCard analysis={analysis} loading={loading} />
        </div>

        {analysis ? (
          <>
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              {analysis.modules.map((module) => (
                <IndicatorModuleCard key={module.key} module={module} />
              ))}
            </div>
            <PatternDetectionCard
              loading={loading}
              patterns={patterns?.patterns ?? []}
            />
            <HistoricalPatternMatcher
              data={patternMatches}
              loading={loading}
              selectedMatchKey={
                selectedPatternMatch ? patternMatchKey(selectedPatternMatch) : null
              }
              onSelectMatch={handleSelectPatternMatch}
            />
            <RiskWarningCard warnings={analysis.warnings} />
            <IndicatorExplanationTable modules={analysis.modules} />
          </>
        ) : (
          <section className="rounded-lg border border-line bg-panel p-5 text-sm text-slate-500 shadow-soft">
            {loading ? "正在載入市場資料與指標分析。" : "尚無分析資料。"}
          </section>
        )}
      </div>
    </main>
  );
}
