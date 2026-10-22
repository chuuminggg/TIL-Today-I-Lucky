import type { Metadata } from "next";
import Link from "next/link";
import { NamingApp } from "@/components/naming/naming-app";

export const metadata: Metadata = {
  title: "이름 감정 — TIL",
  description: "아기 이름·개명 후보를 사주 보완 오행, 한자 획수, 발음 흐름으로 비교해 봐요",
};

export default function NamingPage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-5 px-4 py-8">
      <header>
        <Link href="/" className="text-sm text-muted">
          ← 오늘의 운세
        </Link>
        <h1 className="mt-1 text-2xl font-bold">이름 감정 ✍️</h1>
        <p className="mt-1 text-sm text-muted">후보 이름을 최대 5개까지 넣고 사주와 얼마나 잘 맞는지 비교해 봐요.</p>
      </header>

      <NamingApp />

      <footer className="mt-auto flex flex-col gap-2 pt-6 text-xs leading-relaxed text-muted">
        <p>
          점수는 성명학의 여러 관점 중 하나(사주 보완 오행·필획 수·발음)를 단순화한 참고용이며, 작명·개명 판단을 대신하지 않습니다.
        </p>
        <p>
          입력한 한자가 출생신고에 쓸 수 있는 인명용 한자인지는 확인하지 않아요. 신고 전에 대법원 전자가족관계등록시스템의 인명용 한자 조회에서 꼭 확인하세요.
        </p>
        <p>획수는 정자 필순 데이터 기준이며, 강희자전 원획법이나 81수리(원형이정)와는 다를 수 있어요. 입력한 정보는 저장하지 않아요.</p>
      </footer>
    </main>
  );
}
