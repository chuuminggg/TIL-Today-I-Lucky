import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { CalendarApp } from "@/components/journal/calendar-app";
import { todayKST } from "@/lib/calendar/kst";

export const metadata: Metadata = {
  title: "TIL 캘린더 — TIL",
  description: "날마다 본 운세 점수와 오늘의 타로, 회고를 달력으로 모아 봐요",
  robots: { index: false }, // 기기마다 다른 개인 기록 화면
};

export default async function CalendarPage() {
  await connection(); // 오늘 날짜 기준으로 미래 날짜를 잠그므로 요청마다 렌더링
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-5 px-4 py-8">
      <header>
        <Link href="/" className="text-sm text-muted">
          ← 오늘의 운세
        </Link>
        <h1 className="mt-1 text-2xl font-bold">TIL 캘린더 📅</h1>
      </header>

      <CalendarApp today={todayKST()} />

      <footer className="mt-auto pt-6 text-xs leading-relaxed text-muted">
        기록에는 운세 점수·카드·회고만 남기고, 운세 내용은 날짜로 다시 계산해요. 모든 기록은 이 기기에만 저장돼요.
      </footer>
    </main>
  );
}
