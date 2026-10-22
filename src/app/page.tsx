import Link from "next/link";
import { connection } from "next/server";
import { TodayApp } from "@/components/today-app";
import { todayKST } from "@/lib/calendar/kst";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

const NAV = [
  { href: "/tarot", label: "🔮 타로" },
  { href: "/saju", label: "🧭 사주" },
  { href: "/compat", label: "💞 궁합" },
  { href: "/naming", label: "✍️ 작명" },
  { href: "/calendar", label: "📅 기록" },
];

export default async function Home() {
  await connection(); // 날짜가 바뀌므로 빌드 시 prerender하지 않고 요청마다 렌더링
  const today = todayKST();
  const [y, m, d] = today.split("-").map(Number);
  const weekday = WEEKDAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-5 px-4 py-8">
      <header className="flex flex-col gap-3">
        <div>
          <p className="text-sm text-muted">
            {y}년 {m}월 {d}일 {weekday}요일
          </p>
          <h1 className="text-2xl font-bold">Today I Lucky 🍀</h1>
        </div>
        <nav aria-label="더 보기" className="grid grid-cols-5 gap-1 text-center text-sm font-medium">
          {NAV.map(({ href, label }) => (
            <Link key={href} href={href} className="whitespace-nowrap rounded-full bg-accent-soft px-1 py-1.5 text-accent">
              {label}
            </Link>
          ))}
        </nav>
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
