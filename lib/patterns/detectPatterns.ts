import { calculateRSI, calculateVolumeBreakout, round, safeDivide } from "@/lib/indicators";
import { DetectedPattern } from "@/lib/patterns/patternTypes";
import { Kline } from "@/lib/types";

function recentRange(klines: Kline[], lookback = 20) {
  const window = klines.slice(-lookback);
  const high = Math.max(...window.map((kline) => kline.high));
  const low = Math.min(...window.map((kline) => kline.low));
  const latest = klines.at(-1);

  return {
    high,
    low,
    latest,
    rangePercent: latest ? safeDivide(high - low, latest.close) * 100 : 0
  };
}

function confidenceFromScore(score: number): DetectedPattern["confidence"] {
  if (score >= 85) {
    return "high";
  }

  if (score >= 72) {
    return "medium_high";
  }

  if (score >= 58) {
    return "medium";
  }

  if (score >= 45) {
    return "medium_low";
  }

  return "low";
}

function makePattern(pattern: Omit<DetectedPattern, "confidence">): DetectedPattern {
  return {
    ...pattern,
    confidence: confidenceFromScore(pattern.score)
  };
}

export function detectPatterns(klines: Kline[]): DetectedPattern[] {
  if (klines.length < 30) {
    return [
      makePattern({
        key: "insufficient_data",
        name: "資料不足",
        direction: "warning",
        score: 35,
        meaning: "目前 K 線數量不足，型態判讀可信度偏低。",
        bullishCondition: "補足更多歷史 K 線後再確認。",
        bearishCondition: "資料不足時不應過度解讀單一型態。",
        riskNote: "型態偵測至少需要 30 根 K 線才有基本參考價值。",
        evidence: [`目前只有 ${klines.length} 根 K 線`]
      })
    ];
  }

  const patterns: DetectedPattern[] = [];
  const { high, low, latest, rangePercent } = recentRange(klines, 24);
  const previous = klines.at(-2);
  const volumeBreakout = calculateVolumeBreakout(klines, 20) ?? 0;
  const rsi = calculateRSI(klines) ?? 50;

  if (!latest || !previous) {
    return patterns;
  }

  const positionInRange = safeDivide(latest.close - low, high - low);
  const candleBodyPercent = safeDivide(Math.abs(latest.close - latest.open), latest.close) * 100;
  const candleRangePercent = safeDivide(latest.high - latest.low, latest.close) * 100;
  const upperWickPercent = safeDivide(latest.high - Math.max(latest.close, latest.open), latest.close) * 100;
  const lowerWickPercent = safeDivide(Math.min(latest.close, latest.open) - latest.low, latest.close) * 100;
  const prevRange = recentRange(klines.slice(0, -1), 24);
  const breakout = latest.close > prevRange.high;
  const breakdown = latest.close < prevRange.low;

  if (rangePercent <= 4.5 && positionInRange >= 0.72) {
    patterns.push(
      makePattern({
        key: "range_near_resistance",
        name: "區間上緣壓力",
        direction: "neutral",
        score: 58 + Math.min(22, positionInRange * 18),
        meaning: "價格位於近期震盪區間上緣，突破或回落都需要成交量確認。",
        bullishCondition: "放量收上區間高點，代表買盤成功吸收上方賣壓。",
        bearishCondition: "無量靠近上緣後轉弱，容易形成區間回落。",
        riskNote: "區間上緣不等於必然反轉，強勢行情可能直接突破。",
        evidence: [
          `近 24 根區間幅度 ${round(rangePercent, 2)}%`,
          `收盤位於區間 ${round(positionInRange * 100, 1)}% 位置`
        ]
      })
    );
  }

  if (rangePercent <= 4.5 && positionInRange <= 0.28) {
    patterns.push(
      makePattern({
        key: "range_near_support",
        name: "區間下緣支撐",
        direction: "neutral",
        score: 58 + Math.min(22, (1 - positionInRange) * 18),
        meaning: "價格位於近期震盪區間下緣，支撐是否有效取決於承接與成交流。",
        bullishCondition: "下緣附近出現長下影與放量反彈，代表承接增強。",
        bearishCondition: "跌破區間低點並放量，代表支撐失守。",
        riskNote: "跌破支撐後容易觸發停損與槓桿清算。",
        evidence: [
          `近 24 根區間幅度 ${round(rangePercent, 2)}%`,
          `收盤位於區間 ${round(positionInRange * 100, 1)}% 位置`
        ]
      })
    );
  }

  if (breakout) {
    patterns.push(
      makePattern({
        key: "breakout",
        name: "向上突破",
        direction: "bullish",
        score: volumeBreakout >= 1.4 ? 82 : 68,
        meaning: "價格收上近期高點，趨勢有向上延伸的機會。",
        bullishCondition: "突破伴隨量能放大，型態確認度較高。",
        bearishCondition: "突破後快速跌回區間，容易形成假突破。",
        riskNote: "突破追價需留意回踩與滑價風險。",
        evidence: [
          `收盤 ${latest.close} 高於前區間高點 ${round(prevRange.high, 4)}`,
          `成交量為均量 ${round(volumeBreakout, 2)} 倍`
        ]
      })
    );
  }

  if (breakdown) {
    patterns.push(
      makePattern({
        key: "breakdown",
        name: "向下跌破",
        direction: "bearish",
        score: volumeBreakout >= 1.4 ? 82 : 68,
        meaning: "價格跌破近期低點，賣壓有延續的可能。",
        bullishCondition: "跌破後快速收回區間，代表下方承接仍在。",
        bearishCondition: "跌破伴隨放量，空方確認度較高。",
        riskNote: "跌破時可能出現快速清算，波動會明顯放大。",
        evidence: [
          `收盤 ${latest.close} 低於前區間低點 ${round(prevRange.low, 4)}`,
          `成交量為均量 ${round(volumeBreakout, 2)} 倍`
        ]
      })
    );
  }

  if (rangePercent <= 3 && volumeBreakout < 1) {
    patterns.push(
      makePattern({
        key: "volatility_compression",
        name: "波動收斂",
        direction: "neutral",
        score: 64,
        meaning: "近期波動幅度下降，市場可能正在累積下一段方向。",
        bullishCondition: "收斂後向上突破且成交量放大。",
        bearishCondition: "收斂後跌破區間且成交量放大。",
        riskNote: "收斂本身不提供方向，突破前容易來回洗價。",
        evidence: [
          `近 24 根區間幅度 ${round(rangePercent, 2)}%`,
          `成交量為均量 ${round(volumeBreakout, 2)} 倍`
        ]
      })
    );
  }

  if (candleRangePercent >= rangePercent * 0.45 && volumeBreakout >= 1.5) {
    patterns.push(
      makePattern({
        key: "range_expansion",
        name: "波動擴張",
        direction: latest.close >= latest.open ? "bullish" : "bearish",
        score: 74,
        meaning: "最新 K 線波動與成交量同步放大，短線方向開始被重新定價。",
        bullishCondition: "實體收高且 CVD 或後續 K 線延續偏多。",
        bearishCondition: "實體收低且後續反彈無量。",
        riskNote: "波動擴張常伴隨追價與清算，進場風險高於一般盤整。",
        evidence: [
          `最新 K 線振幅 ${round(candleRangePercent, 2)}%`,
          `成交量為均量 ${round(volumeBreakout, 2)} 倍`
        ]
      })
    );
  }

  if (upperWickPercent >= candleBodyPercent * 1.4 && upperWickPercent >= 0.4) {
    patterns.push(
      makePattern({
        key: "upper_wick_rejection",
        name: "上影線賣壓",
        direction: "bearish",
        score: 62,
        meaning: "價格上攻後被賣壓壓回，短線追高意願不足。",
        bullishCondition: "下一根 K 線重新收過上影高點。",
        bearishCondition: "下一根 K 線跌破上影 K 線低點。",
        riskNote: "單根上影線需要後續 K 線確認，不宜單獨判斷反轉。",
        evidence: [`上影線約 ${round(upperWickPercent, 2)}%`]
      })
    );
  }

  if (lowerWickPercent >= candleBodyPercent * 1.4 && lowerWickPercent >= 0.4) {
    patterns.push(
      makePattern({
        key: "lower_wick_absorption",
        name: "下影線承接",
        direction: "bullish",
        score: 62,
        meaning: "價格下探後被買盤拉回，短線下方有承接。",
        bullishCondition: "下一根 K 線站回下影 K 線高點。",
        bearishCondition: "下一根 K 線跌破下影低點。",
        riskNote: "下影線承接若缺乏成交量，可能只是短線回補。",
        evidence: [`下影線約 ${round(lowerWickPercent, 2)}%`]
      })
    );
  }

  if (rsi >= 72) {
    patterns.push(
      makePattern({
        key: "overheated_rsi",
        name: "短線過熱",
        direction: "warning",
        score: 70,
        meaning: "RSI 偏高，價格可能進入強勢鈍化或短線回調區。",
        bullishCondition: "高 RSI 伴隨趨勢突破與量能延續。",
        bearishCondition: "高 RSI 後量能衰退並跌破短期均線。",
        riskNote: "過熱不是放空訊號，只代表追價風險提高。",
        evidence: [`RSI 目前 ${round(rsi, 2)}`]
      })
    );
  }

  if (rsi <= 28) {
    patterns.push(
      makePattern({
        key: "oversold_rsi",
        name: "短線超跌",
        direction: "warning",
        score: 70,
        meaning: "RSI 偏低，價格可能進入恐慌賣壓或反彈醞釀區。",
        bullishCondition: "低 RSI 後出現放量長下影或重新站回均線。",
        bearishCondition: "低 RSI 持續鈍化且價格沿均線下跌。",
        riskNote: "超跌不代表立即反彈，趨勢空方時會持續鈍化。",
        evidence: [`RSI 目前 ${round(rsi, 2)}`]
      })
    );
  }

  if (!patterns.length) {
    patterns.push(
      makePattern({
        key: "no_clear_pattern",
        name: "型態不明顯",
        direction: "neutral",
        score: 50,
        meaning: "近期 K 線沒有明確突破、跌破或極端波動型態。",
        bullishCondition: "等待放量突破近期高點。",
        bearishCondition: "等待放量跌破近期低點。",
        riskNote: "型態不明時，模組分數與風險提示比單一 K 線更有參考價值。",
        evidence: [
          `近 24 根區間幅度 ${round(rangePercent, 2)}%`,
          `成交量為均量 ${round(volumeBreakout, 2)} 倍`
        ]
      })
    );
  }

  return patterns.sort((a, b) => b.score - a.score).slice(0, 6);
}
