import Link from "next/link";

export function EmptyState({
  title = "等待首批数据发布",
  description = "采集、OCR 和自动审核都在本地完成。生成聚合数据并推送后，这里会自动更新。",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div className="grid min-h-64 place-items-center border border-dashed border-line bg-surface/35 px-6 text-center">
      <div className="max-w-md">
        <p className="mb-4 font-mono text-[10px] tracking-[0.16em] text-copper">NO PUBLISHED SAMPLE YET</p>
        <p className="font-display text-2xl">{title}</p>
        <p className="mt-3 text-[12px] leading-6 text-muted">{description}</p>
        <Link prefetch={false} href="/methodology/" className="mt-5 inline-block text-[11px] text-teal hover:text-copper">
          查看数据方法与样本门槛 →
        </Link>
      </div>
    </div>
  );
}
