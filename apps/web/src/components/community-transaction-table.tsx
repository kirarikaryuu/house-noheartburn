"use client";

import { useRef, useState } from "react";
import { TablePagination } from "@/components/table-pagination";
import type { PublicTransaction } from "@/lib/types";
import { formatInteger, formatUnitPrice, formatWan } from "@/lib/format";

const PAGE_SIZE = 20;

export function CommunityTransactionTable({
  transactions,
}: {
  transactions: PublicTransaction[];
}) {
  const [page, setPage] = useState(1);
  const tableTopRef = useRef<HTMLDivElement>(null);
  const pageCount = Math.max(1, Math.ceil(transactions.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageRows = transactions.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const changePage = (nextPage: number) => {
    setPage(nextPage);
    window.requestAnimationFrame(() => {
      tableTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  return (
    <div>
      <p className="mb-3 text-[10px] text-muted">
        共 {formatInteger(transactions.length)} 笔去重成交，按成交日期从近到远排列。
      </p>
      <div ref={tableTopRef} className="scroll-mt-24 overflow-x-auto">
        <table className="data-table w-full min-w-[760px] table-fixed">
          <colgroup>
            <col className="w-[16%]" />
            <col className="w-[14%]" />
            <col className="w-[13%]" />
            <col className="w-[12%]" />
            <col className="w-[21%]" />
            <col className="w-[24%]" />
          </colgroup>
          <thead>
            <tr>
              <th>成交日期</th>
              <th>户型</th>
              <th className="text-right">面积</th>
              <th className="text-right">楼层</th>
              <th className="text-right">成交总价</th>
              <th className="text-right">成交单价</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map((transaction, index) => (
              <tr key={`${transaction.deal_date}-${(currentPage - 1) * PAGE_SIZE + index}`}>
                <td className="whitespace-nowrap font-mono text-[11px]">
                  {transaction.deal_date}
                </td>
                <td className="whitespace-nowrap font-mono text-[11px]">
                  {transaction.layout || "—"}
                </td>
                <td className="whitespace-nowrap text-right font-mono text-[11px] tabular-nums">
                  {transaction.area_sqm.toLocaleString("zh-CN", {
                    maximumFractionDigits: 2,
                  })}
                  <span className="ml-1 text-[9px] text-muted">㎡</span>
                </td>
                <td className="whitespace-nowrap text-right font-mono text-[11px]">
                  {transaction.floor || "—"}
                </td>
                <td className="whitespace-nowrap text-right font-mono text-[12px] tabular-nums">
                  {formatWan(transaction.total_price_yuan)}
                </td>
                <td className="whitespace-nowrap text-right tabular-nums">
                  <span className="font-display text-[16px]">
                    {formatUnitPrice(transaction.unit_price_yuan)}
                  </span>
                  <span className="ml-1 text-[9px] text-muted">元/㎡</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <TablePagination
        page={currentPage}
        pageCount={pageCount}
        total={transactions.length}
        pageSize={PAGE_SIZE}
        onPageChange={changePage}
        itemLabel="笔成交"
      />
    </div>
  );
}
