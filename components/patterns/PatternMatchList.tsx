import { HelpCircle } from "lucide-react";
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

function HeaderWithHelp({
  label,
  description
}: {
  label: string;
  description: string;
}) {
  return (
    <span className="inline-flex items-center gap-1.5" title={description}>
      {label}
      <HelpCircle
        className="h-3.5 w-3.5 text-slate-400"
        aria-label={description}
      />
    </span>
  );
}

export function PatternMatchList({ matches }: PatternMatchListProps) {
  return (
    <section className="rounded-lg border border-line bg-panel p-5 shadow-soft">
      <h2 className="mb-4 text-lg font-semibold tracking-normal text-ink">Top 相似樣本</h2>
      <div className="overflow-x-auto">
        <table className="min-w-[760px] table-fixed text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
              <th className="w-32 py-3 pr-4 font-semibold">
                <HeaderWithHelp
                  label="期間"
                  description="這筆歷史樣本的起始日期，代表過去哪一段 K 線被拿來和目前走勢比較。"
                />
              </th>
              <th className="w-28 py-3 pr-4 font-semibold">
                <HeaderWithHelp
                  label="相似度"
                  description="目前 K 線視窗與歷史視窗的形狀相似程度，越接近 100% 表示越像；這不是勝率。"
                />
              </th>
              <th className="w-28 py-3 pr-4 font-semibold">
                <HeaderWithHelp
                  label="6K"
                  description="相似樣本結束後，再往後第 6 根 K 線的報酬率。K 會跟著目前選擇的時間週期改變，例如 4h 週期的 6K 約等於 24 小時。"
                />
              </th>
              <th className="w-28 py-3 pr-4 font-semibold">
                <HeaderWithHelp
                  label="12K"
                  description="相似樣本結束後，再往後第 12 根 K 線的報酬率，用來看中一點的後續表現。"
                />
              </th>
              <th className="w-28 py-3 pr-4 font-semibold">
                <HeaderWithHelp
                  label="24K"
                  description="相似樣本結束後，再往後第 24 根 K 線的報酬率，用來看較長一點的後續表現。"
                />
              </th>
              <th className="w-28 py-3 pr-4 font-semibold">
                <HeaderWithHelp
                  label="最大上行"
                  description="相似樣本結束後的 24 根 K 線內，價格曾經出現過的最大向上漲幅。"
                />
              </th>
              <th className="w-28 py-3 font-semibold">
                <HeaderWithHelp
                  label="最大回撤"
                  description="相似樣本結束後的 24 根 K 線內，價格曾經出現過的最大向下跌幅，通常用來觀察風險。"
                />
              </th>
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
