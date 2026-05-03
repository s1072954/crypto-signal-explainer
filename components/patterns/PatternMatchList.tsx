"use client";

import { HelpCircle, MousePointerClick } from "lucide-react";
import { PatternMatch } from "@/lib/patterns/patternTypes";

interface PatternMatchListProps {
  matches: PatternMatch[];
  compact?: boolean;
  selectedMatchKey?: string | null;
  onSelectMatch?: (match: PatternMatch) => void;
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

function matchKey(match: PatternMatch) {
  return `${match.startTime}-${match.endTime}`;
}

export function PatternMatchList({
  matches,
  compact,
  selectedMatchKey,
  onSelectMatch
}: PatternMatchListProps) {
  if (compact) {
    return (
      <section className="flex max-h-[34rem] min-h-[34rem] flex-col overflow-hidden rounded-lg border border-line bg-panel shadow-soft">
        <div className="border-b border-slate-100 p-4">
          <h2 className="text-base font-semibold tracking-normal text-ink">
            Top 相似樣本
          </h2>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            點選樣本後，左側圖表會固定顯示該樣本的 24K 投影。
          </p>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          {matches.map((match, index) => {
            const key = matchKey(match);
            const selected = selectedMatchKey === key;

            return (
              <button
                key={key}
                className={`block w-full border-b border-slate-100 px-4 py-3 text-left transition ${
                  selected ? "bg-teal-50" : "hover:bg-slate-50"
                }`}
                title="在左側 K 線圖顯示這筆相似樣本的後續投影"
                type="button"
                onClick={() => onSelectMatch?.(match)}
              >
                <div className="mb-2 flex items-center justify-between gap-3">
                  <span
                    className={`inline-flex items-center gap-2 text-sm font-semibold ${
                      selected ? "text-teal-800" : "text-ink"
                    }`}
                  >
                    <MousePointerClick className="h-3.5 w-3.5" aria-hidden="true" />
                    #{index + 1} {formatDate(match.startTime)}
                  </span>
                  <span className="text-sm font-semibold text-ink">
                    {(match.similarityScore * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="block text-slate-400">6K</span>
                    <span className="font-semibold text-slate-700">
                      {formatPercent(match.futureReturn6)}
                    </span>
                  </div>
                  <div>
                    <span className="block text-slate-400">12K</span>
                    <span className="font-semibold text-slate-700">
                      {formatPercent(match.futureReturn12)}
                    </span>
                  </div>
                  <div>
                    <span className="block text-slate-400">24K</span>
                    <span className="font-semibold text-slate-700">
                      {formatPercent(match.futureReturn24)}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="block text-slate-400">最大上行</span>
                    <span className="font-semibold text-emerald-700">
                      {formatPercent(match.maxFutureUpside)}
                    </span>
                  </div>
                  <div>
                    <span className="block text-slate-400">最大回撤</span>
                    <span className="font-semibold text-rose-700">
                      {formatPercent(match.maxFutureDrawdown)}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </section>
    );
  }

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
            {matches.map((match) => {
              const key = matchKey(match);
              const selected = selectedMatchKey === key;

              return (
                <tr
                  key={key}
                  className={
                    selected
                      ? "bg-teal-50/70"
                      : "transition-colors hover:bg-slate-50"
                  }
                >
                  <td className="py-3 pr-4">
                    <button
                      className={`inline-flex items-center gap-2 rounded px-2 py-1 text-sm font-semibold transition ${
                        selected
                          ? "bg-teal-100 text-teal-800"
                          : "text-slate-700 hover:bg-slate-100 hover:text-ink"
                      }`}
                      title="在主 K 線圖顯示這筆相似樣本的後續投影"
                      type="button"
                      onClick={() => onSelectMatch?.(match)}
                    >
                      <MousePointerClick className="h-3.5 w-3.5" aria-hidden="true" />
                      {formatDate(match.startTime)}
                    </button>
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
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
