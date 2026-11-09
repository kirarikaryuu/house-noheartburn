import type { Coverage } from "@/lib/types";
import { TARGET_DISTRICTS } from "@/lib/constants";

const statusClass = {
  published: "bg-teal",
  insufficient_sample: "bg-[#d9b185]",
  no_data: "bg-paper-deep",
};

export function CoverageMeter({ coverage }: { coverage: Coverage }) {
  const cellsByKey = new Map(
    coverage.cells.map((cell) => [`${cell.district_code}-${cell.month}`, cell]),
  );
  return (
    <div>
      <div className="overflow-x-auto pb-2">
        <div className="min-w-[720px]">
          <div className="mb-2 grid grid-cols-[64px_1fr] gap-4">
            <span />
            <div className="grid grid-cols-[repeat(24,minmax(0,1fr))] gap-1 text-[8px] text-muted">
              {coverage.months.map((month, index) => (
                <span key={month} className={index % 3 === 0 ? "opacity-100" : "opacity-0"}>
                  {month.slice(2).replace("-", ".")}
                </span>
              ))}
            </div>
          </div>
          <div className="grid gap-1.5">
            {TARGET_DISTRICTS.map((district) => (
              <div key={district.code} className="grid grid-cols-[64px_1fr] items-center gap-4">
                <span className="text-[10px] text-ink-soft">{district.name}</span>
                <div className="grid grid-cols-[repeat(24,minmax(0,1fr))] gap-1">
                  {coverage.months.map((month) => {
                    const cell = cellsByKey.get(`${district.code}-${month}`);
                    return (
                      <span
                        key={month}
                        title={`${district.name} ${month} · ${
                          cell?.status === "published"
                            ? `已发布 ${cell.transaction_count} 笔`
                            : cell?.status === "insufficient_sample"
                              ? "样本不足"
                              : "无数据"
                        }`}
                        className={`aspect-square min-w-2 ${statusClass[cell?.status ?? "no_data"]}`}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-5 text-[10px] text-muted">
        <span className="flex items-center gap-2"><i className="size-2 bg-teal" />已达到公开门槛</span>
        <span className="flex items-center gap-2"><i className="size-2 bg-[#d9b185]" />有样本但不足</span>
        <span className="flex items-center gap-2"><i className="size-2 bg-paper-deep" />无样本</span>
      </div>
    </div>
  );
}
