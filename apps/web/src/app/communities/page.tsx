import type { Metadata } from "next";
import { CommunityDetailClient } from "@/components/community-detail-client";

export const metadata: Metadata = {
  title: "小区成交详情",
  description: "查看小区成交聚合、价格趋势和全部历史成交记录。",
};

export default function CommunitiesPage() {
  return <CommunityDetailClient />;
}
