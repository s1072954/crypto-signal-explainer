import { Kline } from "@/lib/types";

const MIN_PRICE_TO_REFERENCE_RATIO = 0.2;
const MAX_PRICE_TO_REFERENCE_RATIO = 5;

export function isPositiveFiniteNumber(value: number) {
  return Number.isFinite(value) && value > 0;
}

export function isValidKline(kline: Kline) {
  const validTimes =
    Number.isFinite(kline.openTime) &&
    Number.isFinite(kline.closeTime) &&
    kline.closeTime >= kline.openTime;
  const validPrices =
    isPositiveFiniteNumber(kline.open) &&
    isPositiveFiniteNumber(kline.high) &&
    isPositiveFiniteNumber(kline.low) &&
    isPositiveFiniteNumber(kline.close);
  const validRange =
    kline.high >= Math.max(kline.open, kline.low, kline.close) &&
    kline.low <= Math.min(kline.open, kline.high, kline.close);
  const validVolume = Number.isFinite(kline.volume) && kline.volume >= 0;

  return validTimes && validPrices && validRange && validVolume;
}

export function isPlausiblePriceAgainstReference(
  price: number,
  referencePrice: number
) {
  if (!isPositiveFiniteNumber(price)) {
    return false;
  }

  if (!isPositiveFiniteNumber(referencePrice)) {
    return true;
  }

  const ratio = price / referencePrice;
  return (
    ratio >= MIN_PRICE_TO_REFERENCE_RATIO &&
    ratio <= MAX_PRICE_TO_REFERENCE_RATIO
  );
}

export function normalizeKlines(klines: Kline[]) {
  const byOpenTime = new Map<number, Kline>();

  for (const kline of klines) {
    if (isValidKline(kline)) {
      byOpenTime.set(kline.openTime, kline);
    }
  }

  return [...byOpenTime.values()].sort((a, b) => a.openTime - b.openTime);
}
