import { PatternMatchList } from "@/components/patterns/PatternMatchList";
import { PatternMatchSummaryCard } from "@/components/patterns/PatternMatchSummaryCard";
import { PatternMatchResponse } from "@/lib/patterns/patternTypes";

interface HistoricalPatternMatcherProps {
  data: PatternMatchResponse | null;
  loading?: boolean;
}

export function HistoricalPatternMatcher({
  data,
  loading
}: HistoricalPatternMatcherProps) {
  return (
    <div className="grid gap-5 xl:grid-cols-[24rem_minmax(0,1fr)]">
      <PatternMatchSummaryCard loading={loading} summary={data?.summary ?? null} />
      {data?.matches.length ? (
        <PatternMatchList matches={data.matches} />
      ) : (
        <section className="rounded-lg border border-line bg-panel p-5 text-sm text-slate-500 shadow-soft">
          {loading ? "正在建立歷史相似樣本。" : "目前沒有足夠的歷史樣本。"}
        </section>
      )}
    </div>
  );
}
