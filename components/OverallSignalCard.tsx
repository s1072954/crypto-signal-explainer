import { Activity, AlertTriangle, Gauge } from "lucide-react";
import { OverallAnalysis } from "@/lib/types";

interface OverallSignalCardProps {
  analysis: OverallAnalysis | null;
  loading?: boolean;
}

function formatPrice(value: number) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: value >= 100 ? 2 : 6
  }).format(value);
}

function statusClasses(status?: string) {
  if (!status) {
    return "border-slate-200 bg-slate-50 text-slate-700";
  }

  if (status.includes("bullish")) {
    return "border-emerald-200 bg-emerald-50 text-emerald-800";
  }

  if (status.includes("bearish")) {
    return "border-rose-200 bg-rose-50 text-rose-800";
  }

  if (status.includes("risk") || status.includes("overheated")) {
    return "border-amber-200 bg-amber-50 text-amber-800";
  }

  return "border-slate-200 bg-slate-50 text-slate-700";
}

export function OverallSignalCard({
  analysis,
  loading
}: OverallSignalCardProps) {
  const score = analysis?.overallScore ?? 0;
  const scorePercent = Math.max(0, Math.min(100, ((score + 2) / 4) * 100));

  return (
    <section className="rounded-lg border border-line bg-panel p-5 shadow-soft">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">綜合訊號</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-normal text-ink">
            {loading && !analysis ? "分析中" : analysis?.overallLabel ?? "待分析"}
          </h2>
        </div>
        <span
          className={`inline-flex h-11 w-11 items-center justify-center rounded-md border ${statusClasses(
            analysis?.overallStatus
          )}`}
        >
          {analysis?.warnings.length ? (
            <AlertTriangle className="h-5 w-5" aria-hidden="true" />
          ) : (
            <Activity className="h-5 w-5" aria-hidden="true" />
          )}
        </span>
      </div>

      <div className="space-y-4">
        <div>
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="inline-flex items-center gap-2 font-medium text-slate-600">
              <Gauge className="h-4 w-4" aria-hidden="true" />
              Score
            </span>
            <span className="font-semibold text-ink">{score.toFixed(2)}</span>
          </div>
          <div className="h-2 rounded-full bg-slate-100">
            <div
              className={`h-2 rounded-full ${
                score >= 0.5
                  ? "bg-emerald-500"
                  : score <= -0.5
                    ? "bg-rose-500"
                    : "bg-slate-400"
              }`}
              style={{ width: `${scorePercent}%` }}
            />
          </div>
          <div className="mt-1 flex justify-between text-xs text-slate-400">
            <span>-2</span>
            <span>0</span>
            <span>+2</span>
          </div>
        </div>

        <dl className="grid grid-cols-2 gap-3 border-y border-slate-100 py-3">
          <div>
            <dt className="text-xs font-medium uppercase text-slate-500">Last Price</dt>
            <dd className="mt-1 text-base font-semibold text-ink">
              {analysis ? formatPrice(analysis.lastPrice) : "-"}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase text-slate-500">Updated</dt>
            <dd className="mt-1 text-base font-semibold text-ink">
              {analysis
                ? new Date(analysis.updatedAt).toLocaleTimeString("zh-TW", {
                    hour: "2-digit",
                    minute: "2-digit"
                  })
                : "-"}
            </dd>
          </div>
        </dl>

        <p className="text-sm leading-6 text-slate-600">
          {analysis?.summary ?? "選擇交易對後會顯示模組化市場判讀。"}
        </p>
      </div>
    </section>
  );
}
