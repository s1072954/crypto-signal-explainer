import { AlertTriangle, CandlestickChart, TrendingDown, TrendingUp } from "lucide-react";
import { DetectedPattern } from "@/lib/patterns/patternTypes";
import { Direction } from "@/lib/types";

interface PatternDetectionCardProps {
  patterns: DetectedPattern[];
  loading?: boolean;
}

const directionClasses: Record<Direction, string> = {
  bullish: "border-emerald-200 bg-emerald-50 text-emerald-800",
  bearish: "border-rose-200 bg-rose-50 text-rose-800",
  neutral: "border-slate-200 bg-slate-50 text-slate-700",
  warning: "border-amber-200 bg-amber-50 text-amber-800"
};

const directionLabels: Record<Direction, string> = {
  bullish: "偏多",
  bearish: "偏空",
  neutral: "中性",
  warning: "風險"
};

function PatternIcon({ direction }: { direction: Direction }) {
  if (direction === "bullish") {
    return <TrendingUp className="h-4 w-4" aria-hidden="true" />;
  }

  if (direction === "bearish") {
    return <TrendingDown className="h-4 w-4" aria-hidden="true" />;
  }

  if (direction === "warning") {
    return <AlertTriangle className="h-4 w-4" aria-hidden="true" />;
  }

  return <CandlestickChart className="h-4 w-4" aria-hidden="true" />;
}

export function PatternDetectionCard({ patterns, loading }: PatternDetectionCardProps) {
  return (
    <section className="rounded-lg border border-line bg-panel p-5 shadow-soft">
      <div className="mb-4 flex items-center gap-2">
        <CandlestickChart className="h-5 w-5 text-slate-700" aria-hidden="true" />
        <h2 className="text-lg font-semibold tracking-normal text-ink">K 線型態偵測</h2>
      </div>

      {loading && !patterns.length ? (
        <p className="text-sm text-slate-500">正在偵測近期 K 線型態。</p>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {patterns.map((pattern) => (
            <article key={pattern.key} className="rounded-md border border-slate-200 p-4">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-ink">{pattern.name}</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{pattern.meaning}</p>
                </div>
                <span
                  className={`inline-flex shrink-0 items-center gap-1 rounded border px-2 py-1 text-xs font-semibold ${directionClasses[pattern.direction]}`}
                >
                  <PatternIcon direction={pattern.direction} />
                  {directionLabels[pattern.direction]}
                </span>
              </div>

              <div className="mb-3">
                <div className="mb-1 flex justify-between text-xs font-semibold text-slate-500">
                  <span>型態分數</span>
                  <span>{pattern.score}/100</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100">
                  <div
                    className={`h-2 rounded-full ${
                      pattern.direction === "bullish"
                        ? "bg-emerald-500"
                        : pattern.direction === "bearish"
                          ? "bg-rose-500"
                          : pattern.direction === "warning"
                            ? "bg-amber-500"
                            : "bg-slate-400"
                    }`}
                    style={{ width: `${Math.max(0, Math.min(100, pattern.score))}%` }}
                  />
                </div>
              </div>

              <ul className="space-y-1 text-xs leading-5 text-slate-500">
                {pattern.evidence.slice(0, 3).map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
