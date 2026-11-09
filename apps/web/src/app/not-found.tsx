import Link from "next/link";

export default function NotFound() {
  return (
    <div className="page-shell grid min-h-[62vh] place-items-center py-20 text-center">
      <div>
        <p className="font-mono text-[10px] tracking-[0.2em] text-copper">404 / NO SAMPLE</p>
        <h1 className="display-title mt-5 text-[54px]">这个页面没有公开样本</h1>
        <p className="mx-auto mt-4 max-w-md text-[12px] leading-6 text-muted">
          可能是小区尚未达到公开门槛、链接已变化，或该行政区不在首版统计范围。
        </p>
        <Link prefetch={false} href="/" className="mt-7 inline-flex border border-ink px-5 py-3 text-[11px] hover:bg-ink hover:text-paper">
          返回城市总览
        </Link>
      </div>
    </div>
  );
}
