import Link from "next/link";
import type { DistrictMeta, MonthlyPoint } from "@/lib/types";
import { formatInteger, formatPercent, formatUnitPrice } from "@/lib/format";
import { Badge } from "@/components/ui/badge";

type DistrictRow = DistrictMeta & { latest_point: MonthlyPoint };

export function DistrictRanking({ districts, asOf }: { districts: DistrictRow[]; asOf: string | null }) {
  const sorted = [...districts].sort((left, right) => {
    const leftValue = left.latest_point.median_unit_price ?? -1;
    const rightValue = right.latest_point.median_unit_price ?? -1;
    return rightValue - leftValue;
  });
  return (
    <div className="overflow-x-auto">
      <table className="data-table min-w-[680px]">
        <thead>
          <tr>
            <th className="w-12">序号</th>
            <th>行政区</th>
            <th>所属片区</th>
            <th className="text-right">中位成交单价</th>
            <th className="text-right">环比</th>
            <th className="text-right">成交样本</th>
            <th className="text-right">来源数</th>
            <th className="w-10" />
          </tr>
        </thead>
        <tbody>
          {sorted.map((district, index) => {
            const point = district.latest_point;
            const published = point.status === "published";
            return (
              <tr key={district.code}>
                <td className="font-mono text-[10px] text-muted">{String(index + 1).padStart(2, "0")}</td>
                <td>
                  <Link prefetch={false} href={`/districts/${district.slug}/`} className="font-display text-[16px] hover:text-teal">
                    {district.name}
                  </Link>
                </td>
                <td className="text-muted">{district.group}</td>
                <td className="text-right">
                  {published ? (
                    <span className="font-display text-[18px]">{formatUnitPrice(point.median_unit_price)}</span>
                  ) : (
                    <Badge tone="warning">样本不足</Badge>
                  )}
                </td>
                <td className={`text-right font-mono text-[11px] ${point.mom_pct && point.mom_pct > 0 ? "text-copper" : "text-teal"}`}>
                  {published ? formatPercent(point.mom_pct) : "—"}
                </td>
                <td className="text-right font-mono text-[11px]">
                  {published ? formatInteger(point.transaction_count) : "—"}
                </td>
                <td className="text-right font-mono text-[11px]">
                  {published ? formatInteger(point.source_count) : "—"}
                </td>
                <td className="text-right text-teal">↗</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="mt-4 text-[10px] leading-5 text-muted">
        {asOf ? `${asOf} 最新公开月度` : "尚无公开月份"} · 按中位成交单价排序 · 样本不足的行政区不参与价格排序。
      </p>
    </div>
  );
}
