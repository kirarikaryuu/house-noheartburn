"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { TablePagination } from "@/components/table-pagination";
import { TARGET_DISTRICTS } from "@/lib/constants";
import type { CommunityObservation, MonthlyPoint, PropertyUse } from "@/lib/types";
import {
  formatInteger,
  formatUnitPrice,
  formatWan,
  propertyUseLabel,
} from "@/lib/format";

export interface CommunityPriceRow {
  id: string;
  slug: string;
  name: string;
  district_name: string;
  submarket: string;
  property_use: PropertyUse;
  latest: MonthlyPoint;
  observation: CommunityObservation;
  history_count: number;
}

type SampleFilter = "all" | "stable" | "low";
type SortMode = "price_desc" | "price_asc" | "samples_desc" | "name_asc";

const PAGE_SIZE = 30;

const selectClass =
  "h-10 min-w-0 border border-line bg-surface px-3 text-[11px] text-ink outline-none focus:border-teal";

export function CommunityPriceTable() {
  const [communities, setCommunities] = useState<CommunityPriceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [district, setDistrict] = useState("all");
  const [submarket, setSubmarket] = useState("all");
  const [sample, setSample] = useState<SampleFilter>("all");
  const [propertyUse, setPropertyUse] = useState<"all" | PropertyUse>("all");
  const [sortMode, setSortMode] = useState<SortMode>("price_desc");
  const [page, setPage] = useState(1);
  const tableTopRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
    const controller = new AbortController();
    fetch(`${basePath}/data/community-index.json`, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json() as Promise<CommunityPriceRow[]>;
      })
      .then(setCommunities)
      .catch((error: unknown) => {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          console.error("小区索引加载失败", error);
        }
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, []);

  const districtCounts = useMemo(
    () =>
      new Map<string, number>(
        TARGET_DISTRICTS.map((item) => [
          item.name,
          communities.filter((community) => community.district_name === item.name).length,
        ] as const),
      ),
    [communities],
  );
  const submarkets = useMemo(
    () =>
      [...communities
        .filter((item) => district === "all" || item.district_name === district)
        .reduce((counts, item) => {
          const name = item.submarket || "未分板块";
          counts.set(name, (counts.get(name) ?? 0) + 1);
          return counts;
        }, new Map<string, number>())
        .entries()]
        .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0], "zh-CN")),
    [communities, district],
  );
  const propertyUses = useMemo(
    () => [...new Set(communities.map((item) => item.property_use))],
    [communities],
  );

  const rows = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return communities
      .filter((item) => {
        if (district !== "all" && item.district_name !== district) return false;
        if (submarket !== "all" && (item.submarket || "未分板块") !== submarket) return false;
        if (propertyUse !== "all" && item.property_use !== propertyUse) return false;
        if (sample === "stable" && item.history_count < 3) return false;
        if (sample === "low" && item.history_count >= 3) return false;
        if (!keyword) return true;
        return `${item.name} ${item.district_name} ${item.submarket}`
          .toLowerCase()
          .includes(keyword);
      })
      .sort((left, right) => {
        if (sortMode === "price_asc") {
          return left.observation.median_unit_price - right.observation.median_unit_price;
        }
        if (sortMode === "samples_desc") {
          return (
            right.history_count - left.history_count ||
            right.observation.median_unit_price - left.observation.median_unit_price
          );
        }
        if (sortMode === "name_asc") {
          return left.name.localeCompare(right.name, "zh-CN");
        }
        return right.observation.median_unit_price - left.observation.median_unit_price;
      });
  }, [communities, district, propertyUse, query, sample, sortMode, submarket]);

  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageRows = rows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [query, district, submarket, sample, propertyUse, sortMode]);

  const changePage = (nextPage: number) => {
    setPage(nextPage);
    window.requestAnimationFrame(() => {
      tableTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const resetFilters = () => {
    setQuery("");
    setDistrict("all");
    setSubmarket("all");
    setSample("all");
    setPropertyUse("all");
    setSortMode("price_desc");
  };

  const changeDistrict = (name: string) => {
    setDistrict(name);
    setSubmarket("all");
  };

  return (
    <div>
      <div className="mb-4 grid gap-2 lg:grid-cols-2 xl:grid-cols-[minmax(180px,1fr)_repeat(5,minmax(108px,auto))]">
        <label className="sr-only" htmlFor="community-table-search">
          筛选小区
        </label>
        <input
          id="community-table-search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="筛选小区或板块，例如：大王庄"
          className="h-10 border border-line bg-surface px-3 text-[12px] text-ink outline-none placeholder:text-muted/70 focus:border-teal"
        />
        <select
          aria-label="按行政区筛选"
          value={district}
          onChange={(event) => changeDistrict(event.target.value)}
          className={selectClass}
        >
          <option value="all">全部行政区</option>
          {TARGET_DISTRICTS.map((item) => (
            <option key={item.code} value={item.name}>
              {item.name} · {districtCounts.get(item.name) ?? 0} 个小区
            </option>
          ))}
        </select>
        <select
          aria-label="按板块筛选"
          value={submarket}
          onChange={(event) => setSubmarket(event.target.value)}
          className={selectClass}
        >
          <option value="all">全部板块</option>
          {submarkets.map(([name, count]) => (
            <option key={name} value={name}>
              {name} · {count} 个小区
            </option>
          ))}
        </select>
        <select
          aria-label="按样本量筛选"
          value={sample}
          onChange={(event) => setSample(event.target.value as SampleFilter)}
          className={selectClass}
        >
          <option value="all">全部样本</option>
          <option value="stable">历史 3 笔及以上</option>
          <option value="low">历史 1–2 笔</option>
        </select>
        <select
          aria-label="按产权状态筛选"
          value={propertyUse}
          onChange={(event) => setPropertyUse(event.target.value as "all" | PropertyUse)}
          className={selectClass}
        >
          <option value="all">全部产权状态</option>
          {propertyUses.map((value) => (
            <option key={value} value={value}>{propertyUseLabel(value)}</option>
          ))}
        </select>
        <select
          aria-label="排序方式"
          value={sortMode}
          onChange={(event) => setSortMode(event.target.value as SortMode)}
          className={selectClass}
        >
          <option value="price_desc">单价从高到低</option>
          <option value="price_asc">单价从低到高</option>
          <option value="samples_desc">样本量从多到少</option>
          <option value="name_asc">按小区名排序</option>
        </select>
      </div>

      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-[10px] text-muted">
        <span>
          筛选出 <span className="font-mono text-ink">{rows.length}</span> / {communities.length} 个小区
        </span>
        <button type="button" onClick={resetFilters} className="text-teal hover:text-copper">
          重置筛选
        </button>
      </div>

      {rows.length ? (
        <div ref={tableTopRef} className="scroll-mt-24 overflow-x-auto">
          <table className="data-table w-full min-w-[1040px] table-fixed">
            <colgroup>
              <col className="w-[20%]" />
              <col className="w-[17%]" />
              <col className="w-[8%]" />
              <col className="w-[12%]" />
              <col className="w-[15%]" />
              <col className="w-[10%]" />
              <col className="w-[9%]" />
              <col className="w-[9%]" />
            </colgroup>
            <thead>
              <tr>
                <th>小区</th>
                <th>行政区 / 板块</th>
                <th className="text-right">月份</th>
                <th className="text-right">成交参考单价</th>
                <th className="text-right">单价区间</th>
                <th className="text-right">参考总价</th>
                <th className="text-right">样本</th>
                <th className="text-right">读数</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map((community) => {
                const observation = community.observation;
                const lowSample = observation.transaction_count < 3;
                return (
                  <tr key={community.id}>
                    <td className="min-w-0">
                      <Link
                        prefetch={false}
                        href={`/communities/${community.slug}/`}
                        className="block truncate font-display text-[16px] hover:text-teal"
                        title={community.name}
                      >
                        {community.name}
                      </Link>
                      <span className="mt-0.5 block truncate text-[9px] text-muted">
                        {propertyUseLabel(community.property_use)}
                      </span>
                    </td>
                    <td className="min-w-0 text-muted">
                      <span className="block truncate">{community.district_name}</span>
                      <span className="mt-0.5 block truncate text-[9px]">
                        {community.submarket || "未分板块"}
                      </span>
                    </td>
                    <td className="whitespace-nowrap text-right font-mono text-[10px] text-muted">
                      {observation.month}
                    </td>
                    <td className="whitespace-nowrap text-right tabular-nums">
                      <span className="font-display text-[18px]">
                        {formatUnitPrice(observation.median_unit_price)}
                      </span>
                      <span className="ml-1 text-[9px] text-muted">元/㎡</span>
                    </td>
                    <td className="whitespace-nowrap text-right font-mono text-[10px] tabular-nums text-muted">
                      {formatUnitPrice(observation.min_unit_price)}–
                      {formatUnitPrice(observation.max_unit_price)}
                    </td>
                    <td className="whitespace-nowrap text-right font-mono text-[11px] tabular-nums">
                      {formatWan(observation.median_total_price)}
                    </td>
                    <td className="whitespace-nowrap text-right font-mono text-[11px] tabular-nums">
                      <span className="block">{formatInteger(observation.transaction_count)} 笔</span>
                      <span className="mt-0.5 block text-[9px] text-muted">
                        历史 {formatInteger(community.history_count)}
                      </span>
                    </td>
                    <td className="text-right">
                      <Badge tone={lowSample ? "warning" : "teal"}>
                        {lowSample ? "低样本" : "可看趋势"}
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="border border-dashed border-line bg-surface/25 px-5 py-12 text-center">
          <p className="font-display text-lg text-ink-soft">
            {loading
              ? "正在加载小区成交索引…"
              : district !== "all" && (districtCounts.get(district) ?? 0) === 0
              ? `${district}暂时没有已公开的成交数据`
              : "没有符合筛选条件的小区"}
          </p>
          {district !== "all" && (districtCounts.get(district) ?? 0) === 0 && (
            <p className="mt-2 text-[11px] leading-6 text-muted">
              不是前端筛掉了数据，而是还没有导入该区的公开成交图集。
            </p>
          )}
          <button type="button" onClick={resetFilters} className="mt-3 text-[11px] text-teal">
            清除筛选条件
          </button>
        </div>
      )}

      <TablePagination
        page={currentPage}
        pageCount={pageCount}
        total={rows.length}
        pageSize={PAGE_SIZE}
        onPageChange={changePage}
        itemLabel="个小区"
      />

      <p className="mt-4 text-[10px] leading-5 text-muted">
        成交参考价是该小区最近一个有成交月份的去重中位数；单价区间为当月最小到最大。
        1–2 笔仅用于了解成交落点，不能代表小区均价；样本筛选按历史成交总量。
      </p>
    </div>
  );
}
