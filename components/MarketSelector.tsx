"use client";

import { Activity, BarChart3, type LucideIcon } from "lucide-react";
import { MarketType } from "@/lib/types";

interface MarketSelectorProps {
  value: MarketType;
  disabled?: boolean;
  onChange: (value: MarketType) => void;
}

const OPTIONS: Array<{
  value: MarketType;
  label: string;
  icon: LucideIcon;
}> = [
  {
    value: "spot",
    label: "現貨",
    icon: BarChart3
  },
  {
    value: "futures",
    label: "合約",
    icon: Activity
  }
];

export function MarketSelector({
  value,
  disabled,
  onChange
}: MarketSelectorProps) {
  return (
    <div className="flex flex-col gap-2 text-sm font-medium text-slate-700">
      市場
      <div className="grid h-11 grid-cols-2 rounded-md border border-line bg-white p-1">
        {OPTIONS.map((option) => {
          const Icon = option.icon;
          const active = option.value === value;

          return (
            <button
              key={option.value}
              aria-pressed={active}
              className={`inline-flex min-w-[5.5rem] items-center justify-center gap-2 rounded px-3 text-sm font-semibold transition ${
                active
                  ? "bg-slate-900 text-white shadow-sm"
                  : "text-slate-500 hover:bg-slate-100 hover:text-ink"
              } disabled:cursor-not-allowed disabled:opacity-60`}
              disabled={disabled}
              title={option.value === "spot" ? "Binance Spot" : "Binance USD-M Futures"}
              type="button"
              onClick={() => onChange(option.value)}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
