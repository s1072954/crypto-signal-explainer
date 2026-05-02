可以，下面我幫你整理成一份**可直接拿去給 AI Coding Agent / Cursor / Claude Code / Codex 使用的產品計畫書**。我會用「MVP → 完整產品」方式拆開，並把功能、資料來源、API、頁面結構、資料表、開發任務都寫清楚。

---

# 加密貨幣多空指標解讀器產品計畫書

## 1. 專案名稱

**Crypto Signal Explainer**
中文名稱可用：**加密貨幣多空指標解讀器**

---

## 2. 專案目標

本專案目標是建立一個加密貨幣交易輔助頁面，使用者可以查詢或切換幣種，例如 BTCUSDT、ETHUSDT、SOLUSDT，系統自動抓取 Binance API 資料，計算多種交易指標，並在頁面右側顯示每個指標的：

1. 當前數值
2. 指標意義
3. 偏多 / 偏空 / 中性判讀
4. 可信度
5. 適用週期
6. 風險提醒
7. 資料來源

產品定位不是喊單工具，而是：

> **把複雜的加密貨幣市場資料轉換成可理解、可比較、可回測的交易判讀系統。**

---

## 3. 為什麼這個產品合理

市場上已經有類似方向的產品，但多數偏向「資料展示」或「專業圖表」，不一定提供白話判讀。

TradingView 已經加入 crypto derivatives indicators，例如 funding rate，並說明 funding rate 是讓永續合約價格與現貨價格保持接近的週期性資金流，代表「技術圖表 + 衍生品資料」已經是市場需求。([TradingView][1])

CoinGlass 提供 derivatives、options、spot market data，並有 open interest、funding rate、liquidation 等資料頁面，代表衍生品資料已經是加密貨幣交易者會看的核心資訊。([coinglass][2])

Binance 官方 Futures trading data 也提供 open interest、top trader long/short ratio、long/short ratio、taker buy/sell volume 等資料，代表這些資料本身已經被交易所視為重要市場資訊。([Binance][3])

本產品的差異化不是「資料最多」，而是：

> **指標數值 → 多空意義 → 可信度 → 適用週期 → 風險提醒 → 綜合判讀。**

---

# 4. 產品核心概念

## 4.1 使用者流程

```text
進入頁面
↓
選擇幣種，例如 BTCUSDT
↓
選擇週期，例如 15m / 1h / 4h / 1d
↓
系統抓取 Binance 現貨與合約資料
↓
系統計算技術、動能、衍生品、流動性指標
↓
頁面顯示 K 線圖與右側指標卡
↓
系統產生綜合判讀：偏多 / 偏空 / 中性 / 訊號矛盾 / 過熱 / 不建議交易
```

---

## 4.2 頁面概念

```text
┌──────────────────────────────────────────────┐
│ Header：Crypto Signal Explainer              │
├──────────────────────────────────────────────┤
│ 幣種搜尋：BTCUSDT      週期：4H              │
├──────────────────────────────┬───────────────┤
│                              │ 綜合判讀       │
│ K 線圖                       │ 趨勢：偏多     │
│ 成交量                       │ 動能：偏多     │
│ MA20 / MA50                  │ 槓桿：過熱     │
│ Funding / OI                 │ 流動性：正常   │
│                              │               │
├──────────────────────────────┴───────────────┤
│ 指標說明表                                   │
│ - 數值                                       │
│ - 意義                                       │
│ - 多空判讀                                   │
│ - 可信度                                     │
│ - 適用週期                                   │
└──────────────────────────────────────────────┘
```

---

# 5. MVP 版本規劃

## 5.1 MVP 目標

MVP 只使用 Binance API，不接外部付費資料源。

MVP 要完成：

1. 幣種查詢 / 切換
2. 週期切換
3. K 線圖
4. 技術指標計算
5. 衍生品資料顯示
6. 流動性資料顯示
7. 指標白話說明
8. 偏多 / 偏空 / 中性判讀
9. 綜合摘要

---

## 5.2 MVP 資料來源

Binance Spot API 可取得 K 線、order book、24hr ticker、recent trades、aggregate trades 等市場資料。([Binance][4])

Binance USDⓈ-M Futures API 可取得 futures K 線、funding rate、open interest、long/short ratio、taker buy/sell volume 等資料；Binance 官方文件也列出 Long/Short Ratio endpoint。([幣安開發者中心][5])

MVP 使用資料：

| 資料                    | Binance API 可行性 | 用途                     |
| --------------------- | --------------: | ---------------------- |
| 現貨 K 線                |              可行 | 計算 MA、RSI、MACD、動能      |
| 合約 K 線                |              可行 | 期貨價格趨勢                 |
| 24H ticker            |              可行 | 漲跌幅、成交量                |
| Order Book            |              可行 | spread、depth、imbalance |
| Recent / Agg Trades   |              可行 | CVD、主動買賣方向             |
| Funding Rate          |              可行 | 槓桿過熱判斷                 |
| Open Interest         |              可行 | 倉位變化                   |
| Long/Short Ratio      |              可行 | 市場多空擁擠度                |
| Taker Buy/Sell Volume |              可行 | 主動買賣力道                 |

---

# 6. MVP 功能詳細規格

## 6.1 幣種搜尋 / 切換

### 功能說明

使用者可以輸入幣種，例如：

```text
BTCUSDT
ETHUSDT
SOLUSDT
BNBUSDT
DOGEUSDT
```

系統顯示該幣種的即時與歷史指標。

### MVP 需求

| 項目   | 規格                   |
| ---- | -------------------- |
| 搜尋方式 | 下拉選單 + 搜尋輸入          |
| 預設幣種 | BTCUSDT              |
| 支援市場 | USDT pairs           |
| 幣種來源 | Binance exchangeInfo |
| 錯誤處理 | 查無幣種時顯示提示            |

---

## 6.2 週期切換

### 支援週期

```text
15m
1h
4h
1d
```

### 用途

不同週期會影響：

1. K 線資料
2. MA 計算
3. RSI / MACD
4. 動能判讀
5. 指標可信度

例如：

| 指標                   | 15m |  1h | 4h | 1d |
| -------------------- | --: | --: | -: | -: |
| Order Book Imbalance |   中 |  中低 |  低 |  低 |
| Funding Rate         |   中 |   中 | 中高 |  中 |
| MA20 / MA50          |   中 |   中 |  高 |  高 |
| MVRV                 | 不適用 | 不適用 |  低 | 中高 |

MVP 先不做 MVRV，這是完整產品再加入。

---

## 6.3 K 線圖

### MVP 需求

| 功能   | 說明                 |
| ---- | ------------------ |
| K 線圖 | 顯示 OHLC            |
| 成交量  | 顯示 volume bar      |
| MA20 | 顯示均線               |
| MA50 | 顯示均線               |
| 最新價格 | 顯示於圖表上方            |
| 週期切換 | 15m / 1h / 4h / 1d |

### 建議套件

前端可使用：

```text
TradingView Lightweight Charts
```

或：

```text
Recharts
```

如果要簡單 MVP，建議用 **TradingView Lightweight Charts**。

---

## 6.4 指標卡片

右側顯示 5 大模組：

```text
綜合判讀
趨勢指標
動能指標
槓桿 / 衍生品指標
流動性 / Order Flow 指標
```

---

# 7. MVP 指標清單

## 7.1 綜合判讀

### 顯示格式

```text
BTCUSDT｜4H

綜合狀態：偏多，但槓桿過熱

摘要：
價格站上 MA20 / MA50，7D 動能強於 BTC，大方向偏多。
但 Funding Rate 高於近期平均，Open Interest 快速上升，
代表多方倉位可能偏擁擠，追多風險提高。
```

### 狀態分類

| 狀態    | 意義                       |
| ----- | ------------------------ |
| 強勢偏多  | 趨勢、動能、成交量、衍生品皆支持上漲       |
| 偏多    | 多數指標支持上漲                 |
| 中性    | 指標不明確                    |
| 訊號矛盾  | 趨勢與衍生品 / order flow 互相衝突 |
| 偏空    | 多數指標支持下跌                 |
| 強勢偏空  | 趨勢、動能、成交量、衍生品皆支持下跌       |
| 過熱    | 價格上漲但 funding / OI 過高    |
| 不建議交易 | 流動性差、spread 大、訊號混亂       |

---

## 7.2 趨勢指標

| 指標             | 計算方式                | 偏多條件        | 偏空條件        | 可信度 |
| -------------- | ------------------- | ----------- | ----------- | --- |
| MA20           | 最近 20 根 K 線收盤均價     | 價格 > MA20   | 價格 < MA20   | 中   |
| MA50           | 最近 50 根 K 線收盤均價     | 價格 > MA50   | 價格 < MA50   | 中高  |
| MA20 / MA50 結構 | MA20 與 MA50 相對位置    | MA20 > MA50 | MA20 < MA50 | 中高  |
| 高低點結構          | 最近 swing high / low | 高點與低點墊高     | 高點與低點下移     | 高   |

### 指標說明範例

```text
MA20 / MA50：
用來判斷中短期趨勢方向。價格站上 MA20 與 MA50 時，代表市場偏強；若價格跌破兩條均線，代表趨勢轉弱。
```

---

## 7.3 動能指標

| 指標              | 計算方式         | 偏多條件         | 偏空條件         | 可信度 |
| --------------- | ------------ | ------------ | ------------ | --- |
| 24H return      | 24 小時漲跌幅     | 大於 0 且強於 BTC | 小於 0 且弱於 BTC | 中   |
| 7D return       | 7 日報酬率       | 強於 BTC / ETH | 弱於 BTC / ETH | 高   |
| 14D return      | 14 日報酬率      | 持續強勢         | 持續弱勢         | 高   |
| Volume breakout | 當前成交量 vs 平均量 | 放量上漲         | 放量下跌         | 中高  |

### 指標說明範例

```text
7D 動能：
用來觀察該幣種最近一週是否強於市場。若 7D 報酬率明顯高於 BTC，代表該幣種短中期資金動能較強。
```

---

## 7.4 槓桿 / 衍生品指標

Funding rate 是永續合約中用來讓合約價格接近現貨價格的週期性資金流，正 funding 通常代表多方支付空方，負 funding 則代表空方支付多方。([Binance][6])

| 指標                   | 偏多解讀                | 偏空 / 風險解讀    | 可信度 |
| -------------------- | ------------------- | ------------ | --- |
| Funding Rate         | 溫和正值，代表多方健康         | 極高正值，代表多頭擁擠  | 中   |
| Open Interest        | 價格上漲 + OI 上升，趨勢可能延續 | OI 暴增，清算風險提高 | 中高  |
| Long/Short Ratio     | 適度偏多支持趨勢            | 極端偏多可視為反向風險  | 中   |
| Taker Buy/Sell Ratio | 主動買盤強               | 主動賣盤強        | 中   |

### 組合判讀規則

| 價格 | OI | Funding | 判讀           |
| -- | -- | ------- | ------------ |
| 上漲 | 上升 | 溫和      | 健康多頭         |
| 上漲 | 暴增 | 極高      | 多頭過熱         |
| 下跌 | 上升 | 負值      | 空頭加倉         |
| 下跌 | 下降 | 任意      | 去槓桿，可能接近短線止跌 |
| 盤整 | 上升 | 任意      | 變盤風險增加       |

---

## 7.5 流動性 / Order Flow 指標

| 指標                   | 計算方式                    | 偏多條件          | 偏空條件           | 可信度 |
| -------------------- | ----------------------- | ------------- | -------------- | --- |
| Spread               | ask - bid               | spread 小，適合交易 | spread 大，不建議交易 | 高   |
| Spread %             | spread / mid price      | 成本低           | 成本高            | 高   |
| Order Book Depth     | 買賣盤深度                   | 深度足夠          | 深度不足           | 中高  |
| Order Book Imbalance | bid depth / total depth | 買盤深度較強        | 賣盤深度較強         | 中低  |
| CVD                  | 主動買量 - 主動賣量累積           | CVD 上升        | CVD 下降         | 中   |

### 指標說明範例

```text
Order Book Imbalance：
觀察委託簿中買盤與賣盤的相對深度。若買盤深度明顯高於賣盤，短線可能偏多；但委託簿容易受到假掛單影響，因此可信度不可過高。
```

---

# 8. MVP 綜合評分邏輯

## 8.1 模組分數

每個模組產生 -2 到 +2 分。

| 分數 | 意義   |
| -: | ---- |
| +2 | 強烈偏多 |
| +1 | 偏多   |
|  0 | 中性   |
| -1 | 偏空   |
| -2 | 強烈偏空 |

---

## 8.2 模組權重

| 模組   |  權重 |
| ---- | --: |
| 趨勢   | 30% |
| 動能   | 25% |
| 衍生品  | 25% |
| 流動性  | 10% |
| 風險懲罰 | 10% |

---

## 8.3 綜合分數

```text
total_score =
trend_score * 0.30 +
momentum_score * 0.25 +
derivatives_score * 0.25 +
liquidity_score * 0.10 -
risk_penalty * 0.10
```

---

## 8.4 綜合狀態規則

|  total_score | 狀態   |
| -----------: | ---- |
|       >= 1.4 | 強勢偏多 |
|   0.5 ~ 1.39 | 偏多   |
| -0.49 ~ 0.49 | 中性   |
| -1.39 ~ -0.5 | 偏空   |
|      <= -1.4 | 強勢偏空 |

特殊覆蓋規則：

| 條件                 | 狀態        |
| ------------------ | --------- |
| Funding 極高 + OI 暴增 | 過熱        |
| Spread 過大          | 不建議交易     |
| 趨勢偏多但 CVD 偏空       | 訊號矛盾      |
| 趨勢偏空但 funding 極負   | 空頭擁擠，避免追空 |

---

# 9. MVP 技術架構

## 9.1 建議技術棧

### 前端

```text
Next.js
React
TypeScript
Tailwind CSS
TradingView Lightweight Charts
```

### 後端

```text
Next.js API Routes
或
FastAPI + Python
```

如果你是要讓 AI Coding 快速做，建議第一版用：

```text
Next.js Full-stack
```

原因是前後端可以放在同一個專案，開發速度最快。

### 資料庫

MVP 可以先不使用資料庫，直接即時查 Binance API。

但建議加上快取：

```text
Redis
```

如果暫時不想架 Redis，可以先用 server memory cache。

---

## 9.2 MVP 架構圖

```text
Browser
  ↓
Next.js Frontend
  ↓
Next.js API Routes
  ↓
Binance Spot API
Binance Futures API
  ↓
Indicator Calculation Service
  ↓
Signal Interpretation Engine
  ↓
Frontend Cards / Chart
```

---

# 10. MVP API 設計

## 10.1 取得幣種列表

```http
GET /api/symbols
```

### 回傳

```json
{
  "symbols": [
    "BTCUSDT",
    "ETHUSDT",
    "SOLUSDT"
  ]
}
```

---

## 10.2 取得單一幣種分析

```http
GET /api/analysis?symbol=BTCUSDT&interval=4h
```

### 回傳

```json
{
  "symbol": "BTCUSDT",
  "interval": "4h",
  "lastPrice": 64500.12,
  "overall": {
    "status": "bullish_but_overheated",
    "label": "偏多，但槓桿過熱",
    "score": 0.92,
    "summary": "價格站上 MA20 / MA50，7D 動能強於 BTC，但 Funding Rate 與 Open Interest 偏高，追多風險提高。"
  },
  "modules": {
    "trend": {
      "score": 1.5,
      "label": "偏多",
      "confidence": "高",
      "items": []
    },
    "momentum": {
      "score": 1.2,
      "label": "偏多",
      "confidence": "中高",
      "items": []
    },
    "derivatives": {
      "score": 0.2,
      "label": "過熱",
      "confidence": "中",
      "items": []
    },
    "liquidity": {
      "score": 0.8,
      "label": "正常",
      "confidence": "高",
      "items": []
    }
  }
}
```

---

## 10.3 取得 K 線

```http
GET /api/klines?symbol=BTCUSDT&interval=4h&limit=200
```

### 回傳

```json
{
  "symbol": "BTCUSDT",
  "interval": "4h",
  "klines": [
    {
      "openTime": 1710000000000,
      "open": 64000,
      "high": 65000,
      "low": 63500,
      "close": 64500,
      "volume": 1234.56
    }
  ]
}
```

---

# 11. 前端頁面規劃

## 11.1 頁面結構

```text
/app
  /page.tsx
/components
  SymbolSelector.tsx
  IntervalSelector.tsx
  PriceChart.tsx
  OverallSignalCard.tsx
  IndicatorModuleCard.tsx
  IndicatorExplanationTable.tsx
  RiskWarningCard.tsx
/lib
  binanceClient.ts
  indicators.ts
  signalEngine.ts
  types.ts
/app/api
  /symbols/route.ts
  /analysis/route.ts
  /klines/route.ts
```

---

## 11.2 主要 UI 元件

### SymbolSelector

功能：

```text
搜尋幣種
切換幣種
預設 BTCUSDT
```

### IntervalSelector

功能：

```text
切換 15m / 1h / 4h / 1d
```

### PriceChart

功能：

```text
顯示 K 線
顯示成交量
顯示 MA20 / MA50
```

### OverallSignalCard

功能：

```text
顯示綜合狀態
顯示總分
顯示自然語言摘要
```

### IndicatorModuleCard

功能：

```text
顯示趨勢 / 動能 / 槓桿 / 流動性各模組
顯示偏多偏空
顯示可信度
顯示風險提醒
```

### IndicatorExplanationTable

功能：

```text
列出所有指標
顯示數值
顯示意義
顯示多空依據
顯示可信度
```

---

# 12. 後端服務規劃

## 12.1 Binance Client

檔案：

```text
/lib/binanceClient.ts
```

功能：

```text
getSpotKlines(symbol, interval, limit)
get24hrTicker(symbol)
getOrderBook(symbol, limit)
getAggTrades(symbol)
getFundingRate(symbol)
getOpenInterest(symbol)
getLongShortRatio(symbol, period)
getTakerBuySellVolume(symbol, period)
```

---

## 12.2 Indicator Service

檔案：

```text
/lib/indicators.ts
```

功能：

```text
calculateMA(data, period)
calculateRSI(data, period)
calculateMACD(data)
calculateReturns(data, period)
calculateVolumeMA(data, period)
calculateSpread(orderBook)
calculateOrderBookImbalance(orderBook)
calculateCVD(trades)
```

---

## 12.3 Signal Engine

檔案：

```text
/lib/signalEngine.ts
```

功能：

```text
analyzeTrend()
analyzeMomentum()
analyzeDerivatives()
analyzeLiquidity()
calculateOverallScore()
generateSummary()
```

---

# 13. 資料型別設計

## 13.1 IndicatorItem

```ts
export type Direction = "bullish" | "bearish" | "neutral" | "warning";

export type Confidence = "high" | "medium_high" | "medium" | "medium_low" | "low";

export interface IndicatorItem {
  key: string;
  name: string;
  value: number | string;
  unit?: string;
  direction: Direction;
  confidence: Confidence;
  meaning: string;
  bullishInterpretation: string;
  bearishInterpretation: string;
  riskNote: string;
  source: string;
  applicableTimeframes: string[];
}
```

---

## 13.2 ModuleAnalysis

```ts
export interface ModuleAnalysis {
  key: "trend" | "momentum" | "derivatives" | "liquidity";
  label: string;
  score: number;
  direction: Direction;
  confidence: Confidence;
  summary: string;
  items: IndicatorItem[];
}
```

---

## 13.3 OverallAnalysis

```ts
export interface OverallAnalysis {
  symbol: string;
  interval: string;
  lastPrice: number;
  overallStatus: string;
  overallLabel: string;
  overallScore: number;
  summary: string;
  modules: ModuleAnalysis[];
  warnings: string[];
  updatedAt: string;
}
```

---

# 14. MVP 開發任務拆解

## Phase 1：基礎專案

| 任務            | 說明                    |
| ------------- | --------------------- |
| 建立 Next.js 專案 | TypeScript + Tailwind |
| 建立基本 Layout   | Header、主區塊、右側卡片       |
| 建立幣種 selector | 預設 BTCUSDT            |
| 建立週期 selector | 15m / 1h / 4h / 1d    |

---

## Phase 2：Binance API 串接

| 任務                  | 說明               |
| ------------------- | ---------------- |
| 串接 exchangeInfo     | 取得交易對列表          |
| 串接 klines           | 取得 OHLCV         |
| 串接 24hr ticker      | 取得漲跌與成交量         |
| 串接 depth            | 取得 order book    |
| 串接 aggTrades        | 計算 CVD           |
| 串接 futures funding  | 取得 funding       |
| 串接 futures OI       | 取得 open interest |
| 串接 long/short ratio | 取得多空比            |
| 串接 taker buy/sell   | 取得主動買賣量          |

---

## Phase 3：指標計算

| 任務                    | 說明     |
| --------------------- | ------ |
| MA20 / MA50           | 趨勢判斷   |
| 24H / 7D / 14D return | 動能判斷   |
| Volume breakout       | 成交量突破  |
| Spread                | 交易成本   |
| Depth                 | 流動性    |
| Order Book Imbalance  | 掛單偏向   |
| CVD                   | 主動買賣累積 |
| Funding status        | 槓桿成本   |
| OI change             | 倉位變化   |
| Long/Short status     | 擁擠程度   |

---

## Phase 4：判讀引擎

| 任務     | 說明             |
| ------ | -------------- |
| 趨勢分數   | -2 到 +2        |
| 動能分數   | -2 到 +2        |
| 衍生品分數  | -2 到 +2        |
| 流動性分數  | -2 到 +2        |
| 風險懲罰   | 過熱、spread、矛盾訊號 |
| 綜合分數   | 加權平均           |
| 自然語言摘要 | 依照規則產生         |

---

## Phase 5：前端呈現

| 任務              | 說明           |
| --------------- | ------------ |
| K 線圖            | 顯示 OHLCV     |
| 綜合判讀卡           | 顯示總狀態        |
| 模組卡片            | 趨勢、動能、槓桿、流動性 |
| 指標明細表           | 每個指標意義與可信度   |
| 風險提醒            | 顯示不建議交易原因    |
| Loading / Error | API 錯誤處理     |

---

# 15. 完整產品版本規劃

MVP 是 Binance API only。完整產品可以擴展成更完整的加密貨幣情報與交易輔助平台。

---

## 15.1 V2：加入資料儲存與歷史追蹤

### 功能

| 功能        | 說明                      |
| --------- | ----------------------- |
| 歷史指標儲存    | 每 5 分鐘或每小時存一次           |
| 指標走勢圖     | Funding、OI、CVD、score 走勢 |
| 幣種比較      | BTC vs ETH vs SOL       |
| Watchlist | 自選幣種                    |
| 使用者設定     | 自訂週期與指標                 |

### 技術

```text
PostgreSQL
Prisma ORM
Redis Cache
Cron Job / Worker
```

---

## 15.2 V3：加入外部市場資料

### 可加入來源

| 資料                 | 來源                        |
| ------------------ | ------------------------- |
| 市值 / FDV / 分類      | CoinGecko / CoinMarketCap |
| 全市場 Funding / OI   | CoinGlass / Coinalyze     |
| 清算資料               | CoinGlass                 |
| Token Unlock       | TokenUnlocks              |
| DeFi TVL / Revenue | DefiLlama                 |

CoinGlass 本身提供 futures volume、open interest、funding rate、liquidation 等資料頁面，適合做跨交易所衍生品資料補強。([coinglass][7])

### 新增功能

```text
跨交易所 OI
跨交易所 funding
清算熱力圖
市值排行
板塊排行
代幣解鎖提醒
```

---

## 15.3 V4：加入鏈上資料

### 可加入資料

| 指標               | 用途      |
| ---------------- | ------- |
| Exchange Inflow  | 潛在賣壓    |
| Exchange Outflow | 籌碼離開交易所 |
| Active Addresses | 網路活躍度   |
| MVRV             | 中長期估值   |
| NVT              | 鏈上估值    |
| SOPR             | 獲利了結狀態  |
| Whale Flow       | 大戶資金流   |

### 建議來源

```text
Glassnode
CryptoQuant
Coin Metrics
Santiment
```

Glassnode 主打 on-chain、spot、derivatives data；CryptoQuant 則提供 on-chain 與 market data analytics，這類資料適合完整產品階段加入。([coinglass][2])

---

## 15.4 V5：加入 AI 分析報告

### 功能

```text
每日市場摘要
單一幣種分析報告
多空理由摘要
風險提醒
策略觀察清單
```

### AI 報告範例

```text
BTCUSDT 目前 4H 結構偏多，價格站上 MA20 與 MA50。
不過 Funding Rate 高於近 30 日平均，且 Open Interest 24H 明顯上升，
代表多頭倉位偏擁擠。若價格無法突破前高，短線可能出現多單平倉壓力。
目前較適合等待回踩支撐或 Funding 降溫後再評估進場。
```

---

## 15.5 V6：加入回測與策略驗證

### 功能

| 功能            | 說明       |
| ------------- | -------- |
| 指標組合回測        | 測試不同指標組合 |
| 勝率            | 計算勝率     |
| 最大回撤          | 評估風險     |
| Profit Factor | 評估策略品質   |
| Sharpe Ratio  | 風險調整後報酬  |
| 策略比較          | 多個策略一起比較 |

### 回測範例

```text
策略：
當 MA20 > MA50
且 7D return > BTC 7D return
且 Funding Rate < 0.05%
且 OI 24H change < 20%
則做多。

出場：
跌破 MA20 或 ATR stop。
```

---

## 15.6 V7：加入告警系統

### 告警條件

```text
Funding Rate 過熱
OI 24H 暴增
價格突破前高
CVD 背離
Spread 過大
清算量暴增
綜合分數轉多
綜合分數轉空
```

### 通知方式

```text
Email
Telegram
Discord
LINE Notify 替代方案
Browser Push
```

---

# 16. 完整產品功能地圖

| 階段  | 產品能力      | 資料來源                    |
| --- | --------- | ----------------------- |
| MVP | 單幣種指標解讀   | Binance                 |
| V2  | 歷史追蹤、自選清單 | Binance + DB            |
| V3  | 跨交易所衍生品   | CoinGlass / Coinalyze   |
| V4  | 鏈上資料      | Glassnode / CryptoQuant |
| V5  | AI 分析報告   | LLM                     |
| V6  | 回測系統      | 自有歷史資料                  |
| V7  | 告警與訂閱     | 自有系統                    |

---

# 17. 商業模式

## 17.1 免費版

```text
查看 BTC / ETH / SOL
基本技術指標
基本衍生品指標
每日固定刷新
```

## 17.2 付費版

```text
更多幣種
自選清單
進階指標
歷史資料
AI 報告
告警功能
回測功能
跨交易所資料
```

## 17.3 其他變現方式

```text
廣告
Affiliate
交易所推薦連結
進階 API
B2B 情報儀表板
```

---

# 18. 風險與注意事項

## 18.1 法規風險

避免使用：

```text
建議買入
建議賣出
保證獲利
準確預測
```

建議使用：

```text
偏多
偏空
中性
風險提高
訊號矛盾
不建議追單
```

頁面需要顯示免責聲明：

```text
本工具僅提供市場資料整理與指標解讀，不構成投資建議。加密貨幣交易具有高風險，請自行評估風險。
```

---

## 18.2 資料風險

| 風險              | 處理方式           |
| --------------- | -------------- |
| Binance API 延遲  | 顯示更新時間         |
| API rate limit  | 加入快取           |
| 指標錯誤            | 加入測試           |
| 幣種流動性不足         | 顯示不建議交易        |
| Order book 假掛單  | 降低可信度          |
| Funding 過熱但價格續漲 | 加入風險說明，不直接反向操作 |

---

# 19. 給 AI Coding Agent 的開發 Prompt

你可以直接把下面這段丟給 AI Coding 工具。

```text
請幫我建立一個 Next.js + TypeScript + Tailwind CSS 專案，產品名稱為 Crypto Signal Explainer。

目標：
建立一個加密貨幣多空指標解讀器。使用者可以選擇幣種與週期，系統從 Binance API 抓取市場資料，計算技術、動能、衍生品與流動性指標，並在頁面上以卡片方式顯示每個指標的數值、意義、偏多/偏空/中性判讀、可信度與風險提醒。

MVP 功能：
1. 幣種搜尋與切換，預設 BTCUSDT。
2. 週期切換：15m、1h、4h、1d。
3. 串接 Binance Spot API：
   - exchangeInfo
   - klines
   - 24hr ticker
   - depth
   - aggTrades
4. 串接 Binance USD-M Futures API：
   - funding rate
   - open interest
   - long/short ratio
   - taker buy/sell volume
5. 計算以下指標：
   - MA20
   - MA50
   - 24H return
   - 7D return
   - 14D return
   - volume breakout
   - spread
   - spread percentage
   - order book depth
   - order book imbalance
   - CVD
   - funding status
   - open interest change
   - long/short ratio status
   - taker buy/sell ratio
6. 建立 signal engine：
   - trend_score
   - momentum_score
   - derivatives_score
   - liquidity_score
   - risk_penalty
   - overall_score
7. 綜合狀態分類：
   - 強勢偏多
   - 偏多
   - 中性
   - 偏空
   - 強勢偏空
   - 過熱
   - 訊號矛盾
   - 不建議交易
8. 前端頁面：
   - 左側顯示 K 線圖與成交量
   - 右側顯示綜合判讀卡
   - 下方顯示指標明細表
   - 每個指標需要顯示：數值、意義、偏多依據、偏空依據、可信度、風險提醒、資料來源
9. 請建立清楚的資料型別：
   - IndicatorItem
   - ModuleAnalysis
   - OverallAnalysis
10. 請將程式拆成以下檔案：
   - /lib/binanceClient.ts
   - /lib/indicators.ts
   - /lib/signalEngine.ts
   - /lib/types.ts
   - /components/SymbolSelector.tsx
   - /components/IntervalSelector.tsx
   - /components/PriceChart.tsx
   - /components/OverallSignalCard.tsx
   - /components/IndicatorModuleCard.tsx
   - /components/IndicatorExplanationTable.tsx
   - /app/api/symbols/route.ts
   - /app/api/analysis/route.ts
   - /app/api/klines/route.ts

注意：
- 不要做自動下單。
- 不要輸出「建議買入」或「建議賣出」。
- 使用「偏多、偏空、中性、過熱、訊號矛盾、不建議交易」等描述。
- 頁面需顯示免責聲明：「本工具僅提供市場資料整理與指標解讀，不構成投資建議。」
- API 錯誤時需要有 fallback UI。
- 所有 Binance API 請集中在 binanceClient.ts。
- 所有指標計算請集中在 indicators.ts。
- 所有多空判讀邏輯請集中在 signalEngine.ts。
```

---

# 20. 我建議你第一版不要做的事

第一版先不要做：

```text
自動下單
會員系統
付款訂閱
AI 報告
鏈上資料
跨交易所資料
回測
告警
手機 App
```

原因是第一版最重要的是驗證：

> 使用者是否真的需要「指標解釋層」。

先把 Binance API + 指標判讀頁面做出來，確認好用，再擴大。

---

# 21. 最終產品願景

最終產品可以長成：

> **加密貨幣交易情報與風險判讀平台**

完整產品不只是看單一幣種，而是可以：

```text
1. 掃描全市場幣種
2. 找出動能最強標的
3. 排除流動性差的幣
4. 偵測 funding / OI 過熱
5. 偵測清算風險
6. 加入鏈上籌碼
7. 加入 AI 報告
8. 加入回測
9. 加入告警
10. 形成每日交易觀察清單
```

最終產品核心不是「預測價格」，而是：

> **幫使用者快速判斷：現在這個幣的市場狀態，是趨勢延續、槓桿過熱、訊號矛盾、還是不適合交易。**

這個方向比單純做行情網站更有價值。

[1]: https://www.tradingview.com/blog/en/crypto-derivatives-indicators-on-tradingview-53558/?utm_source=chatgpt.com "New crypto derivatives indicators, now on TradingView"
[2]: https://www.coinglass.com/?utm_source=chatgpt.com "CoinGlass | Crypto Market Data: Derivatives, Options, Spot ..."
[3]: https://www.binance.com/en/futures/funding-history/perpetual/trading-data?utm_source=chatgpt.com "Crypto Futures Trading Data | Long/Short Ratio"
[4]: https://www.binance.com/en?utm_source=chatgpt.com "Binance: The World's Most Trusted Cryptocurrency Exchange ..."
[5]: https://developers.binance.com/docs/derivatives/usds-margined-futures/market-data/rest-api/Long-Short-Ratio?utm_source=chatgpt.com "Long Short Ratio | Binance Open Platform"
[6]: https://www.binance.com/en/support/faq/detail/360033525031?utm_source=chatgpt.com "Introduction to Binance Futures Funding Rates"
[7]: https://www.coinglass.com/pro/futures/Cryptofutures?utm_source=chatgpt.com "Crypto Futures Trading Volume and Open Interest Chart"
