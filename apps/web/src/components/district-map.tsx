"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import type { ECharts, EChartsOption } from "echarts";
import tianjinGeo from "@/data/tianjin.json";
import type { DistrictMeta, MonthlyPoint } from "@/lib/types";
import { formatUnitPrice } from "@/lib/format";

const targetDistrictNames = new Set([
  "和平区",
  "河东区",
  "河西区",
  "南开区",
  "河北区",
  "红桥区",
  "东丽区",
  "西青区",
  "津南区",
  "北辰区",
]);

const geojson = tianjinGeo as {
  type: "FeatureCollection";
  features: Array<{ type: "Feature"; properties?: { name?: string }; geometry: unknown }>;
};

const tianjinTenDistrictGeo = {
  type: "FeatureCollection",
  features: geojson.features.filter((feature) =>
    targetDistrictNames.has(feature.properties?.name ?? ""),
  ),
};

export function DistrictMap({
  districts,
}: {
  districts: Array<DistrictMeta & { latest_point: MonthlyPoint }>;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    let disposed = false;
    let chart: ECharts | null = null;
    let observer: ResizeObserver | null = null;
    import("echarts").then((echarts) => {
      if (disposed || !ref.current) return;
      echarts.registerMap("tianjin-ten", tianjinTenDistrictGeo as never);
      chart = echarts.init(ref.current, undefined, { renderer: "canvas" });
      const published = districts.filter((item) => item.latest_point.median_unit_price !== null);
      const values = published.map((item) => item.latest_point.median_unit_price ?? 0);
      const min = values.length ? Math.min(...values) : 0;
      const max = values.length ? Math.max(...values) : 1;
      const byName = new Map(districts.map((item) => [item.name, item]));
      const seriesData = published.map((item) => ({
        name: item.name,
        value: item.latest_point.median_unit_price as number,
      }));
      const option: EChartsOption = {
        animationDuration: 850,
        tooltip: {
          trigger: "item",
          backgroundColor: "#17201f",
          borderWidth: 0,
          padding: [10, 12],
          textStyle: { color: "#fffdf8", fontSize: 11 },
          formatter: (params: unknown) => {
            const item = params as { name: string; data?: { point?: MonthlyPoint } };
            const district = byName.get(item.name);
            if (!district) return item.name;
            const point = district.latest_point;
            if (point.median_unit_price === null) {
              return `<strong>${district.name}</strong><br/>${point.status === "insufficient_sample" ? "样本不足，暂不公开" : "暂无成交样本"}`;
            }
            return [
              `<strong>${district.name}</strong>`,
              `${point.month} 中位成交单价`,
              `<span style="font-size:16px;color:#a9d5c9">${formatUnitPrice(point.median_unit_price)}</span> 元/㎡`,
              `成交样本 ${point.transaction_count} 笔`,
            ].join("<br/>");
          },
        },
        visualMap: {
          show: values.length > 0,
          min,
          max: max === min ? min + 1 : max,
          left: 6,
          bottom: 10,
          itemWidth: 80,
          itemHeight: 6,
          text: ["高", "低"],
          calculable: false,
          textStyle: { color: "#6e7671", fontSize: 9 },
          inRange: { color: ["#e6e0d3", "#b9d1c8", "#6aa698", "#0e6b60"] },
        },
        series: [
          {
            type: "map",
            map: "tianjin-ten",
            roam: false,
            zoom: 1.05,
            selectedMode: false,
            top: 18,
            bottom: 20,
            left: 0,
            right: 0,
            itemStyle: {
              areaColor: "#ece5d8",
              borderColor: "#f5f0e7",
              borderWidth: 1.3,
            },
            label: {
              show: true,
              color: "#39433f",
              fontSize: 9,
              formatter: (params: { name?: string }) =>
                params.name?.replace("区", "") ?? "",
            },
            labelLayout: { hideOverlap: true },
            emphasis: {
              label: { color: "#16201d", fontWeight: 600 },
              itemStyle: { areaColor: "#d9b996", borderColor: "#ad5432", borderWidth: 1.5 },
            },
            data: seriesData,
          },
        ],
      };
      chart.setOption(option);
      chart.on("click", (params) => {
        const item = byName.get(String(params.name));
        if (item) router.push(`/districts/${item.slug}/`);
      });
      observer = new ResizeObserver(() => {
        if (
          !disposed &&
          chart &&
          !chart.isDisposed() &&
          ref.current?.isConnected
        ) {
          chart.resize();
        }
      });
      observer.observe(ref.current);
    });
    return () => {
      disposed = true;
      observer?.disconnect();
      chart?.dispose();
    };
  }, [districts, router]);

  return (
    <div
      ref={ref}
      role="img"
      aria-label="天津十区中位成交单价热度地图"
      className="h-[390px] w-full md:h-[440px]"
    />
  );
}
