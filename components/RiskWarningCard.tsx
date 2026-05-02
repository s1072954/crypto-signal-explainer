import { ShieldAlert } from "lucide-react";

interface RiskWarningCardProps {
  warnings: string[];
}

export function RiskWarningCard({ warnings }: RiskWarningCardProps) {
  return (
    <section className="rounded-lg border border-amber-200 bg-amber-50 p-5 text-amber-950 shadow-soft">
      <div className="mb-3 flex items-center gap-2">
        <ShieldAlert className="h-5 w-5" aria-hidden="true" />
        <h2 className="text-lg font-semibold tracking-normal">風險提示</h2>
      </div>

      {warnings.length ? (
        <ul className="space-y-2 text-sm leading-6">
          {warnings.map((warning) => (
            <li key={warning}>{warning}</li>
          ))}
        </ul>
      ) : (
        <p className="text-sm leading-6">
          目前未偵測到極端 funding、OI 或價差風險。此頁僅整理市場資料與技術訊號，不構成投資建議。
        </p>
      )}
    </section>
  );
}
