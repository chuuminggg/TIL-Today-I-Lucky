import type { Metadata } from "next";
import Link from "next/link";
import { TarotApp } from "@/components/tarot/tarot-app";

export const metadata: Metadata = {
  title: "타로 상세 운세 — TIL",
  description: "연애·재회·속마음·직업·금전 고민을 타로 스프레드로 자세히 풀어 봐요",
};

export default function TarotPage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-5 px-4 py-8">
      <header>
        <Link href="/" className="text-sm text-muted">
          ← 오늘의 운세
        </Link>
        <h1 className="mt-1 text-2xl font-bold">타로 상세 운세 🔮</h1>
      </header>

      <TarotApp />

      <footer className="mt-auto pt-6 text-xs leading-relaxed text-muted">
        타로 해석은 재미와 자기점검을 위한 참고용이며 의료·투자·법률 판단을 대신하지 않습니다.
      </footer>
    </main>
  );
}
