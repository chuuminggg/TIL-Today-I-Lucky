import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ReadingResult } from "@/components/tarot/reading-result";
import { readingFromShare, shareQuery } from "@/lib/tarot/share";
import { TOPICS } from "@/lib/tarot/spreads";

// 공유받은 타로 결과 — 주소의 seed·고른 자리로 서버에서 그대로 다시 해석한다.
// 주소 조합마다 페이지가 생기므로 검색에는 싣지 않는다(sitemap에도 없음).

export async function generateMetadata({ searchParams }: PageProps<"/tarot/r">): Promise<Metadata> {
  const reading = readingFromShare(await searchParams);
  if (!reading) return { robots: { index: false } };
  const topic = TOPICS[reading.topic];
  const title = `${topic.emoji} ${topic.label} 타로 — ${reading.summary.title} | TIL`;
  const description = `${reading.spread.name} 스프레드로 본 타로 결과예요. 💡 ${reading.advice}`;
  // 미리보기 이미지에는 질문을 넣지 않는다
  const image = { url: `/og/tarot?${shareQuery(reading)}`, width: 1200, height: 630, alt: `${topic.label} 타로 결과 카드` };
  return {
    title,
    description,
    robots: { index: false, follow: true },
    openGraph: { title, description, images: [image] },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

export default async function SharedTarotPage({ searchParams }: PageProps<"/tarot/r">) {
  const reading = readingFromShare(await searchParams);
  if (!reading) notFound();

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-5 px-4 py-8">
      <header>
        <Link href="/tarot" className="text-sm text-muted">
          ← 타로 상세 운세
        </Link>
        <h1 className="mt-1 text-2xl font-bold">공유받은 타로 🔮</h1>
        <p className="mt-1 text-sm text-muted">누군가 펼친 카드를 그대로 보여 드려요. 같은 주제로 나만의 카드를 뽑아 볼 수도 있어요.</p>
      </header>

      <ReadingResult reading={reading} initiallyRevealed shared />

      <footer className="mt-auto pt-6 text-xs leading-relaxed text-muted">
        타로 해석은 재미와 자기점검을 위한 참고용이며 의료·투자·법률 판단을 대신하지 않습니다.
      </footer>
    </main>
  );
}
