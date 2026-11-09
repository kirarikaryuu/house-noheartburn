import type { DistributionBucket } from "@/lib/types";
import { formatInteger } from "@/lib/format";

export function DistributionBars({
  title,
  bucket,
}: {
  title: string;
  bucket: DistributionBucket;
}) {
  const max = Math.max(...bucket.counts, 1);
  return (
    <div>
      <div className="mb-5 flex items-baseline justify-between">
        <h3 className="font-display text-lg font-semibold">{title}</h3>
        <span className="text-[10px] text-muted">近 24 个月 · 成交笔数</span>
      </div>
      <div className="grid gap-3">
        {bucket.labels.map((label, index) => (
          <div key={label} className="grid grid-cols-[72px_1fr_42px] items-center gap-3">
            <span className="text-[10px] text-muted">{label}</span>
            <span className="h-2 bg-paper-deep">
              <span
                className="block h-full bg-teal/80"
                style={{ width: `${Math.max((bucket.counts[index] / max) * 100, bucket.counts[index] ? 4 : 0)}%` }}
              />
            </span>
            <span className="text-right font-mono text-[10px] text-ink-soft">{formatInteger(bucket.counts[index])}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
