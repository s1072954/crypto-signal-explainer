"use client";

import { useEffect, useRef } from "react";
import {
  ColorType,
  createChart,
  IChartApi,
  UTCTimestamp
} from "lightweight-charts";
import { BarChart3 } from "lucide-react";
import { calculateMA } from "@/lib/indicators";
import { Kline } from "@/lib/types";

interface PriceChartProps {
  klines: Kline[];
  symbol: string;
  loading?: boolean;
}

function toChartTime(timestamp: number) {
  return Math.floor(timestamp / 1000) as UTCTimestamp;
}

export function PriceChart({ klines, symbol, loading }: PriceChartProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!containerRef.current || !klines.length) {
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
      priceScaleId: "volume"
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

    chart.priceScale("volume").applyOptions({
      scaleMargins: {
        top: 0.8,
        bottom: 0
      }
    });

    candleSeries.setData(
      klines.map((kline) => ({
        time: toChartTime(kline.openTime),
        open: kline.open,
        high: kline.high,
        low: kline.low,
        close: kline.close
      }))
    );
    volumeSeries.setData(
      klines.map((kline) => ({
        time: toChartTime(kline.openTime),
        value: kline.volume,
        color: kline.close >= kline.open ? "rgba(15, 159, 110, 0.38)" : "rgba(220, 38, 38, 0.34)"
      }))
    );
    ma20Series.setData(
      calculateMA(klines, 20).map((point) => ({
        time: toChartTime(point.time),
        value: point.value
      }))
    );
    ma50Series.setData(
      calculateMA(klines, 50).map((point) => ({
        time: toChartTime(point.time),
        value: point.value
      }))
    );

    chart.timeScale().fitContent();

    return () => {
      chart.remove();
    };
  }, [klines]);

  return (
    <section className="min-h-[34rem] rounded-lg border border-line bg-panel p-4 shadow-soft">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-ink">{symbol} 價格結構</h2>
          <p className="text-sm text-slate-500">OHLCV、MA20、MA50</p>
        </div>
        <div className="flex items-center gap-4 text-xs font-semibold text-slate-500">
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-5 rounded bg-blue-600" />
            MA20
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-5 rounded bg-amber-500" />
            MA50
          </span>
        </div>
      </div>

      <div className="relative h-[460px] min-h-[460px] overflow-hidden rounded-md border border-slate-100 bg-white">
        {klines.length ? (
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
