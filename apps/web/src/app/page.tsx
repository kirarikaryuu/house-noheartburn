import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { CommunityPriceTable } from "@/components/community-price-table";
import { CoverageMeter } from "@/components/coverage-meter";
import { DistrictMap } from "@/components/district-map";
import { EmptyState } from "@/components/empty-state";
import { MetricCard } from "@/components/metric-card";
import { SearchBox } from "@/components/search-box";
import { SectionHeading } from "@/components/section-heading";
import { TrendChart } from "@/components/trend-chart";
import {
  getCoverage,
  getManifest,
  getOverview,
} from "@/lib/data";
import {
  formatInteger,
  formatMonth,
  formatPercent,
  formatUnitPrice,
  latestPublishedPoint,
} from "@/lib/format";

export default function HomePage() {
  const manifest = getManifest();
  const overview = getOverview();
  const coverage = getCoverage();
  const latest = latestPublishedPoint(overview.city_series) ?? overview.city_series.at(-1) ?? null;
  const hasData = Boolean(manifest.as_of && latest?.status === "published");
  const latestCoverage = overview.summary.district_count
    ? Math.round((overview.summary.published_district_count / overview.summary.district_count) * 100)
    : 0;
  const missingLatestDistricts = overview.districts
    .filter((district) => district.latest_point.status !== "published")
    .map((district) => district.name);

  return (
    <div className="grain pb-8">
      <section className="page-shell pt-10 md:pt-16">
        <div className="grid gap-10 border-b border-line pb-10 lg:grid-cols-[1.25fr_0.75fr] lg:items-end">
          <div>
            <div className="mb-5 flex flex-wrap items-center gap-3">
              <Badge tone="teal">市内六区 + 环城四区</Badge>
              <span className="text-[10px] tracking-[0.08em] text-muted">
                {manifest.as_of ? `数据月份 ${manifest.as_of}` : "等待首次数据发布"}
              </span>
            </div>
            <h1 className="display-title max-w-3xl text-[48px] sm:text-[64px] lg:text-[78px]">
              看见真实的
              <br />
              <span className="text-teal">天津二手房</span>
            </h1>
            <p className="mt-6 max-w-xl text-[13px] leading-7 text-ink-soft">
              不展示挂牌噱头，也不拿单笔成交代表市场。我们把中介公开发布的成交表逐套识别、自动校验、去重，再以中位数呈现价格刻度。
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <ButtonLink href="#community-prices" variant="solid">查看小区成交价 →</ButtonLink>
              <ButtonLink href="/methodology/" variant="outline">数据怎么来的</ButtonLink>
            </div>
            <div className="mt-8 max-w-xl">
              <SearchBox />
            </div>
          </div>

          <Card className="relative overflow-hidden p-6">
            <span className="absolute -right-4 -top-8 font-display text-[126px] leading-none text-paper-deep/75">
              房
            </span>
            <p className="eyebrow relative">CURRENT READING</p>
            <div className="relative mt-8 flex items-end justify-between gap-6 border-b border-line pb-6">
              <div>
                <p className="text-[10px] text-muted">全城中位成交单价</p>
                <p className="mt-2 flex items-end gap-2">
                  <span className="metric-number text-[52px] leading-none">
                    {hasData ? formatUnitPrice(latest?.median_unit_price) : "—"}
                  </span>
                  <span className="pb-1 text-[11px] text-muted">元/㎡</span>
                </p>
              </div>
              <Badge tone={latest?.mom_pct && latest.mom_pct > 0 ? "copper" : "teal"}>
                {hasData ? `环比 ${formatPercent(latest?.mom_pct)}` : "样本待积累"}
              </Badge>
            </div>
            <div className="relative mt-5 grid grid-cols-2 gap-x-6 gap-y-5 text-[11px]">
              <div>
                <p className="text-muted">公开行政区</p>
                <p className="mt-1 font-display text-[24px]">
                  {overview.summary.published_district_count}
                  <span className="ml-1 font-sans text-[10px] text-muted">/ {overview.summary.district_count}</span>
                </p>
              </div>
              <div>
                <p className="text-muted">样本覆盖</p>
                <p className="mt-1 font-display text-[24px]">{latestCoverage}%</p>
              </div>
              <div>
                <p className="text-muted">小区成交参考</p>
                <p className="mt-1 font-display text-[24px]">{formatInteger(overview.summary.community_count)}</p>
              </div>
              <div>
                <p className="text-muted">最近发布</p>
                <p className="mt-1 text-[12px]">{formatMonth(manifest.as_of)}</p>
              </div>
            </div>
            <p className="relative mt-6 border-t border-line pt-4 text-[10px] leading-5 text-muted">
              公开值均为成交明细去重后的统计中位数，不代表官方网签均价。
            </p>
          </Card>
        </div>
      </section>

      <section className="page-shell mt-8">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            label="全城中位成交单价"
            value={hasData ? formatUnitPrice(latest?.median_unit_price) : "—"}
            unit="元/㎡"
            hint={hasData ? `${latest?.month} · 覆盖 ${latest?.source_count} 个来源` : "等待达到 5 笔公开样本"}
            emphasis
          />
          <MetricCard
            label="月度成交样本"
            value={hasData ? formatInteger(latest?.transaction_count) : "—"}
            unit="笔"
            hint="经跨来源去重后的成交记录"
          />
          <MetricCard
            label="中位成交总价"
            value={hasData ? (latest?.median_total_price ? (latest.median_total_price / 10000).toFixed(0) : "—") : "—"}
            unit="万元"
            hint="按单套成交总价计算中位数"
          />
          <MetricCard
            label="有成交参考的小区"
            value={formatInteger(overview.summary.community_count)}
            unit="个"
            hint={`${overview.summary.published_community_count} 个达到 3 笔趋势门槛`}
          />
        </div>
      </section>

      <section id="community-prices" className="page-shell mt-16 scroll-mt-24">
        <SectionHeading
          eyebrow="COMMUNITY QUOTES"
          title="先看每个小区，成交价落在哪"
          description="这里列出所有已审核成交的小区，不再让产权查询阻断统计。最新月 1–2 笔为低样本参考，3 笔以上才进入趋势判断；样本筛选按全部历史成交笔数，详情页可查看每套记录。"
        />
        {missingLatestDistricts.length > 0 && (
          <div className="mb-4 border-l-2 border-copper bg-copper-soft/55 px-4 py-3 text-[11px] leading-6 text-ink-soft">
            最新月份 <strong>{missingLatestDistricts.join("、")}</strong>
            暂无达到样本门槛的成交，因此不生成当月价格；这些区的历史成交仍保留并可查看。
            页面不会插值，也不会用低样本强行给出趋势。
          </div>
        )}
        <Card className="p-5 md:p-7">
          <CommunityPriceTable />
        </Card>
      </section>

      <section className="page-shell mt-16">
        <SectionHeading
          eyebrow="MARKET PULSE"
          title="价格，不只看一个点"
          description="折线只连接达到公开门槛的月份；样本不足或没有数据的月份留空，不用插值制造连续趋势。"
          href="/methodology/"
          action="阅读统计口径"
        />
        <div className="grid gap-4 lg:grid-cols-[1.08fr_0.92fr]">
          <Card className="p-5 md:p-7">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[10px] tracking-[0.1em] text-muted">全城 · 近 24 个月</p>
                <p className="mt-1 font-display text-xl">成交中位单价与样本量</p>
              </div>
              <Badge tone="neutral">中位数 · 元/㎡</Badge>
            </div>
            <TrendChart points={overview.city_series} height={352} ariaLabel="全城近24个月成交中位单价与样本量" />
          </Card>
          <Card className="relative overflow-hidden p-4 md:p-6">
            <div className="mb-2 flex items-start justify-between">
              <div>
                <p className="text-[10px] tracking-[0.1em] text-muted">SPATIAL VIEW</p>
                <p className="mt-1 font-display text-xl">十区成交价位</p>
              </div>
              <span className="font-mono text-[9px] text-muted">2026 · TIANJIN</span>
            </div>
            <DistrictMap districts={overview.districts} />
            <p className="absolute bottom-4 right-5 text-[9px] tracking-[0.1em] text-muted">
              点击行政区查看详情
            </p>
          </Card>
        </div>
      </section>

      <section className="page-shell mt-16">
        <div className="grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
          <Card className="min-w-0 p-5 md:p-7">
            <SectionHeading
              eyebrow="COVERAGE"
              title="数据覆盖也是一条结论"
              description="一块方格代表一个行政区的一个月。样本少时不强行给价格，缺口本身就是需要补采的信息。"
            />
            <CoverageMeter coverage={coverage} />
          </Card>
          <Card className="flex min-w-0 flex-col justify-between bg-ink p-6 text-paper md:p-8">
            <div>
              <p className="text-[9px] tracking-[0.2em] text-[#9eb5ae]">READING NOTE</p>
              <p className="mt-5 font-display text-[30px] leading-[1.35]">
                用中位数看趋势，
                <br />
                用样本量决定是否相信。
              </p>
              <p className="mt-5 text-[11px] leading-6 text-[#b7c3be]">
                同一笔成交可能被多个中介转发。我们用小区、日期、面积、楼层、户型和总价做证据合并；只有价格冲突或严重偏离会进入异常队列。
              </p>
            </div>
            <Link prefetch={false} href="/methodology/" className="mt-10 text-[11px] text-[#d8e8e2] hover:text-white">
              数据来源、清洗和局限 →
            </Link>
          </Card>
        </div>
      </section>

      {!hasData && (
        <section className="page-shell mt-16">
          <EmptyState />
        </section>
      )}
    </div>
  );
}
