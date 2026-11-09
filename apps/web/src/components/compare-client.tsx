"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ECharts, EChartsOption } from "echarts";
import type { CommunityObservation, MonthlyPoint, SearchEntry } from "@/lib/types";
import { basePath } from "@/lib/base-path";
import {
  formatInteger,
  formatMonthShort,
  formatPercent,
  formatUnitPrice,
} from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

interface CompareRecord {
  entry: SearchEntry;
  series: MonthlyPoint[];
  latest: MonthlyPoint;
  observation: CommunityObservation | null;
}

const COLORS = ["#0e6b60", "#ad5432", "#52718b"];

function dataPath(entry: SearchEntry): string {
  if (entry.type === "district") return `districts/${entry.id}.json`;
  const slug = entry.path.split("/").filter(Boolean).at(-1);
  return `communities/${slug}.json`;
}

export function CompareClient({
  entries,
  defaults,
  snapshotId,
}: {
  entries: SearchEntry[];
  defaults: SearchEntry[];
  snapshotId: string;
}) {
  const [selected, setSelected] = useState<SearchEntry[]>(defaults.slice(0, 3));
  const [records, setRecords] = useState<CompareRecord[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<ECharts | null>(null);

  const suggestions = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return [];
    const selectedIds = new Set(selected.map((entry) => `${entry.type}:${entry.id}`));
    return entries
      .filter((entry) => !selectedIds.has(`${entry.type}:${entry.id}`))
      .filter((entry) => `${entry.name} ${entry.subtitle}`.toLowerCase().includes(keyword))
      .slice(0, 8);
  }, [entries, query, selected]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const payload = await Promise.all(
          selected.map(async (entry) => {
            const response = await fetch(
              `${basePath}/data/${dataPath(entry)}?v=${encodeURIComponent(snapshotId)}`,
            );
            if (!response.ok) throw new Error(`无法加载 ${entry.name}`);
            const data = (await response.json()) as {
              series: MonthlyPoint[];
              latest: MonthlyPoint;
              observation?: CommunityObservation;
            };
            return {
              entry,
              series: data.series,
              latest: data.latest,
              observation: data.observation ?? null,
            };
          }),
        );
        if (!cancelled) setRecords(payload);
      } catch (caught) {
        if (!cancelled) setError(caught instanceof Error ? caught.message : "加载失败");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [selected, snapshotId]);

  useEffect(() => {
    let cancelled = false;
    let observer: ResizeObserver | null = null;
    if (!chartRef.current || !records.length) {
      chartInstance.current?.dispose();
      chartInstance.current = null;
      return;
    }
    import("echarts").then((echarts) => {
      if (cancelled || !chartRef.current) return;
      chartInstance.current?.dispose();
      const chart = echarts.init(chartRef.current, undefined, { renderer: "canvas" });
      chartInstance.current = chart;
      const months = records[0].series.map((point) => point.month);
      const option: EChartsOption = {
        animationDuration: 650,
        color: COLORS,
        grid: { left: 8, right: 12, top: 42, bottom: 28, containLabel: true },
        legend: {
          top: 2,
          right: 4,
          textStyle: { color: "#6e7671", fontSize: 10 },
          itemWidth: 16,
          itemHeight: 3,
        },
        tooltip: {
          trigger: "axis",
          backgroundColor: "#17201f",
          borderWidth: 0,
          padding: [10, 12],
          textStyle: { color: "#fffdf8", fontSize: 11 },
          formatter: (value: unknown) => {
            const params = value as Array<{ dataIndex: number }>;
            const month = months[params[0]?.dataIndex ?? 0];
            if (!month) return "";
            const rows = [`<strong>${month}</strong>`];
            for (const record of records) {
              const point = record.series.find((item) => item.month === month);
              rows.push(
                `${record.entry.name}　${
                  point?.status === "published"
                    ? `${formatUnitPrice(point.median_unit_price)} 元/㎡ · ${point.transaction_count} 笔`
                    : "样本不足"
                }`,
              );
            }
            return rows.join("<br/>");
          },
        },
        xAxis: {
          type: "category",
          boundaryGap: false,
          data: months.map(formatMonthShort),
          axisLine: { lineStyle: { color: "#cfc5b4" } },
          axisTick: { show: false },
          axisLabel: { color: "#6e7671", fontSize: 9, interval: 3 },
        },
        yAxis: {
          type: "value",
          scale: true,
          axisLabel: {
            color: "#6e7671",
            fontSize: 9,
            formatter: (value: number) => `${Math.round(value / 1000)}k`,
          },
          splitLine: { lineStyle: { color: "#dfd6c8", type: "dashed" } },
        },
        series: records.map((record) => ({
          name: record.entry.name,
          type: "line",
          data: record.series.map((point) =>
            point.status === "published" ? point.median_unit_price : null,
          ),
          connectNulls: false,
          showSymbol: true,
          symbolSize: 5,
          smooth: 0.16,
          lineStyle: { width: 2 },
        })),
      };
      chart.setOption(option);
      observer = new ResizeObserver(() => chart.resize());
      observer.observe(chartRef.current);
    });
    return () => {
      cancelled = true;
      observer?.disconnect();
      chartInstance.current?.dispose();
      chartInstance.current = null;
    };
  }, [records]);

  return (
    <div>
      <div className="grid gap-3 md:grid-cols-3">
        {selected.map((entry, index) => {
          const record = records.find((item) => item.entry.id === entry.id && item.entry.type === entry.type);
          const observation = record?.observation ?? null;
          const latest = record?.latest ?? null;
          const lowSample = observation ? observation.transaction_count < 3 : false;
          return (
            <Card key={`${entry.type}-${entry.id}`} className="relative min-h-36 p-5">
              <span
                className="mb-4 block h-0.5 w-9"
                style={{ backgroundColor: COLORS[index] }}
              />
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-display text-[19px]">{entry.name}</p>
                  <p className="mt-1 text-[10px] text-muted">{entry.subtitle}</p>
                </div>
                <button
                  onClick={() => setSelected((current) => current.filter((item) => item !== entry))}
                  className="text-[18px] leading-none text-muted hover:text-copper"
                  aria-label={`移除${entry.name}`}
                >
                  ×
                </button>
              </div>
              <p className="mt-5 flex items-end gap-1">
                <span className="metric-number text-[30px] leading-none">
                  {observation
                    ? formatUnitPrice(observation.median_unit_price)
                    : latest?.status === "published"
                      ? formatUnitPrice(latest.median_unit_price)
                      : "—"}
                </span>
                <span className="pb-1 text-[10px] text-muted">元/㎡</span>
              </p>
              <p className="mt-2 text-[10px] text-muted">
                {observation
                  ? `${observation.month} · ${observation.transaction_count} 笔${lowSample ? " · 低样本" : ""}`
                  : latest?.status === "published"
                    ? `${latest.month} · ${latest.transaction_count} 笔 · 环比 ${formatPercent(latest.mom_pct)}`
                    : "等待足够样本"}
              </p>
            </Card>
          );
        })}
        {selected.length < 3 && (
          <div className="relative border border-dashed border-line bg-surface/25 p-5">
            <p className="text-[10px] tracking-[0.12em] text-copper">ADD COMPARISON</p>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="搜索行政区或小区"
              className="mt-8 w-full border-0 border-b border-line bg-transparent pb-2 text-[13px] outline-none placeholder:text-muted/70"
            />
            {query.trim() && (
              <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-20 border border-line bg-surface p-2 shadow-2xl">
                {suggestions.length ? suggestions.map((entry) => (
                  <button
                    key={`${entry.type}-${entry.id}`}
                    onClick={() => {
                      setSelected((current) => [...current, entry].slice(0, 3));
                      setQuery("");
                    }}
                    className="block w-full px-3 py-3 text-left transition-colors hover:bg-paper"
                  >
                    <span className="block text-[12px]">{entry.name}</span>
                    <span className="mt-0.5 block text-[9px] text-muted">{entry.subtitle}</span>
                  </button>
                )) : <p className="px-3 py-4 text-[10px] text-muted">未找到已发布对象</p>}
              </div>
            )}
          </div>
        )}
      </div>

      <Card className="mt-4 p-5 md:p-7">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] tracking-[0.12em] text-muted">SAME TIME AXIS</p>
            <p className="mt-1 font-display text-xl">中位成交单价对照</p>
          </div>
          <Badge tone={loading ? "warning" : "neutral"}>{loading ? "读取中" : "元/㎡"}</Badge>
        </div>
        {error ? (
          <div className="grid h-80 place-items-center border border-dashed border-line text-[12px] text-copper">{error}</div>
        ) : records.length ? (
          <div ref={chartRef} className="h-[390px] w-full" role="img" aria-label="区域成交单价对比折线图" />
        ) : (
          <div className="grid h-80 place-items-center border border-dashed border-line text-[12px] text-muted">
            添加至少一个行政区或小区开始比较
          </div>
        )}
      </Card>

      {records.length > 0 && (
        <Card className="mt-4 overflow-x-auto p-2 md:p-4">
          <table className="data-table min-w-[660px]">
            <thead>
              <tr>
                <th>对象</th><th>最新月份</th><th className="text-right">中位单价</th>
                <th className="text-right">中位总价</th><th className="text-right">成交样本</th>
                <th className="text-right">来源数</th><th className="text-right">同比</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record) => {
                const observation = record.observation;
                const month = observation?.month ?? record.latest.month;
                const unitPrice = observation?.median_unit_price ?? record.latest.median_unit_price;
                const totalPrice = observation?.median_total_price ?? record.latest.median_total_price;
                const samples = observation?.transaction_count ?? record.latest.transaction_count;
                const sources = observation?.source_count ?? record.latest.source_count;
                return (
                  <tr key={`${record.entry.type}-${record.entry.id}`}>
                    <td><span className="font-medium">{record.entry.name}</span><br /><span className="text-[9px] text-muted">{record.entry.subtitle}</span></td>
                    <td className="font-mono text-[11px]">{month}</td>
                    <td className="text-right font-display text-[16px]">
                      {formatUnitPrice(unitPrice)}
                      {observation && observation.transaction_count < 3 && (
                        <span className="ml-2 text-[9px] text-warning">低样本</span>
                      )}
                    </td>
                    <td className="text-right font-mono text-[11px]">
                      {totalPrice ? `${(totalPrice / 10000).toFixed(0)}万` : "—"}
                    </td>
                    <td className="text-right font-mono text-[11px]">{formatInteger(samples)}</td>
                    <td className="text-right font-mono text-[11px]">{formatInteger(sources)}</td>
                    <td className="text-right font-mono text-[11px]">{formatPercent(record.latest.yoy_pct)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
