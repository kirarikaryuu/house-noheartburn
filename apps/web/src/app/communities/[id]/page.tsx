import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { CommunityTransactionTable } from "@/components/community-transaction-table";
import { DistributionBars } from "@/components/distribution-bars";
import { EmptyState } from "@/components/empty-state";
import { MetricCard } from "@/components/metric-card";
import { SectionHeading } from "@/components/section-heading";
import { TrendChart } from "@/components/trend-chart";
import { getCommunity, listCommunitySlugs } from "@/lib/data";
import { TARGET_DISTRICTS } from "@/lib/constants";
import {
  formatInteger,
  formatMonth,
  formatUnitPrice,
  formatWan,
  propertyUseLabel,
} from "@/lib/format";

export function generateStaticParams() {
  const slugs = listCommunitySlugs();
  return (slugs.length ? slugs : ["_empty"]).map((id) => ({ id }));
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const data = getCommunity(id);
  if (!data) return {};
  return {
    title: `${data.community.name}二手房成交趋势`,
    description: `${data.community.name}成交聚合与全部历史成交记录，包含中位单价、样本量、面积和总价分布。`,
  };
}

export default async function CommunityPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = getCommunity(id);
  if (!data) {
    if (id === "_empty") {
      return (
        <div className="page-shell pt-16">
          <div className="mx-auto max-w-3xl">
            <p className="eyebrow mb-3">COMMUNITY LEDGER</p>
            <h1 className="display-title text-[46px] md:text-[62px]">小区行情等待首批公开样本</h1>
            <div className="mt-8"><EmptyState /></div>
          </div>
        </div>
      );
    }
    notFound();
  }
  const observation = data.observation;
  const lowSample = observation.transaction_count < 3;
  const districtSlug = TARGET_DISTRICTS.find((item) => item.code === data.community.district_code)?.slug;

  return (
    <div className="page-shell pt-8 md:pt-12">
      <div className="mb-7 flex flex-wrap items-center gap-2 text-[10px] text-muted">
        <Link prefetch={false} href="/" className="hover:text-teal">城市总览</Link>
        <span>/</span>
        <Link prefetch={false} href={`/districts/${districtSlug || data.community.district_code}/`} className="hover:text-teal">
          {data.community.district_name}
        </Link>
        <span>/</span>
        <span>{data.community.submarket || "未分板块"}</span>
        <span>/</span>
        <span className="text-ink">{data.community.name}</span>
      </div>

      <section className="border-b border-line pb-10">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <Badge tone="teal">{data.community.district_name} · {data.community.submarket}</Badge>
            <h1 className="display-title mt-5 text-[48px] md:text-[68px]">{data.community.name}</h1>
            <p className="mt-5 max-w-2xl text-[13px] leading-7 text-ink-soft">
              展示最新成交参考价、单价区间和全部已审核成交记录。趋势线只使用至少 3 笔去重成交的月份；
              1–2 笔只作为低样本观察，不用于判断稳定趋势。公开记录不包含中介身份或原始截图。
            </p>
          </div>
          <div className="text-left lg:text-right">
            <p className="text-[10px] text-muted">最新公开月</p>
            <p className="mt-2 font-display text-2xl">{formatMonth(observation.month)}</p>
            <p className="mt-2 text-[10px] text-muted">
              {propertyUseLabel(data.community.property_use)} · 聚合与历史成交
            </p>
          </div>
        </div>
      </section>

      <section className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="成交参考单价"
          value={formatUnitPrice(observation.median_unit_price)}
          unit="元/㎡"
          hint={`${observation.month} · ${observation.transaction_count} 笔${lowSample ? " · 低样本" : ""}`}
          emphasis
        />
        <MetricCard label="成交参考总价" value={formatWan(observation.median_total_price)} hint="当月样本中位数" />
        <MetricCard
          label="单价区间"
          value={`${formatUnitPrice(observation.min_unit_price)}–${formatUnitPrice(observation.max_unit_price)}`}
          unit="元/㎡"
          hint={lowSample ? "样本少，仅作参考" : "当月最小到最大"}
          compact
        />
        <MetricCard
          label="成交样本"
          value={formatInteger(observation.transaction_count)}
          unit="笔"
          hint={`最新月 · 历史共 ${formatInteger(data.transactions.length)} 笔`}
        />
      </section>

      {lowSample && (
        <div className="mt-4 border-l-2 border-copper bg-copper-soft/55 p-4 text-[11px] leading-6 text-ink-soft">
          该小区当月只有 {observation.transaction_count} 笔去重成交。价格只反映这几笔，
          不能代表小区整体均价；达到 3 笔后才生成趋势线。
        </div>
      )}

      <section className="mt-12">
        <Card className="p-5 md:p-7">
          <SectionHeading
            eyebrow="TRANSACTION LEDGER"
            title="历史成交记录"
            description="列出该小区全部已审核、已去重的成交明细。不同中介重复发布同一笔成交时只保留一条。"
          />
          <CommunityTransactionTable transactions={data.transactions} />
        </Card>
      </section>

      <section className="mt-12 grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
        <Card className="p-5 md:p-7">
          <SectionHeading
            eyebrow="SETTLEMENT TREND"
            title="成交价格趋势"
            description="只连接达到 3 笔门槛的月份；低样本月份不画线，也不做插值。"
          />
          <TrendChart points={data.series} height={360} ariaLabel={`${data.community.name}成交价格趋势`} />
        </Card>
        <Card className="p-5 md:p-7">
          <SectionHeading eyebrow="SAMPLE NOTE" title="如何读这条线" />
          <div className="space-y-4 text-[12px] leading-6 text-ink-soft">
            <p>中位单价来自单套成交的“成交总价 ÷ 面积”，不是挂牌价，也不是小区均价。</p>
            <p>同一小区可能包含不同楼龄、楼层和装修情况。趋势用于观察方向，不用于给单套房源定价。</p>
            <p>来源数量表示不同中介账号，不代表独立核验机构。请结合数据方法与覆盖面判断。</p>
          </div>
          <div className="mt-6 border-t border-line pt-5">
            <p className="text-[10px] text-muted">最近更新时间</p>
            <p className="mt-1 font-mono text-[11px]">{observation.month}</p>
          </div>
        </Card>
      </section>

      <section className="mt-12 grid gap-4 lg:grid-cols-2">
        <Card className="p-5 md:p-7"><DistributionBars title="成交面积结构" bucket={data.distribution.area} /></Card>
        <Card className="p-5 md:p-7"><DistributionBars title="成交总价结构" bucket={data.distribution.total_price} /></Card>
      </section>
    </div>
  );
}
