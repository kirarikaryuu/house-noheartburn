import type { MonthlyPoint, PointStatus, PropertyUse } from "@/lib/types";

const integerFormatter = new Intl.NumberFormat("zh-CN");

export function formatInteger(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return integerFormatter.format(value);
}

export function formatUnitPrice(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return `${integerFormatter.format(value)}`;
}

export function formatWan(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return `${(value / 10000).toLocaleString("zh-CN", {
    maximumFractionDigits: 1,
    minimumFractionDigits: value % 10000 === 0 ? 0 : 1,
  })} 万`;
}

export function formatPercent(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return `${value > 0 ? "+" : ""}${value.toFixed(1)}%`;
}

export function formatMonth(value: string | null | undefined): string {
  if (!value) return "待发布";
  const [year, month] = value.split("-");
  return `${year} 年 ${Number(month)} 月`;
}

export function formatMonthShort(value: string): string {
  const [year, month] = value.split("-");
  return `${year.slice(2)}.${month}`;
}

export function pointStatusLabel(status: PointStatus): string {
  if (status === "published") return "已发布";
  if (status === "insufficient_sample") return "样本不足";
  return "暂无数据";
}

export function propertyUseLabel(value: PropertyUse): string {
  if (value === "residential") return "住宅";
  if (value === "commercial") return "商业";
  if (value === "other") return "其他";
  return "产权待核";
}

export function latestPublishedPoint(points: MonthlyPoint[]): MonthlyPoint | null {
  return [...points].reverse().find((point) => point.status === "published") ?? null;
}

export function changeSinceMonths(
  series: MonthlyPoint[],
  months: number,
): number | null {
  const published = series.filter((point) => point.status === "published");
  if (published.length < 2) return null;
  const latest = published.at(-1);
  if (!latest) return null;
  const targetIndex =
    latest.month
      .split("-")
      .reduce((total, part, index) => (index === 0 ? Number(part) * 12 : total + Number(part)), 0) -
    months;
  const target = published.find((point) => {
    const [year, month] = point.month.split("-").map(Number);
    return year * 12 + month === targetIndex;
  });
  if (!target || target.median_unit_price === null || latest.median_unit_price === null) {
    return null;
  }
  return Number(
    (((latest.median_unit_price - target.median_unit_price) / target.median_unit_price) * 100).toFixed(1),
  );
}

