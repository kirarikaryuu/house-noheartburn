import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "border border-line bg-surface/75 shadow-[0_24px_70px_rgba(31,39,35,0.055)]",
        className,
      )}
      {...props}
    />
  );
}
