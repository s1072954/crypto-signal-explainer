export function normalizeSeries(values: number[]) {
  const first = values[0];

  if (!Number.isFinite(first) || first === 0) {
    return values.map(() => 0);
  }

  return values.map((value) => value / first - 1);
}

export function zScoreSeries(values: number[]) {
  if (!values.length) {
    return [];
  }

  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const variance =
    values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length;
  const std = Math.sqrt(variance);

  if (!Number.isFinite(std) || std === 0) {
    return values.map(() => 0);
  }

  return values.map((value) => (value - mean) / std);
}
