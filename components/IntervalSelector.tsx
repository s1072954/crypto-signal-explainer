"use client";

import { Clock3 } from "lucide-react";
import { Interval, SUPPORTED_INTERVALS } from "@/lib/types";

const INTERVALS: Interval[] = [...SUPPORTED_INTERVALS];

interface IntervalSelectorProps {
  value: Interval;
  disabled?: boolean;
  onChange: (value: Interval) => void;
}

export function IntervalSelector({
  value,
  disabled,
  onChange
}: IntervalSelectorProps) {
  return (
    <div className="flex flex-col gap-2 text-sm font-medium text-slate-700">
      <span className="inline-flex items-center gap-2">
        <Clock3 className="h-4 w-4 text-slate-500" aria-hidden="true" />
        週期
      </span>
      <div className="flex min-h-11 flex-wrap gap-1 rounded-md border border-line bg-white p-1 shadow-sm">
        {INTERVALS.map((interval) => {
          const selected = interval === value;

          return (
            <button
              key={interval}
              className={`h-9 min-w-12 rounded px-3 text-sm font-semibold transition ${
                selected
                  ? "bg-slate-900 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100"
              } disabled:cursor-not-allowed disabled:opacity-60`}
              disabled={disabled}
              type="button"
              onClick={() => onChange(interval)}
            >
              {interval}
            </button>
          );
        })}
      </div>
    </div>
  );
}
