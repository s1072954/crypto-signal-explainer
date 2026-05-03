import { Confidence, Direction, Interval, Kline, MarketType } from "@/lib/types";

export interface DetectedPattern {
  key: string;
  name: string;
  direction: Direction;
  confidence: Confidence;
  score: number;
  meaning: string;
  bullishCondition: string;
  bearishCondition: string;
  riskNote: string;
  evidence: string[];
}

export interface PatternDetectionResponse {
  symbol: string;
  market: MarketType;
  interval: Interval;
  patterns: DetectedPattern[];
  updatedAt: string;
}

export interface PatternMatch {
  matchedSymbol: string;
  matchedInterval: Interval;
  startTime: number;
  endTime: number;
  similarityScore: number;
  correlation: number;
  distance: number;
  futureReturn6: number | null;
  futureReturn12: number | null;
  futureReturn24: number | null;
  maxFutureUpside: number | null;
  maxFutureDrawdown: number | null;
  window: Kline[];
}

export interface PatternMatchSummary {
  sampleSize: number;
  upProbability6: number | null;
  upProbability12: number | null;
  upProbability24: number | null;
  avgFutureReturn6: number | null;
  avgFutureReturn12: number | null;
  avgFutureReturn24: number | null;
  avgMaxFutureUpside: number | null;
  avgMaxFutureDrawdown: number | null;
  confidence: Confidence;
  label: string;
}

export interface PatternMatchResponse {
  symbol: string;
  market: MarketType;
  interval: Interval;
  lookback: number;
  topK: number;
  method: "correlation";
  queryWindow: Kline[];
  summary: PatternMatchSummary;
  matches: PatternMatch[];
  updatedAt: string;
}
