import { normalizeSeries, zScoreSeries } from "@/lib/patterns/normalizeSeries";

export function pearsonCorrelation(a: number[], b: number[]) {
  const length = Math.min(a.length, b.length);

  if (length < 3) {
    return 0;
  }

  const x = zScoreSeries(a.slice(0, length));
  const y = zScoreSeries(b.slice(0, length));
  const value = x.reduce((sum, item, index) => sum + item * y[index], 0) / length;

  return Number.isFinite(value) ? Math.max(-1, Math.min(1, value)) : 0;
}

export function euclideanDistance(a: number[], b: number[]) {
  const length = Math.min(a.length, b.length);

  if (length === 0) {
    return Number.POSITIVE_INFINITY;
  }

  const total = a
    .slice(0, length)
    .reduce((sum, item, index) => sum + (item - b[index]) ** 2, 0);

  return Math.sqrt(total / length);
}

export function calculateSimilarityScore(queryCloses: number[], candidateCloses: number[]) {
  const query = normalizeSeries(queryCloses);
  const candidate = normalizeSeries(candidateCloses);
  const correlation = pearsonCorrelation(query, candidate);
  const distance = euclideanDistance(query, candidate);
  const distanceScore = 1 / (1 + distance * 12);
  const correlationScore = (correlation + 1) / 2;
  const similarityScore = Math.max(0, Math.min(1, correlationScore * 0.75 + distanceScore * 0.25));

  return {
    similarityScore,
    correlation,
    distance
  };
}
