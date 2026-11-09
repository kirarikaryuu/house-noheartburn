import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type Variant = "solid" | "outline" | "quiet";

const variants: Record<Variant, string> = {
  solid: "border-ink bg-ink text-paper hover:bg-ink-soft",
  outline: "border-line bg-surface/50 text-ink hover:border-ink",
  quiet: "border-transparent bg-transparent text-teal hover:bg-teal-soft",
};

const base =
  "inline-flex min-h-10 items-center justify-center gap-2 border px-4 py-2 text-[12px] font-medium tracking-[0.02em] transition-colors disabled:cursor-not-allowed disabled:opacity-50";

export function ButtonLink({
  href,
  children,
  variant = "outline",
  className,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  variant?: Variant;
  children: ReactNode;
}) {
  return (
    <Link prefetch={false} href={href} className={cn(base, variants[variant], className)} {...props}>
      {children}
    </Link>
  );
}

export function Button({
  variant = "outline",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return <button className={cn(base, variants[variant], className)} {...props} />;
}
