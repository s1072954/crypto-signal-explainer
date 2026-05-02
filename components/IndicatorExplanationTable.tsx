import { BookOpen } from "lucide-react";
import { SignalGauge } from "@/components/SignalGauge";
import { Confidence, Direction, ModuleAnalysis } from "@/lib/types";

interface IndicatorExplanationTableProps {
  modules: ModuleAnalysis[];
}

const directionLabels: Record<Direction, string> = {
  bullish: "偏多",
  bearish: "偏空",
  neutral: "中性",
  warning: "風險"
};

const confidenceLabels: Record<Confidence, string> = {
  high: "高",
  medium_high: "中高",
  medium: "中",
  medium_low: "中低",
  low: "低"
};

const moduleNames: Record<string, string> = {
  trend: "趨勢",
  momentum: "動能",
  derivatives: "衍生品",
  liquidity: "流動性"
};

function valueWithUnit(value: number | string, unit?: string) {
  if (typeof value === "number") {
    const formatted = new Intl.NumberFormat("en-US", {
      maximumFractionDigits: Math.abs(value) >= 1000 ? 0 : 4
    }).format(value);

    return unit ? `${formatted} ${unit}` : formatted;
  }

  return unit ? `${value} ${unit}` : value;
}

export function IndicatorExplanationTable({
  modules
}: IndicatorExplanationTableProps) {
  const items = modules.flatMap((module) =>
    module.items.map((item) => ({
      moduleKey: module.key,
      ...item
    }))
  );

  return (
    <section className="rounded-lg border border-line bg-panel p-5 shadow-soft">
      <div className="mb-4 flex items-center gap-2">
        <BookOpen className="h-5 w-5 text-slate-700" aria-hidden="true" />
        <h2 className="text-lg font-semibold tracking-normal text-ink">指標說明</h2>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-[1120px] table-fixed border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
              <th className="w-24 py-3 pr-4 font-semibold">模組</th>
              <th className="w-40 py-3 pr-4 font-semibold">指標</th>
              <th className="w-32 py-3 pr-4 font-semibold">數值</th>
              <th className="w-40 py-3 pr-4 font-semibold">訊號指數</th>
              <th className="w-24 py-3 pr-4 font-semibold">方向</th>
              <th className="w-24 py-3 pr-4 font-semibold">信心</th>
              <th className="py-3 pr-4 font-semibold">解讀</th>
              <th className="py-3 font-semibold">風險</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((item) => (
              <tr key={`${item.moduleKey}-${item.key}`} className="align-top">
                <td className="py-4 pr-4 font-medium text-slate-700">
                  {moduleNames[item.moduleKey]}
                </td>
                <td className="py-4 pr-4 font-semibold text-ink">{item.name}</td>
                <td className="py-4 pr-4 text-slate-700">
                  {valueWithUnit(item.value, item.unit)}
                </td>
                <td className="py-4 pr-4">
                  <SignalGauge item={item} />
                </td>
                <td className="py-4 pr-4 text-slate-700">
                  {directionLabels[item.direction]}
                </td>
                <td className="py-4 pr-4 text-slate-700">
                  {confidenceLabels[item.confidence]}
                </td>
                <td className="py-4 pr-4 leading-6 text-slate-600">{item.meaning}</td>
                <td className="py-4 leading-6 text-slate-600">{item.riskNote}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
