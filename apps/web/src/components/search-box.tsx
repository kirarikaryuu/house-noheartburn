"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { SearchEntry } from "@/lib/types";

export function SearchBox() {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [entries, setEntries] = useState<SearchEntry[]>([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (!focused || entries.length) return;
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
    const controller = new AbortController();
    setLoading(true);
    fetch(`${basePath}/data/search-index.json`, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json() as Promise<{ entries: SearchEntry[] }>;
      })
      .then((data) => setEntries(data.entries))
      .catch((error: unknown) => {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          console.error("搜索索引加载失败", error);
        }
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [entries.length, focused]);
  const results = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return [];
    return entries
      .filter((entry) => `${entry.name} ${entry.subtitle}`.toLowerCase().includes(keyword))
      .slice(0, 8);
  }, [entries, query]);

  return (
    <div className="relative w-full max-w-xl">
      <label className="sr-only" htmlFor="market-search">搜索行政区或小区</label>
      <div className="flex items-center gap-3 border border-line bg-surface/70 px-4 py-3 backdrop-blur">
        <span className="text-muted" aria-hidden>⌕</span>
        <input
          id="market-search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => window.setTimeout(() => setFocused(false), 150)}
          placeholder="搜索行政区、板块或小区"
          className="w-full bg-transparent text-[13px] text-ink outline-none placeholder:text-muted/70"
          autoComplete="off"
        />
        <span className="hidden text-[9px] tracking-[0.1em] text-muted sm:inline">SEARCH</span>
      </div>
      {focused && query.trim() && (
        <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-20 max-h-80 overflow-y-auto border border-line bg-surface p-2 shadow-2xl">
          {results.length ? (
            results.map((entry) => (
              <Link
                prefetch={false}
                key={`${entry.type}-${entry.id}`}
                href={entry.path}
                className="flex items-center justify-between gap-4 px-3 py-3 transition-colors hover:bg-paper"
              >
                <span>
                  <span className="block text-[13px]">{entry.name}</span>
                  <span className="mt-0.5 block text-[10px] text-muted">{entry.subtitle}</span>
                </span>
                <span className="text-[9px] text-copper">{entry.type === "district" ? "行政区" : "小区"}</span>
              </Link>
            ))
          ) : (
            <p className="px-3 py-5 text-center text-[11px] text-muted">
              {loading ? "正在加载搜索索引…" : "没有匹配的已发布数据"}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
