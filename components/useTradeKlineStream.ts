"use client";

import { useEffect, useRef, useState } from "react";
import { TradeTick } from "@/lib/realtimeKlines";
import { Interval } from "@/lib/types";

type StreamStatus = "idle" | "connecting" | "live" | "reconnecting" | "error";

interface UseTradeKlineStreamOptions {
  enabled: boolean;
  symbol: string;
  interval: Interval;
  onTrades: (trades: TradeTick[]) => void;
}

interface BinanceTradePayload {
  e: "trade";
  t: number;
  p: string;
  q: string;
  T: number;
}

export function useTradeKlineStream({
  enabled,
  symbol,
  interval,
  onTrades
}: UseTradeKlineStreamOptions) {
  const [status, setStatus] = useState<StreamStatus>("idle");
  const [lastTradeAt, setLastTradeAt] = useState<number | null>(null);
  const bufferRef = useRef<TradeTick[]>([]);
  const lastTradeIdRef = useRef(0);
  const reconnectTimerRef = useRef<number | null>(null);
  const onTradesRef = useRef(onTrades);

  useEffect(() => {
    onTradesRef.current = onTrades;
  }, [onTrades]);

  useEffect(() => {
    if (!enabled || !/^[A-Z0-9]{5,20}$/.test(symbol)) {
      const idleTimerId = window.setTimeout(() => {
        setStatus("idle");
      }, 0);

      return () => {
        window.clearTimeout(idleTimerId);
      };
    }

    let connectTimerId: number | null = null;
    let socket: WebSocket | null = null;
    let stopped = false;

    const flushIntervalId = window.setInterval(() => {
      const trades = bufferRef.current;

      if (!trades.length) {
        return;
      }

      bufferRef.current = [];
      onTradesRef.current(trades);
    }, 500);

    const connect = () => {
      if (stopped) {
        return;
      }

      const streamName = `${symbol.toLowerCase()}@trade`;
      socket = new WebSocket(`wss://stream.binance.com:9443/ws/${streamName}`);
      setStatus((current) => (current === "live" ? "reconnecting" : "connecting"));

      socket.onopen = () => {
        if (!stopped) {
          setStatus("live");
        }
      };

      socket.onmessage = (event) => {
        try {
          const payload = JSON.parse(String(event.data)) as BinanceTradePayload;
          const id = Number(payload.t);

          if (!Number.isFinite(id) || id <= lastTradeIdRef.current) {
            return;
          }

          const price = Number(payload.p);
          const quantity = Number(payload.q);
          const timestamp = Number(payload.T);

          if (
            !Number.isFinite(price) ||
            !Number.isFinite(quantity) ||
            !Number.isFinite(timestamp)
          ) {
            return;
          }

          lastTradeIdRef.current = id;
          bufferRef.current.push({ id, price, quantity, timestamp });
          setLastTradeAt(timestamp);
        } catch {
          setStatus("error");
        }
      };

      socket.onerror = () => {
        if (!stopped) {
          setStatus("error");
        }
      };

      socket.onclose = () => {
        if (stopped) {
          return;
        }

        setStatus("reconnecting");
        reconnectTimerRef.current = window.setTimeout(connect, 2500);
      };
    };

    lastTradeIdRef.current = 0;
    bufferRef.current = [];
    connectTimerId = window.setTimeout(connect, 0);

    return () => {
      stopped = true;
      window.clearInterval(flushIntervalId);

      if (connectTimerId !== null) {
        window.clearTimeout(connectTimerId);
      }

      if (reconnectTimerRef.current !== null) {
        window.clearTimeout(reconnectTimerRef.current);
      }

      socket?.close();
      bufferRef.current = [];
    };
  }, [enabled, interval, symbol]);

  return {
    status,
    lastTradeAt
  };
}
