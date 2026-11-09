import { CompareClient } from "@/components/compare-client";
import { getManifest, getOverview, getSearchIndex, listCommunities } from "@/lib/data";
import type { SearchEntry } from "@/lib/types";

export const metadata = {
  title: "区域与小区成交对比",
  description: "在同一条时间轴上比较天津十区或已公开小区的成交中位单价。",
};

export default function ComparePage() {
  const searchIndex = getSearchIndex();
  const overview = getOverview();
  const manifest = getManifest();
  const defaults = [...listCommunities()]
    .sort((left, right) => {
      const publishedDelta =
        Number(right.latest.status === "published") -
        Number(left.latest.status === "published");
      if (publishedDelta !== 0) return publishedDelta;
      return (
        right.observation.median_unit_price - left.observation.median_unit_price
      );
    })
    .slice(0, 3)
    .map((community) =>
      searchIndex.entries.find(
        (entry) => entry.type === "community" && entry.id === community.community.id,
      ),
    )
    .filter((entry): entry is SearchEntry => Boolean(entry));
  const fallback = overview.districts
    .slice(0, 3)
    .map((district) => searchIndex.entries.find((item) => item.id === district.code))
    .filter((entry): entry is SearchEntry => Boolean(entry));

  return (
    <div className="page-shell pt-10 md:pt-14">
      <div className="max-w-3xl border-b border-line pb-9">
        <p className="eyebrow mb-3">COMPARISON DESK</p>
        <h1 className="display-title text-[46px] md:text-[64px]">把价格放回同一条时间轴</h1>
        <p className="mt-5 text-[13px] leading-7 text-ink-soft">
          最多同时比较三个行政区或小区。每条线只连接达到样本门槛的月份，断点不是缺失值补零。
        </p>
      </div>
      <div className="mt-8">
        <CompareClient
          entries={searchIndex.entries}
          defaults={defaults.length ? defaults : fallback}
          snapshotId={manifest.snapshot_id}
        />
      </div>
    </div>
  );
}
