"use client";

import { useEffect, useRef, useState } from "react";
import type { ECharts, EChartsOption } from "echarts";
import type { MonthlyPoint } from "@/lib/types";
import { formatInteger, formatMonthShort, formatUnitPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

export function TrendChart({
  points,
  height = 330,
  showVolume = true,
  className,
  ariaLabel = "成交单价和成交量趋势图",
}: {
  points: MonthlyPoint[];
  height?: number;
  showVolume?: boolean;
  className?: string;
  ariaLabel?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [chart, setChart] = useState<ECharts | null>(null);
  const published = points.filter((point) => point.status === "published");

  useEffect(() => {
    let disposed = false;
    let instance: ECharts | null = null;
    let observer: ResizeObserver | null = null;
    import("echarts").then((echarts) => {
      if (disposed || !ref.current) return;
      instance = echarts.init(ref.current, undefined, { renderer: "canvas" });
      const prices = points.map((point) =>
        point.status === "published" ? point.median_unit_price : null,
      );
      const volumes = points.map((point) =>
        point.status === "published" ? point.transaction_count : null,
      );
      const labels = points.map((point) => formatMonthShort(point.month));
      const option: EChartsOption = {
        animationDuration: 700,
        animationEasing: "cubicOut",
        color: ["#0e6b60", "#d8cfbe"],
        grid: {
          left: 8,
          right: showVolume ? 44 : 10,
          top: 28,
          bottom: 28,
          containLabel: true,
        },
        tooltip: {
          trigger: "axis",
          backgroundColor: "#17201f",
          borderWidth: 0,
          padding: [10, 12],
          textStyle: { color: "#fffdf8", fontSize: 11 },
          axisPointer: { type: "line", lineStyle: { color: "#8f9a95", type: "dashed" } },
          formatter: (value: unknown) => {
            const params = value as Array<{ dataIndex: number }>;
            const point = points[params[0]?.dataIndex ?? 0];
            if (!point) return "";
            if (point.status !== "published") {
              return `${point.month}<br/>${point.status === "insufficient_sample" ? "样本不足，未公开数值" : "暂无成交样本"}`;
            }
            return [
              `<strong>${point.month}</strong>`,
              `中位单价　${formatUnitPrice(point.median_unit_price)} 元/㎡`,
              `中位总价　${formatInteger(point.median_total_price)} 元`,
              `成交样本　${formatInteger(point.transaction_count)} 笔`,
              `来源数量　${formatInteger(point.source_count)} 个`,
            ].join("<br/>");
          },
        },
        xAxis: {
          type: "category",
          boundaryGap: showVolume,
          data: labels,
          axisLine: { lineStyle: { color: "#cfc5b4" } },
          axisTick: { show: false },
          axisLabel: {
            color: "#6e7671",
            fontSize: 9,
            interval: 3,
          },
        },
        yAxis: [
          {
            type: "value",
            scale: true,
            splitNumber: 4,
            axisLabel: {
              color: "#6e7671",
              fontSize: 9,
              formatter: (value: number) => `${Math.round(value / 1000)}k`,
            },
            splitLine: { lineStyle: { color: "#dfd6c8", type: "dashed" } },
          },
          {
            type: "value",
            show: showVolume,
            splitNumber: 2,
            axisLabel: { color: "#8f9189", fontSize: 9 },
            splitLine: { show: false },
          },
        ],
        series: [
          ...(showVolume
            ? [
                {
                  name: "成交样本",
                  type: "bar" as const,
                  yAxisIndex: 1,
                  data: volumes,
                  barMaxWidth: 8,
                  itemStyle: { color: "rgba(207, 197, 180, 0.62)" },
                  emphasis: { disabled: true },
                  tooltip: { show: false },
                },
              ]
            : []),
          {
            name: "中位成交单价",
            type: "line",
            data: prices,
            connectNulls: false,
            symbol: "circle",
            symbolSize: 5,
            showSymbol: true,
            smooth: 0.16,
            lineStyle: { width: 2, color: "#0e6b60" },
            itemStyle: { color: "#0e6b60" },
            areaStyle: {
              color: {
                type: "linear",
                x: 0,
                y: 0,
                x2: 0,
                y2: 1,
                colorStops: [
                  { offset: 0, color: "rgba(14,107,96,0.19)" },
                  { offset: 1, color: "rgba(14,107,96,0)" },
                ],
              },
            },
          },
        ],
      };
      instance.setOption(option);
      observer = new ResizeObserver(() => instance?.resize());
      observer.observe(ref.current);
      setChart(instance);
    });
    return () => {
      disposed = true;
      observer?.disconnect();
      instance?.dispose();
      setChart(null);
    };
  }, [points, showVolume]);

  if (!published.length) {
    return (
      <div
        className={cn("grid place-items-center border border-dashed border-line bg-surface/25 text-center", className)}
        style={{ height }}
      >
        <div>
          <p className="font-display text-lg text-ink-soft">等待更多成交样本</p>
          <p className="mt-2 text-[11px] text-muted">达到样本门槛后才会显示价格趋势，避免用单笔数据代表市场。</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={ref}
      role="img"
      aria-label={ariaLabel}
      className={cn("w-full", className)}
      style={{ height }}
      data-ready={chart ? "true" : "false"}
    />
  );
}
