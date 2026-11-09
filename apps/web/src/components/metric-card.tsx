import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function MetricCard({
  label,
  value,
  unit,
  hint,
  delta,
  emphasis = false,
  compact = false,
  children,
}: {
  label: string;
  value: string;
  unit?: string;
  hint?: string;
  delta?: string | null;
  emphasis?: boolean;
  compact?: boolean;
  children?: ReactNode;
}) {
  const positive = delta?.startsWith("+");
  const negative = delta?.startsWith("-");
  return (
    <div
      className={cn(
        "flex min-h-[148px] flex-col justify-between border p-5",
        emphasis
          ? "border-teal bg-teal text-paper"
          : "border-line bg-surface/55 text-ink",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <span className={cn("text-[10px] tracking-[0.12em]", emphasis ? "text-teal-soft" : "text-muted")}>
          {label}
        </span>
        {delta && (
          <Badge tone={emphasis ? "neutral" : positive ? "copper" : negative ? "teal" : "neutral"}>
            {delta}
          </Badge>
        )}
      </div>
      <div className="flex items-end gap-1.5">
        <span
          className={cn(
            "metric-number whitespace-nowrap leading-none",
            compact ? "text-[24px] md:text-[28px]" : "text-[38px] md:text-[44px]",
          )}
        >
          {value}
        </span>
        {unit && (
          <span
            className={cn(
              "whitespace-nowrap pb-1 text-[11px]",
              emphasis ? "text-teal-soft" : "text-muted",
            )}
          >
            {unit}
          </span>
        )}
      </div>
      <div className={cn("text-[10px] leading-5", emphasis ? "text-teal-soft" : "text-muted")}>
        {hint ?? children}
      </div>
    </div>
  );
}
