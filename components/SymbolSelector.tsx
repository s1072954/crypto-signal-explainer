"use client";

import { Search } from "lucide-react";

interface SymbolSelectorProps {
  value: string;
  symbols: string[];
  disabled?: boolean;
  onChange: (value: string) => void;
}

export function SymbolSelector({
  value,
  symbols,
  disabled,
  onChange
}: SymbolSelectorProps) {
  return (
    <label className="flex min-w-[15rem] flex-1 flex-col gap-2 text-sm font-medium text-slate-700 md:max-w-xs">
      交易對
      <span className="relative">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
        />
        <input
          className="h-11 w-full rounded-md border border-line bg-white pl-9 pr-3 text-base font-semibold tracking-normal text-ink outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100 disabled:cursor-not-allowed disabled:bg-slate-100"
          disabled={disabled}
          list="symbol-options"
          value={value}
          onChange={(event) => onChange(event.target.value.toUpperCase().trim())}
          placeholder="BTCUSDT"
        />
      </span>
      <datalist id="symbol-options">
        {symbols.map((symbol) => (
          <option key={symbol} value={symbol} />
        ))}
      </datalist>
    </label>
  );
}
