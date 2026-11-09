import Link from "next/link";
import { SITE_NAME, SITE_TAGLINE } from "@/lib/constants";

const navigation = [
  { href: "/", label: "总览" },
  { href: "/compare/", label: "区域对比" },
  { href: "/methodology/", label: "数据方法" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-line/80 bg-paper/90 backdrop-blur-xl">
      <div className="page-shell flex h-[74px] items-center justify-between gap-6">
        <Link prefetch={false} href="/" className="group flex items-center gap-3" aria-label={`${SITE_NAME}首页`}>
          <span className="grid size-10 place-items-center rounded-full bg-teal font-display text-lg text-paper transition-transform group-hover:-rotate-6">
            房
          </span>
          <span>
            <strong className="block font-display text-[17px] font-semibold tracking-[-0.02em]">
              {SITE_NAME}
            </strong>
            <span className="block text-[9px] uppercase tracking-[0.17em] text-muted">
              {SITE_TAGLINE}
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-8 text-[12px] text-ink-soft md:flex">
          {navigation.map((item) => (
            <Link prefetch={false} key={item.href} href={item.href} className="transition-colors hover:text-teal">
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 text-[10px] text-muted lg:flex">
          <span className="size-1.5 rounded-full bg-teal shadow-[0_0_0_4px_rgba(14,107,96,0.12)]" />
          静态数据站
        </div>

        <details className="relative md:hidden">
          <summary className="grid size-10 cursor-pointer list-none place-items-center border border-line text-lg">
            ☰
          </summary>
          <nav className="absolute right-0 top-12 grid min-w-44 gap-1 border border-line bg-surface p-2 shadow-xl">
            {navigation.map((item) => (
              <Link prefetch={false} key={item.href} href={item.href} className="px-3 py-2 text-sm hover:bg-paper">
                {item.label}
              </Link>
            ))}
          </nav>
        </details>
      </div>
    </header>
  );
}
