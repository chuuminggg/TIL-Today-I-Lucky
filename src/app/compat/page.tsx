import type { Metadata } from "next";
import Link from "next/link";
import { CompatApp } from "@/components/saju/compat-app";
import { josa } from "@/lib/josa";
import { compatShareQuery, parseCompatShare } from "@/lib/saju/compat-share";
import { compatHeadline, RELATION_TYPES } from "@/lib/saju/detail-text";

const TITLE = "사주 궁합 — TIL";
const DESCRIPTION = "연인·썸·친구·동료·가족 — 두 사람의 사주로 서로에게 어떤 사람인지, 잘 맞는 점과 조심할 점을 알아봐요";

// 공유 주소(?a=…&b=…&s=…&r=…)로 들어오면 미리보기만 그 결과로 바꾸고, 화면은 궁합 시작 화면 그대로
export async function generateMetadata({ searchParams }: PageProps<"/compat">): Promise<Metadata> {
  const share = parseCompatShare(await searchParams);
  if (!share) return { title: TITLE, description: DESCRIPTION };
  const title = `${share.a} 💞 ${share.b} ${RELATION_TYPES[share.relation].label} 궁합 ${share.score}점 | TIL`;
  const description = `${compatHeadline(share.score)}. 나도 사주로 궁합 보기`;
  const image = { url: `/og/compat?${compatShareQuery(share)}`, width: 1200, height: 630, alt: `${josa(share.a, "과", "와")} ${share.b}의 궁합 점수` };
  return {
    title,
    description,
    // 같은 화면이 닉네임 조합마다 색인되지 않도록 공유 주소는 /compat 하나로 모은다
    alternates: { canonical: "/compat" },
    robots: { index: false, follow: true },
    openGraph: { title, description, images: [image] },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

export default async function CompatPage({ searchParams }: PageProps<"/compat">) {
  const share = parseCompatShare(await searchParams);

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-5 px-4 py-8">
      <header>
        <Link href="/" className="text-sm text-muted">
          ← 오늘의 운세
        </Link>
        <h1 className="mt-1 text-2xl font-bold">사주 궁합 💞</h1>
      </header>

      {share && (
        <p className="rounded-xl border border-gold/40 bg-gold/10 p-3 text-sm leading-relaxed">
          {RELATION_TYPES[share.relation].emoji} {share.a}님과 {share.b}님의 {RELATION_TYPES[share.relation].label} 궁합은{" "}
          <strong>{share.score}점</strong>이었어요. 나와 소중한 사람의 궁합도 알아볼까요?
        </p>
      )}

      <CompatApp />

      <footer className="mt-auto pt-6 text-xs leading-relaxed text-muted">
        궁합은 관계를 결정하지 않아요. 서로를 이해하는 대화 재료로 가볍게 봐 주세요. 상대 정보는 저장하지 않습니다.
      </footer>
    </main>
  );
}
