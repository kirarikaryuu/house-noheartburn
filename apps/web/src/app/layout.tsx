import type { Metadata, Viewport } from "next";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getManifest } from "@/lib/data";
import { SITE_NAME, SITE_TAGLINE } from "@/lib/constants";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: `${SITE_NAME} · ${SITE_TAGLINE}`,
    template: `%s · ${SITE_NAME}`,
  },
  description:
    "基于天津房产中介公开发布的成交记录，经 OCR、自动审核和去重后，展示市内六区与环城四区的二手房成交趋势。",
  authors: [{ name: SITE_NAME }],
  openGraph: {
    title: `${SITE_NAME} · ${SITE_TAGLINE}`,
    description: "天津十区二手房成交记录聚合与趋势观察。",
    type: "website",
    locale: "zh_CN",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f3eee4",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const manifest = getManifest();
  return (
    <html lang="zh-CN">
      <body>
        <SiteHeader />
        <main>{children}</main>
        <SiteFooter publishedAt={manifest.published_at} />
      </body>
    </html>
  );
}
