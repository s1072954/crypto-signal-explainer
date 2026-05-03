import {
  AnalysisInput,
  Confidence,
  Direction,
  IndicatorItem,
  Interval,
  Kline,
  ModuleAnalysis,
  ModuleKey,
  OverallAnalysis,
  SUPPORTED_INTERVALS
} from "@/lib/types";
import {
  calculateCVD,
  calculateMACD,
  calculateOrderBookImbalance,
  calculateReturnOverDays,
  calculateRSI,
  calculateSpread,
  calculateVolumeBreakout,
  clampScore,
  latestMA,
  round
} from "@/lib/indicators";

const ALL_TIMEFRAMES: Interval[] = [...SUPPORTED_INTERVALS];

function latestClose(klines: Kline[]) {
  return klines.at(-1)?.close ?? 0;
}

function directionFromScore(score: number): Direction {
  if (score >= 0.5) {
    return "bullish";
  }

  if (score <= -0.5) {
    return "bearish";
  }

  return "neutral";
}

function confidenceFromScore(score: number): Confidence {
  const absScore = Math.abs(score);

  if (absScore >= 1.5) {
    return "high";
  }

  if (absScore >= 1) {
    return "medium_high";
  }

  if (absScore >= 0.5) {
    return "medium";
  }

  return "medium_low";
}

function moduleLabel(key: ModuleKey, direction: Direction) {
  const labels: Record<ModuleKey, Record<Direction, string>> = {
    trend: {
      bullish: "趨勢偏多",
      bearish: "趨勢偏空",
      neutral: "趨勢中性",
      warning: "趨勢分歧"
    },
    momentum: {
      bullish: "動能偏多",
      bearish: "動能偏空",
      neutral: "動能中性",
      warning: "動能過熱"
    },
    derivatives: {
      bullish: "衍生品偏多",
      bearish: "衍生品偏空",
      neutral: "衍生品中性",
      warning: "槓桿過熱"
    },
    liquidity: {
      bullish: "流動性支撐",
      bearish: "流動性偏弱",
      neutral: "流動性中性",
      warning: "流動性風險"
    }
  };

  return labels[key][direction];
}

function makeItem(
  item: Omit<IndicatorItem, "applicableTimeframes"> & {
    applicableTimeframes?: Interval[];
  }
): IndicatorItem {
  return {
    applicableTimeframes: item.applicableTimeframes ?? ALL_TIMEFRAMES,
    ...item
  };
}

function scoreReturn(value: number | null, bullishThreshold: number, bearishThreshold: number) {
  if (value === null) {
    return 0;
  }

  if (value >= bullishThreshold) {
    return 0.5;
  }

  if (value > 0) {
    return 0.25;
  }

  if (value <= bearishThreshold) {
    return -0.5;
  }

  if (value < 0) {
    return -0.25;
  }

  return 0;
}

function buildModule(
  key: ModuleKey,
  score: number,
  summary: string,
  items: IndicatorItem[],
  forcedDirection?: Direction
): ModuleAnalysis {
  const normalizedScore = round(clampScore(score), 2);
  const direction = forcedDirection ?? directionFromScore(normalizedScore);

  return {
    key,
    label: moduleLabel(key, direction),
    score: normalizedScore,
    direction,
    confidence: confidenceFromScore(normalizedScore),
    summary,
    items
  };
}

function marketSource(input: AnalysisInput, dataset: string) {
  const marketName =
    input.market === "futures" ? "Binance USD-M Futures" : "Binance Spot";

  return `${marketName} ${dataset}`;
}

export function analyzeTrend(input: AnalysisInput): ModuleAnalysis {
  const close = latestClose(input.klines);
  const ma20 = latestMA(input.klines, 20);
  const ma50 = latestMA(input.klines, 50);
  let score = 0;
  const items: IndicatorItem[] = [];

  if (ma20) {
    const bullish = close >= ma20;
    score += bullish ? 0.6 : -0.6;
    items.push(
      makeItem({
        key: "ma20",
        name: "MA20",
        value: round(ma20, 4),
        direction: bullish ? "bullish" : "bearish",
        confidence: "medium",
        meaning: "近 20 根 K 線的平均收盤價，用來觀察短期趨勢。",
        bullishInterpretation: "價格站上 MA20，短線買盤仍有支撐。",
        bearishInterpretation: "價格跌破 MA20，短線趨勢轉弱。",
        riskNote: "均線是落後指標，盤整時容易反覆翻多翻空。",
        source: marketSource(input, "Klines"),
        applicableTimeframes: ALL_TIMEFRAMES
      })
    );
  }

  if (ma50) {
    const bullish = close >= ma50;
    score += bullish ? 0.6 : -0.6;
    items.push(
      makeItem({
        key: "ma50",
        name: "MA50",
        value: round(ma50, 4),
        direction: bullish ? "bullish" : "bearish",
        confidence: "medium_high",
        meaning: "近 50 根 K 線的平均收盤價，用來觀察中期趨勢。",
        bullishInterpretation: "價格站上 MA50，中期趨勢較有延續性。",
        bearishInterpretation: "價格低於 MA50，中期反彈品質偏弱。",
        riskNote: "快速行情可能先走完一段後才反映到 MA50。",
        source: marketSource(input, "Klines"),
        applicableTimeframes: ALL_TIMEFRAMES
      })
    );
  }

  if (ma20 && ma50) {
    const bullish = ma20 >= ma50;
    score += bullish ? 0.8 : -0.8;
    items.push(
      makeItem({
        key: "ma_cross",
        name: "MA20 / MA50",
        value: bullish ? "MA20 高於 MA50" : "MA20 低於 MA50",
        direction: bullish ? "bullish" : "bearish",
        confidence: "medium_high",
        meaning: "短期均線與中期均線的相對位置，用來判斷趨勢排列。",
        bullishInterpretation: "短期均線在中期均線上方，趨勢結構偏多。",
        bearishInterpretation: "短期均線在中期均線下方，趨勢結構偏空。",
        riskNote: "均線交叉在震盪盤中容易出現假訊號。",
        source: marketSource(input, "Klines"),
        applicableTimeframes: ALL_TIMEFRAMES
      })
    );
  }

  const summary =
    score > 0
      ? "價格與均線結構偏多，趨勢仍有上行慣性。"
      : score < 0
        ? "價格與均線結構偏空，反彈需要先重新站回關鍵均線。"
        : "均線訊號不明顯，趨勢暫時缺乏方向。";

  return buildModule("trend", score, summary, items);
}

export function analyzeMomentum(input: AnalysisInput): ModuleAnalysis {
  const rsi = calculateRSI(input.klines);
  const macd = calculateMACD(input.klines);
  const return24h = input.ticker.priceChangePercent;
  const return7d = calculateReturnOverDays(input.klines, input.interval, 7);
  const return14d = calculateReturnOverDays(input.klines, input.interval, 14);
  const benchmark7d = input.benchmarkKlines
    ? calculateReturnOverDays(input.benchmarkKlines, input.interval, 7)
    : null;
  const volumeBreakout = calculateVolumeBreakout(input.klines);
  const items: IndicatorItem[] = [];
  let score = 0;

  score += scoreReturn(return24h, 2, -2);
  items.push(
    makeItem({
      key: "return_24h",
      name: "24H 漲跌幅",
      value: round(return24h, 2),
      unit: "%",
      direction:
        return24h > 0 ? "bullish" : return24h < 0 ? "bearish" : "neutral",
      confidence: "medium",
      meaning: "最近 24 小時價格變化，衡量短期動能方向。",
      bullishInterpretation: "24H 報酬為正，短期資金仍願意追價。",
      bearishInterpretation: "24H 報酬為負，短線賣壓占上風。",
      riskNote: "單日漲跌容易受消息與短線槓桿清算影響。",
      source: marketSource(input, "24hr Ticker")
    })
  );

  score += scoreReturn(return7d, 4, -4);
  items.push(
    makeItem({
      key: "return_7d",
      name: "7D 漲跌幅",
      value: return7d === null ? "資料不足" : round(return7d, 2),
      unit: return7d === null ? undefined : "%",
      direction:
        return7d === null
          ? "neutral"
          : return7d > 0
            ? "bullish"
            : return7d < 0
              ? "bearish"
              : "neutral",
      confidence: return7d === null ? "low" : "medium",
      meaning: "近 7 天價格表現，用來觀察中短期相對強弱。",
      bullishInterpretation: "7D 報酬為正，趨勢延續性較好。",
      bearishInterpretation: "7D 報酬為負，資金偏向撤出或觀望。",
      riskNote: "小週期資料不足時，7D 訊號可信度會下降。",
      source: marketSource(input, "Klines")
    })
  );

  score += scoreReturn(return14d, 6, -6) * 0.8;
  items.push(
    makeItem({
      key: "return_14d",
      name: "14D 漲跌幅",
      value: return14d === null ? "資料不足" : round(return14d, 2),
      unit: return14d === null ? undefined : "%",
      direction:
        return14d === null
          ? "neutral"
          : return14d > 0
            ? "bullish"
            : return14d < 0
              ? "bearish"
              : "neutral",
      confidence: return14d === null ? "low" : "medium_low",
      meaning: "近 14 天價格變化，用來辨識較完整的波段動能。",
      bullishInterpretation: "14D 報酬為正，波段仍偏強。",
      bearishInterpretation: "14D 報酬為負，波段結構偏弱。",
      riskNote: "15m 週期最多抓取 1000 根資料，可能不足 14 天。",
      source: marketSource(input, "Klines")
    })
  );

  if (benchmark7d !== null && return7d !== null) {
    const relative = return7d - benchmark7d;
    score += relative > 0 ? 0.25 : -0.25;
    items.push(
      makeItem({
        key: "return_7d_vs_btc",
        name: "7D vs BTC",
        value: round(relative, 2),
        unit: "%",
        direction: relative > 0 ? "bullish" : relative < 0 ? "bearish" : "neutral",
        confidence: "medium_low",
        meaning: "與 BTC 同週期 7D 報酬比較，衡量相對強弱。",
        bullishInterpretation: "表現優於 BTC，資金偏好較強。",
        bearishInterpretation: "表現落後 BTC，資金偏好較弱。",
        riskNote: "相對強弱不代表絕對方向，BTC 急跌時仍可能同步下跌。",
        source: marketSource(input, "Klines")
      })
    );
  }

  if (volumeBreakout !== null) {
    const direction: Direction =
      volumeBreakout >= 1.5 && return24h > 0
        ? "bullish"
        : volumeBreakout >= 1.5 && return24h < 0
          ? "bearish"
          : "neutral";
    score += direction === "bullish" ? 0.35 : direction === "bearish" ? -0.35 : 0;
    items.push(
      makeItem({
        key: "volume_breakout",
        name: "成交量突破",
        value: round(volumeBreakout, 2),
        unit: "x",
        direction,
        confidence: "medium",
        meaning: "最新成交量相對近 20 根平均量的倍數。",
        bullishInterpretation: "上漲伴隨放量，買盤確認度提高。",
        bearishInterpretation: "下跌伴隨放量，賣壓確認度提高。",
        riskNote: "放量不等於延續，清算與消息也會放大成交量。",
        source: marketSource(input, "Klines")
      })
    );
  }

  if (rsi !== null) {
    score += rsi > 70 ? 0.15 : rsi < 30 ? -0.15 : rsi > 55 ? 0.2 : rsi < 45 ? -0.2 : 0;
    items.push(
      makeItem({
        key: "rsi",
        name: "RSI 14",
        value: round(rsi, 2),
        direction:
          rsi > 72 || rsi < 28 ? "warning" : rsi > 55 ? "bullish" : rsi < 45 ? "bearish" : "neutral",
        confidence: "medium_low",
        meaning: "衡量近期漲跌速度，輔助辨識動能與過熱。",
        bullishInterpretation: "RSI 高於 55，買盤動能較強。",
        bearishInterpretation: "RSI 低於 45，賣壓動能較強。",
        riskNote: "RSI 過高或過低都可能進入鈍化，不宜單獨使用。",
        source: marketSource(input, "Klines")
      })
    );
  }

  if (macd) {
    score += macd.histogram > 0 ? 0.2 : -0.2;
    items.push(
      makeItem({
        key: "macd",
        name: "MACD Histogram",
        value: round(macd.histogram, 4),
        direction: macd.histogram > 0 ? "bullish" : "bearish",
        confidence: "medium_low",
        meaning: "MACD 柱狀體衡量短中期動能差。",
        bullishInterpretation: "柱狀體為正，動能偏向多方。",
        bearishInterpretation: "柱狀體為負，動能偏向空方。",
        riskNote: "MACD 也是落後指標，急速反轉時會延遲。",
        source: marketSource(input, "Klines")
      })
    );
  }

  const summary =
    score > 0
      ? "短中期報酬與量能偏向多方，動能仍有支撐。"
      : score < 0
        ? "短中期報酬與量能偏弱，動能尚未恢復。"
        : "動能訊號互相抵消，短線更接近中性。";

  return buildModule("momentum", score, summary, items);
}

export function analyzeDerivatives(input: AnalysisInput): ModuleAnalysis {
  const latestFunding = input.fundingRates.at(-1)?.fundingRate ?? null;
  const latestOi = input.openInterestHistory.at(-1);
  const previousOi = input.openInterestHistory.at(-2);
  const oiChange =
    latestOi && previousOi
      ? ((latestOi.sumOpenInterestValue - previousOi.sumOpenInterestValue) /
          previousOi.sumOpenInterestValue) *
        100
      : null;
  const return24h = input.ticker.priceChangePercent;
  let score = 0;
  const items: IndicatorItem[] = [];

  if (latestFunding !== null) {
    const direction: Direction =
      Math.abs(latestFunding) >= 0.001
        ? "warning"
        : latestFunding > 0
          ? "bullish"
          : latestFunding < 0
            ? "bearish"
            : "neutral";
    score += latestFunding > 0.0001 ? 0.3 : latestFunding < -0.0001 ? -0.3 : 0;
    items.push(
      makeItem({
        key: "funding_rate",
        name: "Funding Rate",
        value: round(latestFunding * 100, 4),
        unit: "%",
        direction,
        confidence: "medium",
        meaning: "永續合約多空資金費率，反映槓桿市場持倉成本。",
        bullishInterpretation: "正 funding 代表多方願意付費持倉，情緒偏多。",
        bearishInterpretation: "負 funding 代表空方願意付費持倉，情緒偏空。",
        riskNote: "過高 funding 可能代表多方擁擠，反而提高回撤風險。",
        source: "Binance USD-M Futures",
        applicableTimeframes: ["15m", "1h", "4h", "1d"]
      })
    );
  }

  if (oiChange !== null) {
    const direction: Direction =
      oiChange > 3 && return24h > 0
        ? "bullish"
        : oiChange > 3 && return24h < 0
          ? "bearish"
          : Math.abs(oiChange) >= 20
            ? "warning"
            : "neutral";
    score += direction === "bullish" ? 0.6 : direction === "bearish" ? -0.6 : 0;
    items.push(
      makeItem({
        key: "open_interest_change",
        name: "Open Interest 變化",
        value: round(oiChange, 2),
        unit: "%",
        direction,
        confidence: "medium",
        meaning: "未平倉量變化，衡量合約資金是否正在增加。",
        bullishInterpretation: "上漲且 OI 增加，代表新多資金進場的機率較高。",
        bearishInterpretation: "下跌且 OI 增加，代表新空資金進場的機率較高。",
        riskNote: "OI 快速增加會提高槓桿清算與波動風險。",
        source: "Binance Futures Data"
      })
    );
  }

  if (input.longShortRatio) {
    const ratio = input.longShortRatio.longShortRatio;
    const direction: Direction =
      ratio >= 1.7 || ratio <= 0.55
        ? "warning"
        : ratio > 1.05
          ? "bullish"
          : ratio < 0.95
            ? "bearish"
            : "neutral";
    score += ratio > 1.05 ? 0.25 : ratio < 0.95 ? -0.25 : 0;
    items.push(
      makeItem({
        key: "long_short_ratio",
        name: "Long / Short Ratio",
        value: round(ratio, 3),
        direction,
        confidence: "medium_low",
        meaning: "帳戶多空比例，觀察市場倉位傾向。",
        bullishInterpretation: "多方帳戶比例較高，市場傾向看多。",
        bearishInterpretation: "空方帳戶比例較高，市場傾向看空。",
        riskNote: "極端多空比通常代表擁擠交易，容易被反向清算。",
        source: "Binance Futures Data"
      })
    );
  }

  if (input.takerBuySellVolume) {
    const ratio =
      input.takerBuySellVolume.buySellRatio ??
      input.takerBuySellVolume.longShortRatio;
    const direction: Direction =
      ratio > 1.08 ? "bullish" : ratio < 0.92 ? "bearish" : "neutral";
    score += direction === "bullish" ? 0.35 : direction === "bearish" ? -0.35 : 0;
    items.push(
      makeItem({
        key: "taker_buy_sell_ratio",
        name: "Taker Buy / Sell",
        value: round(ratio, 3),
        direction,
        confidence: "medium",
        meaning: "主動買入與主動賣出成交量比例，觀察合約追價方向。",
        bullishInterpretation: "主動買入較強，短線追價偏多。",
        bearishInterpretation: "主動賣出較強，短線追價偏空。",
        riskNote: "短時間 taker 行為可能受清算單影響。",
        source: "Binance Futures Data"
      })
    );
  }

  const forcedDirection =
    latestFunding !== null && Math.abs(latestFunding) >= 0.001
      ? "warning"
      : undefined;
  const summary =
    score > 0
      ? "合約端資金與倉位偏向多方，但仍需留意 funding 與 OI 是否過熱。"
      : score < 0
        ? "合約端資金與倉位偏向空方，追價買盤不足。"
        : "合約端多空訊號不集中，槓桿市場暫時偏中性。";

  return buildModule("derivatives", score, summary, items, forcedDirection);
}

export function analyzeLiquidity(input: AnalysisInput): ModuleAnalysis {
  const spread = calculateSpread(input.orderBook);
  const imbalance = calculateOrderBookImbalance(input.orderBook);
  const cvd = calculateCVD(input.aggTrades);
  const items: IndicatorItem[] = [];
  let score = 0;

  const spreadDirection: Direction =
    spread.spreadPercent >= 0.1
      ? "warning"
      : spread.spreadPercent <= 0.03
        ? "bullish"
        : "neutral";
  score += spread.spreadPercent <= 0.03 ? 0.25 : spread.spreadPercent >= 0.1 ? -0.45 : 0;
  items.push(
    makeItem({
      key: "spread_percent",
      name: "Spread %",
      value: round(spread.spreadPercent, 4),
      unit: "%",
      direction: spreadDirection,
      confidence: "medium",
      meaning: "最佳買賣價差占中間價比例，衡量交易摩擦。",
      bullishInterpretation: "價差較低，進出場滑價壓力較小。",
      bearishInterpretation: "價差擴大，市場深度或報價品質轉弱。",
      riskNote: "流動性差時，小額成交也可能造成明顯滑價。",
      source: marketSource(input, "Depth")
    })
  );

  const depthDirection: Direction =
    imbalance.totalNotional >= 5_000_000
      ? "bullish"
      : imbalance.totalNotional < 500_000
        ? "warning"
        : "neutral";
  score +=
    imbalance.totalNotional >= 5_000_000
      ? 0.25
      : imbalance.totalNotional < 500_000
        ? -0.35
        : 0;
  items.push(
    makeItem({
      key: "order_book_depth",
      name: "Order Book Depth",
      value: round(imbalance.totalNotional, 0),
      unit: "USDT",
      direction: depthDirection,
      confidence: "medium_low",
      meaning: "前 20 檔買賣盤名目金額，衡量盤口承接能力。",
      bullishInterpretation: "深度充足，價格較不容易被小單推動。",
      bearishInterpretation: "深度不足，急漲急跌與滑價風險上升。",
      riskNote: "盤口深度會快速變動，也可能出現撤單。",
      source: marketSource(input, "Depth")
    })
  );

  const imbalanceDirection: Direction =
    imbalance.imbalance > 0.08
      ? "bullish"
      : imbalance.imbalance < -0.08
        ? "bearish"
        : "neutral";
  score +=
    imbalanceDirection === "bullish"
      ? 0.45
      : imbalanceDirection === "bearish"
        ? -0.45
        : 0;
  items.push(
    makeItem({
      key: "order_book_imbalance",
      name: "Order Book Imbalance",
      value: round(imbalance.imbalance * 100, 2),
      unit: "%",
      direction: imbalanceDirection,
      confidence: "medium_low",
      meaning: "前 20 檔買盤與賣盤深度差，觀察短線支撐或壓力。",
      bullishInterpretation: "買盤深度較厚，短線承接力較佳。",
      bearishInterpretation: "賣盤深度較厚，上方壓力較明顯。",
      riskNote: "掛單可以快速撤除，盤口訊號可信度低於成交訊號。",
      source: marketSource(input, "Depth")
    })
  );

  const cvdDirection: Direction =
    cvd.cvdRatio > 0.08 ? "bullish" : cvd.cvdRatio < -0.08 ? "bearish" : "neutral";
  score +=
    cvdDirection === "bullish"
      ? 0.45
      : cvdDirection === "bearish"
        ? -0.45
        : 0;
  items.push(
    makeItem({
      key: "cvd",
      name: "CVD",
      value: round(cvd.cvd, 4),
      direction: cvdDirection,
      confidence: "medium",
      meaning: "近期主動買量減主動賣量，觀察成交端方向。",
      bullishInterpretation: "CVD 為正，主動買盤較強。",
      bearishInterpretation: "CVD 為負，主動賣盤較強。",
      riskNote: "近期 trades 只代表短線成交流，不代表完整日內資金。",
      source: marketSource(input, "Agg Trades")
    })
  );

  const forcedDirection =
    spread.spreadPercent >= 0.1 || imbalance.totalNotional < 500_000
      ? "warning"
      : undefined;
  const summary =
    score > 0
      ? "盤口與成交流提供一定支撐，短線流動性條件尚可。"
      : score < 0
        ? "盤口或成交流偏弱，短線價格容易受賣壓與滑價影響。"
        : "盤口與成交流沒有明顯方向，流動性訊號中性。";

  return buildModule("liquidity", score, summary, items, forcedDirection);
}

export function calculateOverallScore(
  modules: ModuleAnalysis[],
  riskPenalty: number
) {
  const trend = modules.find((module) => module.key === "trend")?.score ?? 0;
  const momentum = modules.find((module) => module.key === "momentum")?.score ?? 0;
  const derivatives =
    modules.find((module) => module.key === "derivatives")?.score ?? 0;
  const liquidity = modules.find((module) => module.key === "liquidity")?.score ?? 0;

  return round(
    trend * 0.3 +
      momentum * 0.25 +
      derivatives * 0.25 +
      liquidity * 0.1 -
      riskPenalty * 0.1,
    2
  );
}

function overallLabel(score: number) {
  if (score >= 1.4) {
    return { status: "strong_bullish", label: "強勢偏多" };
  }

  if (score >= 0.5) {
    return { status: "bullish", label: "偏多" };
  }

  if (score <= -1.4) {
    return { status: "strong_bearish", label: "強勢偏空" };
  }

  if (score <= -0.5) {
    return { status: "bearish", label: "偏空" };
  }

  return { status: "neutral", label: "中性" };
}

function collectWarnings(input: AnalysisInput, modules: ModuleAnalysis[]) {
  const warnings: string[] = [];
  const latestFunding = input.fundingRates.at(-1)?.fundingRate ?? 0;
  const latestOi = input.openInterestHistory.at(-1);
  const previousOi = input.openInterestHistory.at(-2);
  const spread = calculateSpread(input.orderBook);
  const liquidity = modules.find((module) => module.key === "liquidity");
  const trend = modules.find((module) => module.key === "trend");

  if (Math.abs(latestFunding) >= 0.001) {
    warnings.push("Funding Rate 偏高，槓桿交易可能過度擁擠。");
  }

  if (latestOi && previousOi) {
    const oiChange =
      ((latestOi.sumOpenInterestValue - previousOi.sumOpenInterestValue) /
        previousOi.sumOpenInterestValue) *
      100;

    if (Math.abs(oiChange) >= 20) {
      warnings.push("Open Interest 快速變動，短線清算風險提高。");
    }
  }

  if (spread.spreadPercent >= 0.1) {
    warnings.push("買賣價差偏大，滑價與成交品質風險提高。");
  }

  if (
    trend?.direction === "bullish" &&
    (liquidity?.direction === "bearish" || liquidity?.direction === "warning")
  ) {
    warnings.push("趨勢偏多但流動性沒有同步支撐，訊號存在分歧。");
  }

  return warnings;
}

function calculateRiskPenalty(warnings: string[]) {
  return Math.min(2, warnings.length * 0.45);
}

export function generateSummary(
  symbol: string,
  interval: Interval,
  label: string,
  score: number,
  modules: ModuleAnalysis[],
  warnings: string[]
) {
  const bullishModules = modules
    .filter((module) => module.direction === "bullish")
    .map((module) => module.label);
  const bearishModules = modules
    .filter((module) => module.direction === "bearish")
    .map((module) => module.label);
  const warningText = warnings.length ? `主要風險是${warnings[0]}` : "目前未出現明顯極端風險。";

  return `${symbol} 在 ${interval} 週期的綜合判讀為${label}，分數 ${score}。偏多模組：${
    bullishModules.join("、") || "無"
  }；偏空模組：${bearishModules.join("、") || "無"}。${warningText}`;
}

export function buildOverallAnalysis(input: AnalysisInput): OverallAnalysis {
  const modules = [
    analyzeTrend(input),
    analyzeMomentum(input),
    analyzeDerivatives(input),
    analyzeLiquidity(input)
  ];
  const warnings = collectWarnings(input, modules);
  const riskPenalty = calculateRiskPenalty(warnings);
  const score = calculateOverallScore(modules, riskPenalty);
  let { status, label } = overallLabel(score);

  if (warnings.some((warning) => warning.includes("Funding")) && score >= 0.5) {
    status = "bullish_but_overheated";
    label = "偏多但過熱";
  }

  if (warnings.some((warning) => warning.includes("價差"))) {
    status = status === "neutral" ? "liquidity_risk" : status;
  }

  return {
    symbol: input.symbol,
    market: input.market,
    interval: input.interval,
    lastPrice: input.ticker.lastPrice || latestClose(input.klines),
    overallStatus: status,
    overallLabel: label,
    overallScore: score,
    summary: generateSummary(input.symbol, input.interval, label, score, modules, warnings),
    modules,
    warnings,
    updatedAt: new Date().toISOString()
  };
}
