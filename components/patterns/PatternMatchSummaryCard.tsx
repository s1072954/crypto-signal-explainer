import { History } from "lucide-react";
import { PatternMatchSummary } from "@/lib/patterns/patternTypes";

interface PatternMatchSummaryCardProps {
  summary: PatternMatchSummary | null;
  loading?: boolean;
}

function formatPercent(value: number | null) {
  if (value === null) {
    return "-";
  }

  return `${value.toFixed(2)}%`;
}

export function PatternMatchSummaryCard({
  summary,
  loading
}: PatternMatchSummaryCardProps) {
  return (
    <section className="rounded-lg border border-line bg-panel p-5 shadow-soft">
      <div className="mb-4 flex items-center gap-2">
        <History className="h-5 w-5 text-slate-700" aria-hidden="true" />
        <h2 className="text-lg font-semibold tracking-normal text-ink">歷史相似 K 線</h2>
      </div>

      {loading && !summary ? (
        <p className="text-sm text-slate-500">正在比對近期歷史型態。</p>
      ) : summary ? (
        <>
          <div className="mb-4">
            <p className="text-xl font-semibold tracking-normal text-ink">{summary.label}</p>
            <p className="mt-1 text-sm text-slate-500">
              樣本 {summary.sampleSize} 組，信心 {summary.confidence}
            </p>
          </div>

          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm md:grid-cols-4">
            <div>
              <dt className="text-slate-500">12K 平均報酬</dt>
              <dd className="mt-1 font-semibold text-ink">
                {formatPercent(summary.avgFutureReturn12)}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">12K 上漲機率</dt>
              <dd className="mt-1 font-semibold text-ink">
                {formatPercent(summary.upProbability12)}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">最大後續上行</dt>
              <dd className="mt-1 font-semibold text-ink">
                {formatPercent(summary.avgMaxFutureUpside)}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">最大後續回撤</dt>
              <dd className="mt-1 font-semibold text-ink">
                {formatPercent(summary.avgMaxFutureDrawdown)}
              </dd>
            </div>
          </dl>
        </>
      ) : (
        <p className="text-sm text-slate-500">尚無歷史相似型態資料。</p>
      )}
    </section>
  );
}
