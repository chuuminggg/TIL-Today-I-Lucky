import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { Noto_Sans_KR } from "next/font/google";
import "./globals.css";

const notoSansKr = Noto_Sans_KR({
  variable: "--font-noto-sans-kr",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  // 공유 미리보기(OG) 이미지의 절대 주소 기준. 지정하지 않으면 Next.js가 Vercel 배포 주소
  // (VERCEL_PROJECT_PRODUCTION_URL, 미리보기는 VERCEL_BRANCH_URL)를 쓴다 — 커스텀 도메인일 때만 지정
  metadataBase: process.env.NEXT_PUBLIC_SITE_URL ? new URL(process.env.NEXT_PUBLIC_SITE_URL) : undefined,
  title: "TIL — Today I Lucky",
  description: "매일 확인하는 오늘의 사주 운세와 타로 한 장",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className={`${notoSansKr.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        {children}
        {/* 쿠키 없는 방문 통계 — Vercel 대시보드에서 Web Analytics를 켜야 수집된다 */}
        <Analytics />
      </body>
    </html>
  );
}
