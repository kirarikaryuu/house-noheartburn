import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { DistributionBars } from "@/components/distribution-bars";
import { EmptyState } from "@/components/empty-state";
import { MetricCard } from "@/components/metric-card";
import { SectionHeading } from "@/components/section-heading";
import { TrendChart } from "@/components/trend-chart";
import { getDistrictBySlug, getOverview, listDistrictSlugs } from "@/lib/data";
import {
  changeSinceMonths,
  formatInteger,
  formatMonth,
  formatPercent,
  formatUnitPrice,
  formatWan,
  pointStatusLabel,
  propertyUseLabel,
} from "@/lib/format";

export function generateStaticParams() {
  return listDistrictSlugs().map((slug) => ({ code: slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ code: string }>;
}): Promise<Metadata> {
  const { code: slug } = await params;
  const data = getDistrictBySlug(slug);
  if (!data) return {};
  return {
    title: `${data.district.name}二手房成交趋势`,
    description: `${data.district.name}近 24 个月中介公开成交记录聚合，展示中位成交单价、成交量、板块和小区排行。`,
  };
}

export default async function DistrictPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code: slug } = await params;
  const data = getDistrictBySlug(slug);
  const overview = getOverview();
  if (!data) notFound();
  const latest = data.latest;
  const published = latest.status === "published";
  const districtOverview = overview.districts.find((item) => item.code === data.district.code);
  const topCommunities = [...data.communities].slice(0, 40);
  const noData = !data.series.some((point) => point.status === "published");

  return (
    <div className="page-shell pt-8 md:pt-12">
      <div className="mb-7 flex items-center gap-2 text-[10px] text-muted">
        <Link prefetch={false} href="/" className="hover:text-teal">城市总览</Link>
        <span>/</span>
        <span>{districtOverview?.group ?? data.district.group}</span>
        <span>/</span>
        <span className="text-ink">{data.district.name}</span>
      </div>

      <section className="border-b border-line pb-10">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-4 flex items-center gap-3">
              <Badge tone="teal">{data.district.group}</Badge>
              <span className="text-[10px] text-muted">{formatMonth(data.as_of)} · 近 24 个月</span>
            </div>
            <h1 className="display-title text-[52px] md:text-[72px]">{data.district.name}</h1>
            <p className="mt-5 max-w-2xl text-[13px] leading-7 text-ink-soft">
              统计范围不再按产权查询结果拦截；已审核成交都会进入小区统计，商业或产权待核会单独标记。
              趋势只展示达到 3 笔门槛的月份；1–2 笔的小区仍列出成交参考价和区间。
            </p>
          </div>
          <div className="grid grid-cols-3 gap-6 lg:min-w-[430px]">
            <div>
              <p className="text-[10px] text-muted">3 个月</p>
              <p className="mt-2 font-display text-[26px]">{formatPercent(changeSinceMonths(data.series, 3))}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted">6 个月</p>
              <p className="mt-2 font-display text-[26px]">{formatPercent(changeSinceMonths(data.series, 6))}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted">12 个月</p>
              <p className="mt-2 font-display text-[26px]">{formatPercent(changeSinceMonths(data.series, 12))}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="最新中位成交单价"
          value={published ? formatUnitPrice(latest.median_unit_price) : "—"}
          unit="元/㎡"
          hint={published ? `${latest.month} · 样本 ${latest.transaction_count} 笔` : pointStatusLabel(latest.status)}
          emphasis
        />
        <MetricCard label="中位成交总价" value={published ? formatWan(latest.median_total_price) : "—"} hint="总价中位数" />
        <MetricCard label="成交样本" value={published ? formatInteger(latest.transaction_count) : "—"} unit="笔" hint="已去重确认成交" />
        <MetricCard label="数据来源" value={published ? formatInteger(latest.source_count) : "—"} unit="个" hint="不同中介账号，非独立核验" />
      </section>

      {noData ? (
        <section className="mt-12"><EmptyState title={`${data.district.name}还没有可公开的月度样本`} /></section>
      ) : (
        <>
          <section className="mt-12 grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
            <Card className="p-5 md:p-7">
              <SectionHeading
                eyebrow="PRICE TREND"
                title="中位成交单价走势"
                description="样本少于 5 笔的月份留空；折线不代表所有房源，也不对缺失月份做插值。"
              />
              <TrendChart points={data.series} height={370} ariaLabel={`${data.district.name}近24个月成交中位单价`} />
            </Card>
            <Card className="p-5 md:p-7">
              <SectionHeading eyebrow="PROFILE" title="当前读数" />
              <dl className="divide-y divide-line text-[12px]">
                <div className="flex items-center justify-between py-4">
                  <dt className="text-muted">公开板块</dt>
                  <dd className="font-mono">{data.submarkets.length}</dd>
                </div>
                <div className="flex items-center justify-between py-4">
                  <dt className="text-muted">公开小区</dt>
                  <dd className="font-mono">{data.communities.length}</dd>
                </div>
                <div className="flex items-center justify-between py-4">
                  <dt className="text-muted">最近数据</dt>
                  <dd className="font-mono">{formatMonth(data.as_of)}</dd>
                </div>
              </dl>
              <div className="mt-5 border-l-2 border-copper bg-copper-soft/55 p-4 text-[11px] leading-6 text-ink-soft">
                一个来源可能转载同一张表。公开页展示的是去重成交，不是对全市场成交量的完整统计。
              </div>
            </Card>
          </section>

          <section className="mt-12 grid gap-4 lg:grid-cols-2">
            <Card className="p-5 md:p-7">
              <SectionHeading eyebrow="MICRO MARKETS" title="板块概览" />
              {data.submarkets.length ? (
                <div className="overflow-x-auto">
                  <table className="data-table min-w-[480px]">
                    <thead>
                      <tr><th>板块</th><th className="text-right">中位单价</th><th className="text-right">样本</th><th className="text-right">环比</th></tr>
                    </thead>
                    <tbody>
                      {data.submarkets.slice(0, 15).map((submarket) => (
                        <tr key={submarket.name}>
                          <td>{submarket.name}</td>
                          <td className="text-right font-display text-[16px]">{formatUnitPrice(submarket.latest.median_unit_price)}</td>
                          <td className="text-right font-mono text-[11px]">{submarket.latest.transaction_count}</td>
                          <td className="text-right font-mono text-[11px]">{formatPercent(submarket.latest.mom_pct)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : <EmptyState title="板块样本尚未达到公开门槛" />}
            </Card>
            <Card className="p-5 md:p-7">
              <SectionHeading eyebrow="COMMUNITIES" title="小区排行" />
              {topCommunities.length ? (
                <div className="overflow-x-auto">
                  <table className="data-table min-w-[540px]">
                    <thead>
                      <tr><th>小区</th><th>板块</th><th>产权</th><th className="text-right">中位单价</th><th className="text-right">样本</th></tr>
                    </thead>
                    <tbody>
                      {topCommunities.map((community) => (
                        <tr key={community.id}>
                          <td>
                            <Link prefetch={false} href={`/communities/?id=${encodeURIComponent(community.slug)}`} className="font-medium hover:text-teal">
                              {community.name}
                            </Link>
                          </td>
                          <td className="text-muted">{community.submarket || "—"}</td>
                          <td className="text-[10px] text-muted">
                            {propertyUseLabel(community.property_use)}
                          </td>
                          <td className="text-right font-display text-[16px]">
                            {formatUnitPrice(community.observation.median_unit_price)}
                          </td>
                          <td className="text-right">
                            <span className="font-mono text-[11px]">{community.observation.transaction_count}</span>
                            {community.observation.transaction_count < 3 && (
                              <span className="ml-2 text-[9px] text-warning">低样本</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : <EmptyState title="小区样本尚未达到公开门槛" />}
            </Card>
          </section>

          <section className="mt-12 grid gap-4 lg:grid-cols-2">
            <Card className="p-5 md:p-7"><DistributionBars title="成交面积结构" bucket={data.distribution.area} /></Card>
            <Card className="p-5 md:p-7"><DistributionBars title="成交总价结构" bucket={data.distribution.total_price} /></Card>
          </section>
        </>
      )}
    </div>
  );
}
