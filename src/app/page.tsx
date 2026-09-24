import { connection } from "next/server";
import { todayKST } from "@/lib/calendar/lunar";

export default async function Home() {
  await connection(); // 날짜가 바뀌므로 빌드 시 prerender하지 않고 요청마다 렌더링
  const today = todayKST();

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-4 py-12">
      <header>
        <p className="text-sm text-foreground/60">{today}</p>
        <h1 className="text-3xl font-bold">Today I Lucky 🍀</h1>
      </header>

      <section className="rounded-2xl border border-foreground/10 p-6">
        <h2 className="font-medium">오늘의 운세</h2>
        <p className="mt-2 text-sm text-foreground/60">준비 중입니다.</p>
      </section>

      <section className="rounded-2xl border border-foreground/10 p-6">
        <h2 className="font-medium">오늘의 타로</h2>
        <p className="mt-2 text-sm text-foreground/60">준비 중입니다.</p>
      </section>

      <footer className="mt-auto text-xs text-foreground/50">
        운세 풀이는 재미와 자기점검을 위한 참고용이며 의료·투자·법률 판단을 대신하지 않습니다.
      </footer>
    </main>
  );
}
