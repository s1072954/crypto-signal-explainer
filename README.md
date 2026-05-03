# Crypto Signal Explainer

Next.js dashboard for explaining crypto market signals from Binance spot and USD-M futures data.

## Features

- Symbol and interval selection for USDT pairs.
- OHLCV chart with MA20 and MA50.
- Signal modules for trend, momentum, derivatives, and liquidity.
- Indicator explanation table with visual signal gauges.
- K-line pattern detection for range, breakout, rejection, compression, and overheated conditions.
- Historical pattern matcher that compares the current K-line window against recent historical windows.

## Scripts

```bash
npm install
npm run typecheck
npm run lint
npm run build
npm run dev
npm run start
```

## API

```http
GET /api/symbols
GET /api/klines?symbol=BTCUSDT&interval=4h&limit=240
GET /api/analysis?symbol=BTCUSDT&interval=4h
GET /api/patterns/detect?symbol=BTCUSDT&interval=4h
GET /api/patterns/match?symbol=BTCUSDT&interval=4h&lookback=60&topK=20
```

## Subpath Deployment

For deployment under a reverse-proxy path such as `/crypto-signal-explainer`, build and run with:

```bash
NEXT_PUBLIC_BASE_PATH=/crypto-signal-explainer npm run build
NEXT_PUBLIC_BASE_PATH=/crypto-signal-explainer npm run start -- --hostname 127.0.0.1 --port 3001
```

The app uses `NEXT_PUBLIC_BASE_PATH` for Next.js `basePath` and client API fetch URLs.

## Notes

This tool summarizes market data and technical signals. It is not investment advice.
