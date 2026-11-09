import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Tone = "neutral" | "teal" | "copper" | "warning";

const tones: Record<Tone, string> = {
  neutral: "border-line bg-paper-deep/70 text-muted",
  teal: "border-teal/20 bg-teal-soft text-teal",
  copper: "border-copper/15 bg-copper-soft text-copper",
  warning: "border-warning/20 bg-[#f4e6d4] text-warning",
};

export function Badge({
  tone = "neutral",
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 border px-2 py-1 text-[10px] leading-none tracking-[0.04em]",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
