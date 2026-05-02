import { Activity, BarChart3, Layers, TrendingUp } from "lucide-react";
import { Direction, ModuleAnalysis, ModuleKey } from "@/lib/types";

interface IndicatorModuleCardProps {
  module: ModuleAnalysis;
}

const moduleIcons: Record<ModuleKey, typeof TrendingUp> = {
  trend: TrendingUp,
  momentum: Activity,
  derivatives: Layers,
  liquidity: BarChart3
};

const moduleNames: Record<ModuleKey, string> = {
  trend: "趨勢",
  momentum: "動能",
  derivatives: "衍生品",
  liquidity: "流動性"
};

const directionClasses: Record<Direction, string> = {
  bullish: "bg-emerald-50 text-emerald-700 border-emerald-200",
  bearish: "bg-rose-50 text-rose-700 border-rose-200",
  neutral: "bg-slate-50 text-slate-700 border-slate-200",
  warning: "bg-amber-50 text-amber-800 border-amber-200"
};

function formatValue(value: string | number, unit?: string) {
  if (typeof value === "number") {
    const formatted = new Intl.NumberFormat("en-US", {
      maximumFractionDigits: Math.abs(value) >= 1000 ? 0 : 4
    }).format(value);

    return unit ? `${formatted} ${unit}` : formatted;
  }

  return unit ? `${value} ${unit}` : value;
}

export function IndicatorModuleCard({ module }: IndicatorModuleCardProps) {
  const Icon = moduleIcons[module.key];

  return (
    <section className="rounded-lg border border-line bg-panel p-5 shadow-soft">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-slate-900 text-white">
            <Icon className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-500">{moduleNames[module.key]}</p>
            <h3 className="truncate text-lg font-semibold tracking-normal text-ink">
              {module.label}
            </h3>
          </div>
        </div>
        <span
          className={`rounded-md border px-2.5 py-1 text-sm font-semibold ${directionClasses[module.direction]}`}
        >
          {module.score.toFixed(2)}
        </span>
      </div>

      <p className="mb-4 min-h-12 text-sm leading-6 text-slate-600">{module.summary}</p>

      <div className="divide-y divide-slate-100">
        {module.items.slice(0, 5).map((item) => (
          <div key={item.key} className="flex items-center justify-between gap-3 py-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-ink">{item.name}</p>
              <p className="truncate text-xs text-slate-500">{item.confidence}</p>
            </div>
            <span
              className={`shrink-0 rounded border px-2 py-1 text-xs font-semibold ${directionClasses[item.direction]}`}
            >
              {formatValue(item.value, item.unit)}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
