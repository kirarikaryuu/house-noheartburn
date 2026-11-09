import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getManifest, getOverview } from "@/lib/data";
import { formatInteger, formatMonth } from "@/lib/format";

export const metadata = {
  title: "数据口径与方法",
  description: "天津十区二手房成交数据的来源、OCR 自动校验、去重、产权标记、样本门槛和隐私边界。",
};

export default function MethodologyPage() {
  const manifest = getManifest();
  const overview = getOverview();
  return (
    <div className="page-shell pt-10 md:pt-14">
      <header className="grid gap-10 border-b border-line pb-10 lg:grid-cols-[1fr_360px] lg:items-end">
        <div>
          <p className="eyebrow mb-3">METHOD & LIMITS</p>
          <h1 className="display-title text-[48px] md:text-[68px]">数据不是凭空长出来的</h1>
          <p className="mt-5 max-w-2xl text-[13px] leading-7 text-ink-soft">
            这里的数据来自房产中介公开发布的成交表格，而非官方网签接口。每一条进入统计的记录都经历识别、自动校验、产权标记与去重。
          </p>
        </div>
        <Card className="p-5">
          <p className="text-[10px] text-muted">当前公开快照</p>
          <p className="mt-3 font-display text-3xl">{formatMonth(manifest.as_of)}</p>
          <div className="mt-5 grid grid-cols-2 gap-4 border-t border-line pt-4 text-[10px] text-muted">
            <span>已发布行政区<br /><b className="mt-1 block font-display text-xl text-ink">{overview.summary.published_district_count} / 10</b></span>
            <span>有成交参考的小区<br /><b className="mt-1 block font-display text-xl text-ink">{formatInteger(overview.summary.community_count)}</b></span>
          </div>
        </Card>
      </header>

      <div className="grid gap-12 pt-12 lg:grid-cols-[220px_1fr]">
        <aside className="hidden lg:block">
          <div className="sticky top-28 border-l border-line pl-5 text-[11px] leading-8 text-muted">
            <a href="#scope" className="block hover:text-teal">统计范围</a>
            <a href="#pipeline" className="block hover:text-teal">数据链路</a>
            <a href="#aggregation" className="block hover:text-teal">聚合口径</a>
            <a href="#privacy" className="block hover:text-teal">隐私与来源</a>
            <a href="#limits" className="block hover:text-teal">局限性</a>
          </div>
        </aside>

        <article className="prose-editorial max-w-3xl">
          <section id="scope">
            <p className="eyebrow">01 / SCOPE</p>
            <h2>统计范围</h2>
            <p>
              平台只统计和平、河东、河西、南开、河北、红桥、东丽、西青、津南、北辰十个行政区。趋势图使用最近
              24 个自然月且只保留已经完整结束的月份；小区详情的历史成交表不受 24 个月截断，保留全部已审核记录。
            </p>
            <p>
              以发布者标注的“二手房成交”口径纳入样本。产权查询是可选的展示标签，默认关闭且不阻塞公开统计；
              已查询到的住宅、商业、其他和待核状态会在小区页面单独标记。
            </p>
          </section>

          <section id="pipeline">
            <p className="eyebrow mt-14">02 / PIPELINE</p>
            <h2>从图集到趋势</h2>
            <div className="my-7 grid gap-3">
              {[
                ["采集", "采集机在用户自己的登录态下按页保存公开图文/幻灯片原图，不绕过验证码、登录或访问控制。"],
                ["识别", "表格 OCR 提取区域、板块、小区、户型、面积、楼层、成交价、单价、挂牌价和成交时间。户型按原值记录、仅辅助去重，不单独阻断审批；水印遮挡的内容不猜测。"],
                ["自动审核", "正常记录直接入库；轻微单价偏差按“成交价 ÷ 面积”自动修正。只有价格冲突、严重偏离或无法修复的关键字段进入异常队列。"],
                ["产权", "产权查询是可选标签，默认关闭；显式开启后才查询房天下和安居客，验证码不会被绕过，查询失败也不阻塞统计。"],
                ["归并", "用小区、成交日期、面积、楼层、户型和总价合并重复证据；近似重复但价格不同进入冲突队列。"],
                ["发布", "生成仅含聚合结果的静态 JSON，经 Schema 和隐私检查后构建 GitHub Pages。"],
              ].map(([title, description], index) => (
                <div key={title} className="grid grid-cols-[40px_1fr] gap-4 border-t border-line pt-4">
                  <span className="font-mono text-[10px] text-copper">0{index + 1}</span>
                  <div>
                    <p className="m-0 text-[13px] font-semibold text-ink">{title}</p>
                    <p className="mt-1 text-[12px] leading-6 text-muted">{description}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section id="aggregation">
            <p className="eyebrow mt-14">03 / AGGREGATION</p>
            <h2>为什么用中位数</h2>
            <p>
              中位数比平均值更能抵抗极端单价。所有价格指标都直接从通过自动校验的单套成交明细计算，不会先求小区均价再对均价求平均。
            </p>
            <div className="my-6 grid gap-3 sm:grid-cols-2">
              <div className="border border-line bg-surface/50 p-5">
                <Badge tone="teal">区 / 板块</Badge>
                <p className="mt-4 font-display text-2xl">至少 5 笔</p>
                <p className="mt-2 text-[11px] leading-5 text-muted">当月去重成交不足 5 笔时，隐藏价格并标记“样本不足”。</p>
              </div>
              <div className="border border-line bg-surface/50 p-5">
                <Badge tone="copper">小区趋势</Badge>
                <p className="mt-4 font-display text-2xl">至少 3 笔</p>
                <p className="mt-2 text-[11px] leading-5 text-muted">3 笔以上才连接趋势线。1–2 笔仍会显示小区级中位数和区间，但明确标注为低样本。</p>
              </div>
            </div>
            <p>
              环比使用上一个自然月，同比使用 12 个月前的同一个月。缺失月份不会插值，比较基准缺失时返回空值。成交量是去重后的成交笔数，不是中介发帖次数。
            </p>
          </section>

          <section id="privacy">
            <p className="eyebrow mt-14">04 / PRIVACY</p>
            <h2>公开什么，不公开什么</h2>
            <ul>
              <li>公开：行政区、板块、小区的聚合指标，以及小区内已去重的成交日期、户型、面积、楼层、总价和单价。</li>
              <li>不公开：原始截图、帖子链接、中介昵称、Cookie、来源标识和审核日志。</li>
              <li>原始证据只保存在本地采集机；公开仓库只接收通过白名单校验的聚合 JSON。</li>
              <li>“来源数”表示不同中介账号，不代表独立第三方核验。</li>
            </ul>
            <div className="border-l-2 border-copper bg-copper-soft/55 p-5 text-[12px] leading-6 text-ink-soft">
              如果你发现数据错误，请记住：这是一份中介公开记录的聚合，不是官方成交库。错误可能来自原表、识别或去重，任何趋势判断都应保留这一前提。
            </div>
          </section>

          <section id="limits">
            <p className="eyebrow mt-14">05 / LIMITS</p>
            <h2>必须承认的局限</h2>
            <ul>
              <li>样本取决于哪些中介公开了哪些表，不代表天津全部成交，也不能直接等同于市场成交量。</li>
              <li>“成交价”沿用发布者口径，不保证是净成交价，可能受装修、车位、税费和关联交易影响。</li>
              <li>各来源可能转载同一张原始表。我们会合并证据，但无法验证中介数据的一手真实性。</li>
              <li>产权或房屋用途可能仍待核；公开统计不会因产权未知而隐藏，但商业/其他样本可能影响小区价格。</li>
              <li>GitHub Pages 在中国大陆的访问速度不稳定；站点保持纯静态，便于后续迁移到 CDN。</li>
              <li>所有内容只作信息参考，不构成房产交易、估值或投资建议。</li>
            </ul>
            <p className="mt-10">
              <Link prefetch={false} href="/compare/" className="text-teal hover:text-copper">查看区域对照 →</Link>
            </p>
          </section>
        </article>
      </div>
    </div>
  );
}
