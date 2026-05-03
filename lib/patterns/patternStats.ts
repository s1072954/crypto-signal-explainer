import { Confidence } from "@/lib/types";
import { PatternMatch, PatternMatchSummary } from "@/lib/patterns/patternTypes";

function average(values: Array<number | null>) {
  const valid = values.filter((value): value is number => value !== null && Number.isFinite(value));

  if (!valid.length) {
    return null;
  }

  return valid.reduce((sum, value) => sum + value, 0) / valid.length;
}

function probabilityPositive(values: Array<number | null>) {
  const valid = values.filter((value): value is number => value !== null && Number.isFinite(value));

  if (!valid.length) {
    return null;
  }

  return (valid.filter((value) => value > 0).length / valid.length) * 100;
}

function confidenceFor(sampleSize: number, avgSimilarity: number): Confidence {
  if (sampleSize >= 15 && avgSimilarity >= 0.82) {
    return "high";
  }

  if (sampleSize >= 10 && avgSimilarity >= 0.72) {
    return "medium_high";
  }

  if (sampleSize >= 6 && avgSimilarity >= 0.62) {
    return "medium";
  }

  if (sampleSize >= 3) {
    return "medium_low";
  }

  return "low";
}

function labelFrom(avgReturn12: number | null, upProbability12: number | null) {
  if (avgReturn12 === null || upProbability12 === null) {
    return "歷史樣本不足";
  }

  if (avgReturn12 >= 1.5 && upProbability12 >= 60) {
    return "歷史樣本偏多";
  }

  if (avgReturn12 <= -1.5 && upProbability12 <= 40) {
    return "歷史樣本偏空";
  }

  return "歷史樣本中性";
}

export function summarizeMatches(matches: PatternMatch[]): PatternMatchSummary {
  const avgFutureReturn6 = average(matches.map((match) => match.futureReturn6));
  const avgFutureReturn12 = average(matches.map((match) => match.futureReturn12));
  const avgFutureReturn24 = average(matches.map((match) => match.futureReturn24));
  const upProbability6 = probabilityPositive(matches.map((match) => match.futureReturn6));
  const upProbability12 = probabilityPositive(matches.map((match) => match.futureReturn12));
  const upProbability24 = probabilityPositive(matches.map((match) => match.futureReturn24));
  const avgMaxFutureUpside = average(matches.map((match) => match.maxFutureUpside));
  const avgMaxFutureDrawdown = average(matches.map((match) => match.maxFutureDrawdown));
  const avgSimilarity = average(matches.map((match) => match.similarityScore)) ?? 0;

  return {
    sampleSize: matches.length,
    upProbability6,
    upProbability12,
    upProbability24,
    avgFutureReturn6,
    avgFutureReturn12,
    avgFutureReturn24,
    avgMaxFutureUpside,
    avgMaxFutureDrawdown,
    confidence: confidenceFor(matches.length, avgSimilarity),
    label: labelFrom(avgFutureReturn12, upProbability12)
  };
}

export function roundStat(value: number | null, digits = 2) {
  if (value === null || !Number.isFinite(value)) {
    return null;
  }

  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}
