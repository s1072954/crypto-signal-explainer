import { Confidence, Direction, IndicatorItem } from "@/lib/types";

interface SignalGaugeProps {
  item: IndicatorItem;
}

const confidenceOffset: Record<Confidence, number> = {
  high: 18,
  medium_high: 14,
  medium: 10,
  medium_low: 6,
  low: 3
};

const directionLabels: Record<Direction, string> = {
  bullish: "偏多",
  bearish: "偏空",
  neutral: "中性",
  warning: "風險"
};

const needleColors: Record<Direction, string> = {
  bullish: "#16a34a",
  bearish: "#dc2626",
  neutral: "#64748b",
  warning: "#d97706"
};

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

export function signalIndexFromItem(item: IndicatorItem) {
  const offset = confidenceOffset[item.confidence];

  switch (item.direction) {
    case "bullish":
      return clamp(60 + offset);
    case "bearish":
      return clamp(40 - offset);
    case "warning":
      return clamp(74 + offset);
    case "neutral":
    default:
      return 50;
  }
}

function pointOnArc(angle: number, radius: number) {
  const radians = (angle * Math.PI) / 180;

  return {
    x: 60 + radius * Math.cos(radians),
    y: 58 + radius * Math.sin(radians)
  };
}

function arcPath(startPercent: number, endPercent: number, radius = 46) {
  const startAngle = 180 + (startPercent / 100) * 180;
  const endAngle = 180 + (endPercent / 100) * 180;
  const start = pointOnArc(startAngle, radius);
  const end = pointOnArc(endAngle, radius);

  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 0 1 ${end.x} ${end.y}`;
}

export function SignalGauge({ item }: SignalGaugeProps) {
  const value = signalIndexFromItem(item);
  const needleAngle = 180 + (value / 100) * 180;
  const needleEnd = pointOnArc(needleAngle, 34);
  const needleColor = needleColors[item.direction];

  return (
    <div
      aria-label={`${item.name} 訊號指數 ${value}`}
      className="w-32"
      role="img"
      title={`${directionLabels[item.direction]} ${value}/100`}
    >
      <svg className="h-[74px] w-32" viewBox="0 0 120 74">
        <path
          d={arcPath(0, 100)}
          fill="none"
          stroke="#eef2f7"
          strokeLinecap="round"
          strokeWidth="12"
        />
        <path
          d={arcPath(0, 35)}
          fill="none"
          stroke="#dc2626"
          strokeLinecap="round"
          strokeWidth="10"
        />
        <path
          d={arcPath(35, 47)}
          fill="none"
          stroke="#f97316"
          strokeLinecap="butt"
          strokeWidth="10"
        />
        <path
          d={arcPath(47, 53)}
          fill="none"
          stroke="#cbd5e1"
          strokeLinecap="butt"
          strokeWidth="10"
        />
        <path
          d={arcPath(53, 65)}
          fill="none"
          stroke="#84cc16"
          strokeLinecap="butt"
          strokeWidth="10"
        />
        <path
          d={arcPath(65, 100)}
          fill="none"
          stroke="#16a34a"
          strokeLinecap="round"
          strokeWidth="10"
        />
        <line
          stroke={needleColor}
          strokeLinecap="round"
          strokeWidth="4"
          x1="60"
          x2={needleEnd.x}
          y1="58"
          y2={needleEnd.y}
        />
        <circle cx="60" cy="58" fill="#ffffff" r="8" stroke="#94a3b8" strokeWidth="2" />
        <text fill="#94a3b8" fontSize="8" fontWeight="700" textAnchor="middle" x="14" y="67">
          0
        </text>
        <text fill="#94a3b8" fontSize="8" fontWeight="700" textAnchor="middle" x="60" y="18">
          50
        </text>
        <text fill="#94a3b8" fontSize="8" fontWeight="700" textAnchor="middle" x="106" y="67">
          100
        </text>
      </svg>
      <div className="mt-1 flex items-center justify-between gap-2">
        <span className="text-lg font-semibold leading-none text-ink">{value}</span>
        <span
          className="rounded border px-1.5 py-0.5 text-[11px] font-semibold leading-none"
          style={{
            borderColor: needleColor,
            color: needleColor
          }}
        >
          {directionLabels[item.direction]}
        </span>
      </div>
    </div>
  );
}
