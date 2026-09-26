import Link from "next/link";
import { connection } from "next/server";
import { TodayApp } from "@/components/today-app";
import { todayKST } from "@/lib/calendar/lunar";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

export default async function Home() {
  await connection(); // 날짜가 바뀌므로 빌드 시 prerender하지 않고 요청마다 렌더링
  const today = todayKST();
  const [y, m, d] = today.split("-").map(Number);
  const weekday = WEEKDAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-5 px-4 py-8">
      <header className="flex items-end justify-between">
        <div>
          <p className="text-sm text-muted">
            {y}년 {m}월 {d}일 {weekday}요일
          </p>
          <h1 className="text-2xl font-bold">Today I Lucky 🍀</h1>
        </div>
        <Link href="/tarot" className="rounded-full bg-accent-soft px-3 py-1.5 text-sm font-medium text-accent">
          🔮 타로 상세 운세
        </Link>
      </header>

      <TodayApp />

      <footer className="mt-auto pt-6 text-xs leading-relaxed text-muted">
        운세 풀이는 재미와 자기점검을 위한 참고용이며 의료·투자·법률 판단을 대신하지 않습니다.
        <br />
        입력한 생년월일은 이 기기에만 저장돼요. 서비스 개선을 위해 쿠키 없이 페이지별 방문 수만 집계합니다(Vercel Web Analytics).
      </footer>
    </main>
  );
}
