"use client";

import { formatInteger } from "@/lib/format";

const buttonClass =
  "border border-line bg-surface px-3 py-2 text-[10px] text-ink transition-colors hover:border-teal hover:text-teal disabled:cursor-not-allowed disabled:opacity-35";

export function TablePagination({
  page,
  pageCount,
  total,
  pageSize,
  onPageChange,
  itemLabel,
}: {
  page: number;
  pageCount: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  itemLabel: string;
}) {
  if (pageCount <= 1) return null;

  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
      <span className="text-[10px] text-muted">
        显示 <span className="font-mono text-ink">{formatInteger(start)}</span>–
        <span className="font-mono text-ink">{formatInteger(end)}</span>，共{" "}
        <span className="font-mono text-ink">{formatInteger(total)}</span> {itemLabel}
      </span>
      <div className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          className={buttonClass}
          onClick={() => onPageChange(1)}
          disabled={page <= 1}
          aria-label="第一页"
        >
          首页
        </button>
        <button
          type="button"
          className={buttonClass}
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          aria-label="上一页"
        >
          上一页
        </button>
        <span className="min-w-20 px-2 text-center font-mono text-[10px] text-muted">
          {page} / {pageCount}
        </span>
        <button
          type="button"
          className={buttonClass}
          onClick={() => onPageChange(page + 1)}
          disabled={page >= pageCount}
          aria-label="下一页"
        >
          下一页
        </button>
        <button
          type="button"
          className={buttonClass}
          onClick={() => onPageChange(pageCount)}
          disabled={page >= pageCount}
          aria-label="最后一页"
        >
          末页
        </button>
      </div>
    </div>
  );
}
