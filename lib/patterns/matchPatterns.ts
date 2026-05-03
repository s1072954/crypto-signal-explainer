import { calculateSimilarityScore } from "@/lib/patterns/similarity";
import { roundStat, summarizeMatches } from "@/lib/patterns/patternStats";
import { PatternMatch, PatternMatchResponse } from "@/lib/patterns/patternTypes";
import { Interval, Kline, MarketType } from "@/lib/types";

function percentReturn(from: number, to: number) {
  if (!Number.isFinite(from) || from === 0 || !Number.isFinite(to)) {
    return null;
  }

  return ((to - from) / from) * 100;
}

function futureReturn(klines: Kline[], windowEndIndex: number, horizon: number) {
  const end = klines[windowEndIndex];
  const future = klines[windowEndIndex + horizon];

  if (!end || !future) {
    return null;
  }

  return percentReturn(end.close, future.close);
}

function futureExtremes(klines: Kline[], windowEndIndex: number, horizon: number) {
  const end = klines[windowEndIndex];
  const future = klines.slice(windowEndIndex + 1, windowEndIndex + horizon + 1);

  if (!end || !future.length) {
    return {
      maxFutureUpside: null,
      maxFutureDrawdown: null
    };
  }

  const maxHigh = Math.max(...future.map((kline) => kline.high));
  const minLow = Math.min(...future.map((kline) => kline.low));

  return {
    maxFutureUpside: percentReturn(end.close, maxHigh),
    maxFutureDrawdown: percentReturn(end.close, minLow)
  };
}

export function buildHistoricalPatternMatches(
  symbol: string,
  market: MarketType,
  interval: Interval,
  klines: Kline[],
  lookback: number,
  topK: number
): PatternMatchResponse {
  const safeLookback = Math.min(Math.max(Math.round(lookback), 20), 180);
  const safeTopK = Math.min(Math.max(Math.round(topK), 3), 30);
  const horizon = 24;
  const queryWindow = klines.slice(-safeLookback);
  const queryCloses = queryWindow.map((kline) => kline.close);
  const latestQueryStart = klines.length - safeLookback;
  const candidates: PatternMatch[] = [];

  for (let start = 0; start + safeLookback + horizon < latestQueryStart; start += 1) {
    const end = start + safeLookback - 1;
    const window = klines.slice(start, start + safeLookback);
    const candidateCloses = window.map((kline) => kline.close);
    const { similarityScore, correlation, distance } = calculateSimilarityScore(
      queryCloses,
      candidateCloses
    );
    const extremes = futureExtremes(klines, end, horizon);

    candidates.push({
      matchedSymbol: symbol,
      matchedInterval: interval,
      startTime: window[0].openTime,
      endTime: window[window.length - 1].openTime,
      similarityScore: roundStat(similarityScore, 4) ?? 0,
      correlation: roundStat(correlation, 4) ?? 0,
      distance: roundStat(distance, 4) ?? 0,
      futureReturn6: roundStat(futureReturn(klines, end, 6)),
      futureReturn12: roundStat(futureReturn(klines, end, 12)),
      futureReturn24: roundStat(futureReturn(klines, end, 24)),
      maxFutureUpside: roundStat(extremes.maxFutureUpside),
      maxFutureDrawdown: roundStat(extremes.maxFutureDrawdown),
      window
    });
  }

  const matches = candidates
    .sort((a, b) => b.similarityScore - a.similarityScore)
    .slice(0, safeTopK);

  const summary = summarizeMatches(matches);

  return {
    symbol,
    market,
    interval,
    lookback: safeLookback,
    topK: safeTopK,
    method: "correlation",
    queryWindow,
    summary: {
      ...summary,
      upProbability6: roundStat(summary.upProbability6),
      upProbability12: roundStat(summary.upProbability12),
      upProbability24: roundStat(summary.upProbability24),
      avgFutureReturn6: roundStat(summary.avgFutureReturn6),
      avgFutureReturn12: roundStat(summary.avgFutureReturn12),
      avgFutureReturn24: roundStat(summary.avgFutureReturn24),
      avgMaxFutureUpside: roundStat(summary.avgMaxFutureUpside),
      avgMaxFutureDrawdown: roundStat(summary.avgMaxFutureDrawdown)
    },
    matches,
    updatedAt: new Date().toISOString()
  };
}
