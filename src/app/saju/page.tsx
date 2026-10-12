import type { Metadata } from "next";
import Link from "next/link";
import { SajuApp } from "@/components/saju/saju-app";

export const metadata: Metadata = {
  title: "사주 상세 풀이 — TIL",
  description: "사주팔자 명식 표, 오행 분포, 용신, 십신, 대운과 올해 운을 한 화면에서 살펴봐요",
};

export default function SajuPage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-5 px-4 py-8">
      <header>
        <Link href="/" className="text-sm text-muted">
          ← 오늘의 운세
        </Link>
        <h1 className="mt-1 text-2xl font-bold">사주 상세 풀이 🧭</h1>
      </header>

      <SajuApp />

      <footer className="mt-auto pt-6 text-xs leading-relaxed text-muted">
        사주 풀이는 재미와 자기점검을 위한 참고용이며 의료·투자·법률 판단을 대신하지 않습니다. 정보 수정은 홈의 &lsquo;정보 수정&rsquo;에서 할 수 있어요.
      </footer>
    </main>
  );
}
