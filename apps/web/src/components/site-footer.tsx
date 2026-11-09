import Link from "next/link";
import { SITE_NAME } from "@/lib/constants";

export function SiteFooter({ publishedAt }: { publishedAt?: string }) {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-24 border-t border-line">
      <div className="page-shell grid gap-10 py-12 md:grid-cols-[1.2fr_1fr_1fr]">
        <div>
          <p className="font-display text-2xl font-semibold">{SITE_NAME}</p>
          <p className="mt-3 max-w-sm text-[12px] leading-6 text-muted">
            基于房产中介公开发布的成交记录，经识别、自动审核、去重后形成聚合行情。不是官方网签或不动产登记数据。
          </p>
        </div>
        <div className="text-[12px] leading-7 text-muted">
          <p className="mb-2 text-[10px] tracking-[0.15em] text-ink">浏览</p>
          <p><Link prefetch={false} href="/" className="hover:text-teal">城市总览</Link></p>
          <p><Link prefetch={false} href="/compare/" className="hover:text-teal">区域对比</Link></p>
          <p><Link prefetch={false} href="/methodology/" className="hover:text-teal">数据口径</Link></p>
        </div>
        <div className="text-[12px] leading-7 text-muted">
          <p className="mb-2 text-[10px] tracking-[0.15em] text-ink">发布信息</p>
          <p>公开数据：仅聚合结果</p>
          <p>最近构建：{publishedAt ? new Date(publishedAt).toLocaleDateString("zh-CN") : "等待首次发布"}</p>
          <p>更新时间：{publishedAt ? new Date(publishedAt).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }) : "—"}</p>
        </div>
      </div>
      <div className="page-shell flex flex-col gap-2 border-t border-line py-5 text-[10px] text-muted sm:flex-row sm:items-center sm:justify-between">
        <span>© {year} {SITE_NAME}</span>
        <span>行政区划边界：DataV GeoAtlas，仅作示意 · 本页不构成交易建议</span>
      </div>
    </footer>
  );
}
