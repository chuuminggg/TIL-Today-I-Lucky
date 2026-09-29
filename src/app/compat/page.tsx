import type { Metadata } from "next";
import Link from "next/link";
import { CompatApp } from "@/components/saju/compat-app";

export const metadata: Metadata = {
  title: "사주 궁합 — TIL",
  description: "연인·썸·친구·동료·가족 — 두 사람의 사주로 서로에게 어떤 사람인지, 잘 맞는 점과 조심할 점을 알아봐요",
};

export default function CompatPage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-5 px-4 py-8">
      <header>
        <Link href="/" className="text-sm text-muted">
          ← 오늘의 운세
        </Link>
        <h1 className="mt-1 text-2xl font-bold">사주 궁합 💞</h1>
      </header>

      <CompatApp />

      <footer className="mt-auto pt-6 text-xs leading-relaxed text-muted">
        궁합은 관계를 결정하지 않아요. 서로를 이해하는 대화 재료로 가볍게 봐 주세요. 상대 정보는 저장하지 않습니다.
      </footer>
    </main>
  );
}
