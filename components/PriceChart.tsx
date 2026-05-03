"use client";

import { useEffect, useMemo, useRef } from "react";
import {
  ColorType,
  createChart,
  IChartApi,
  ISeriesApi,
  UTCTimestamp
} from "lightweight-charts";
import { BarChart3, Radio } from "lucide-react";
import { calculateMA } from "@/lib/indicators";
import { normalizeKlines } from "@/lib/klineGuards";
import { PatternMatch } from "@/lib/patterns/patternTypes";
import { Kline, MarketType } from "@/lib/types";

interface PriceChartProps {
  klines: Kline[];
  market: MarketType;
  symbol: string;
  loading?: boolean;
  streamStatus?: "idle" | "connecting" | "live" | "reconnecting" | "error";
  lastTradeAt?: number | null;
  projectionMatch?: PatternMatch | null;
  projectionKlines?: Kline[];
}

function toChartTime(timestamp: number) {
  return Math.floor(timestamp / 1000) as UTCTimestamp;
}

function streamStatusText(status?: PriceChartProps["streamStatus"]) {
  switch (status) {
    case "live":
      return "Trade stream live";
    case "connecting":
      return "Connecting stream";
    case "reconnecting":
      return "Reconnecting stream";
    case "error":
      return "Stream error";
    default:
      return "Stream idle";
  }
}

function streamStatusClass(status?: PriceChartProps["streamStatus"]) {
  switch (status) {
    case "live":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "connecting":
    case "reconnecting":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "error":
      return "border-rose-200 bg-rose-50 text-rose-700";
    default:
      return "border-slate-200 bg-slate-50 text-slate-500";
  }
}

export function PriceChart({
  klines,
  market,
  symbol,
  loading,
  streamStatus,
  lastTradeAt,
  projectionMatch,
  projectionKlines = []
}: PriceChartProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);
  const ma20SeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const ma50SeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const projectionCandleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const didFitContentRef = useRef(false);
  const previousProjectionKeyRef = useRef<string | null>(null);
  const chartKlines = useMemo(() => normalizeKlines(klines), [klines]);
  const hasChartData = chartKlines.length > 0;
  const projectionCandles = useMemo(
    () =>
      normalizeKlines(projectionKlines).map((kline) => ({
        time: toChartTime(kline.openTime),
        open: kline.open,
        high: kline.high,
        low: kline.low,
        close: kline.close
      })),
    [projectionKlines]
  );
  const projectionKey = projectionMatch
    ? `${market}-${symbol}-${projectionMatch.matchedInterval}-${projectionMatch.startTime}-${projectionMatch.endTime}`
    : null;

  useEffect(() => {
    if (!containerRef.current || chartRef.current || !hasChartData) {
      return;
    }

    const container = containerRef.current;
    const chart: IChartApi = createChart(container, {
      autoSize: true,
      height: 460,
      layout: {
        background: {
          type: ColorType.Solid,
          color: "#ffffff"
        },
        textColor: "#475569",
        fontFamily:
          "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
      },
      grid: {
        vertLines: { color: "#eef2f7" },
        horzLines: { color: "#eef2f7" }
      },
      rightPriceScale: {
        borderColor: "#d8dee9",
        scaleMargins: {
          top: 0.1,
          bottom: 0.24
        }
      },
      timeScale: {
        borderColor: "#d8dee9",
        timeVisible: true,
        secondsVisible: false
      },
      crosshair: {
        mode: 1
      }
    });

    const candleSeries = chart.addCandlestickSeries({
      upColor: "#0f9f6e",
      downColor: "#dc2626",
      borderUpColor: "#0f9f6e",
      borderDownColor: "#dc2626",
      wickUpColor: "#0f9f6e",
      wickDownColor: "#dc2626"
    });
    const volumeSeries = chart.addHistogramSeries({
      priceFormat: {
        type: "volume"
      },
      priceScaleId: "volume",
      lastValueVisible: false,
      priceLineVisible: false
    });
    const ma20Series = chart.addLineSeries({
      color: "#2563eb",
      lineWidth: 2,
      title: "MA20"
    });
    const ma50Series = chart.addLineSeries({
      color: "#f59e0b",
      lineWidth: 2,
      title: "MA50"
    });
    const projectionCandleSeries = chart.addCandlestickSeries({
      upColor: "rgba(20, 184, 166, 0.36)",
      downColor: "rgba(244, 63, 94, 0.34)",
      borderUpColor: "rgba(13, 148, 136, 0.72)",
      borderDownColor: "rgba(225, 29, 72, 0.68)",
      wickUpColor: "rgba(13, 148, 136, 0.72)",
      wickDownColor: "rgba(225, 29, 72, 0.68)",
      lastValueVisible: false,
      priceLineVisible: false,
      title: "Projection"
    });

    chart.priceScale("volume").applyOptions({
      scaleMargins: {
        top: 0.8,
        bottom: 0
      }
    });

    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;
    volumeSeriesRef.current = volumeSeries;
    ma20SeriesRef.current = ma20Series;
    ma50SeriesRef.current = ma50Series;
    projectionCandleSeriesRef.current = projectionCandleSeries;

    return () => {
      chart.remove();
      chartRef.current = null;
      candleSeriesRef.current = null;
      volumeSeriesRef.current = null;
      ma20SeriesRef.current = null;
      ma50SeriesRef.current = null;
      projectionCandleSeriesRef.current = null;
      didFitContentRef.current = false;
      previousProjectionKeyRef.current = null;
    };
  }, [hasChartData]);

  useEffect(() => {
    if (
      !chartKlines.length ||
      !chartRef.current ||
      !candleSeriesRef.current ||
      !volumeSeriesRef.current ||
      !ma20SeriesRef.current ||
      !ma50SeriesRef.current
    ) {
      return;
    }

    const timeScale = chartRef.current.timeScale();
    const visibleLogicalRange = didFitContentRef.current
      ? timeScale.getVisibleLogicalRange()
      : null;

    candleSeriesRef.current.setData(
      chartKlines.map((kline) => ({
        time: toChartTime(kline.openTime),
        open: kline.open,
        high: kline.high,
        low: kline.low,
        close: kline.close
      }))
    );
    volumeSeriesRef.current.setData(
      chartKlines.map((kline) => ({
        time: toChartTime(kline.openTime),
        value: kline.volume,
        color:
          kline.close >= kline.open
            ? "rgba(15, 159, 110, 0.38)"
            : "rgba(220, 38, 38, 0.34)"
      }))
    );
    ma20SeriesRef.current.setData(
      calculateMA(chartKlines, 20).map((point) => ({
        time: toChartTime(point.time),
        value: point.value
      }))
    );
    ma50SeriesRef.current.setData(
      calculateMA(chartKlines, 50).map((point) => ({
        time: toChartTime(point.time),
        value: point.value
      }))
    );

    if (!didFitContentRef.current) {
      timeScale.fitContent();
      didFitContentRef.current = true;
    } else if (visibleLogicalRange) {
      timeScale.setVisibleLogicalRange(visibleLogicalRange);
    }
  }, [chartKlines]);

  useEffect(() => {
    if (!chartRef.current || !projectionCandleSeriesRef.current) {
      return;
    }

    projectionCandleSeriesRef.current.setData(projectionCandles);

    if (
      projectionKey &&
      projectionCandles.length &&
      previousProjectionKeyRef.current !== projectionKey
    ) {
      chartRef.current.timeScale().fitContent();
    }

    previousProjectionKeyRef.current = projectionKey;
  }, [projectionCandles, projectionKey]);

  useEffect(() => {
    didFitContentRef.current = false;
    previousProjectionKeyRef.current = null;
  }, [market, symbol]);

  return (
    <section className="min-h-[34rem] rounded-lg border border-line bg-panel p-4 shadow-soft">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-ink">
            {symbol} {market === "futures" ? "USD-M 合約" : "現貨"} K 線
          </h2>
          <p className="text-sm text-slate-500">OHLCV、MA20、MA50</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-500">
          <span
            className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 ${streamStatusClass(
              streamStatus
            )}`}
          >
            <Radio className="h-3.5 w-3.5" aria-hidden="true" />
            {streamStatusText(streamStatus)}
          </span>
          {lastTradeAt ? (
            <span>
              {new Date(lastTradeAt).toLocaleTimeString("zh-TW", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit"
              })}
            </span>
          ) : null}
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-5 rounded bg-blue-600" />
            MA20
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-5 rounded bg-amber-500" />
            MA50
          </span>
          {projectionMatch ? (
            <span className="inline-flex items-center gap-1 text-teal-700">
              <span className="h-2 w-5 rounded bg-teal-500/60" />
              相似樣本投影
            </span>
          ) : null}
        </div>
      </div>

      <div className="relative h-[460px] min-h-[460px] overflow-hidden rounded-md border border-slate-100 bg-white">
        {chartKlines.length ? (
          <div ref={containerRef} className="h-full w-full" />
        ) : (
          <div className="flex h-full items-center justify-center text-slate-500">
            <div className="flex items-center gap-2 text-sm font-medium">
              <BarChart3 className="h-5 w-5" aria-hidden="true" />
              {loading ? "載入 K 線資料中" : "尚無 K 線資料"}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
