import { PatternMatch } from "@/lib/patterns/patternTypes";

interface PatternMatchListProps {
  matches: PatternMatch[];
}

function formatDate(timestamp: number) {
  return new Date(timestamp).toLocaleDateString("zh-TW", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric"
  });
}

function formatPercent(value: number | null) {
  if (value === null) {
    return "-";
  }

  return `${value.toFixed(2)}%`;
}

export function PatternMatchList({ matches }: PatternMatchListProps) {
  return (
    <section className="rounded-lg border border-line bg-panel p-5 shadow-soft">
      <h2 className="mb-4 text-lg font-semibold tracking-normal text-ink">Top 相似樣本</h2>
      <div className="overflow-x-auto">
        <table className="min-w-[760px] table-fixed text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
              <th className="w-32 py-3 pr-4 font-semibold">期間</th>
              <th className="w-28 py-3 pr-4 font-semibold">相似度</th>
              <th className="w-28 py-3 pr-4 font-semibold">6K</th>
              <th className="w-28 py-3 pr-4 font-semibold">12K</th>
              <th className="w-28 py-3 pr-4 font-semibold">24K</th>
              <th className="w-28 py-3 pr-4 font-semibold">最大上行</th>
              <th className="w-28 py-3 font-semibold">最大回撤</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {matches.map((match) => (
              <tr key={`${match.startTime}-${match.endTime}`}>
                <td className="py-3 pr-4 text-slate-700">
                  {formatDate(match.startTime)}
                </td>
                <td className="py-3 pr-4 font-semibold text-ink">
                  {(match.similarityScore * 100).toFixed(1)}%
                </td>
                <td className="py-3 pr-4 text-slate-700">
                  {formatPercent(match.futureReturn6)}
                </td>
                <td className="py-3 pr-4 text-slate-700">
                  {formatPercent(match.futureReturn12)}
                </td>
                <td className="py-3 pr-4 text-slate-700">
                  {formatPercent(match.futureReturn24)}
                </td>
                <td className="py-3 pr-4 text-emerald-700">
                  {formatPercent(match.maxFutureUpside)}
                </td>
                <td className="py-3 text-rose-700">
                  {formatPercent(match.maxFutureDrawdown)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
