import type { Metadata } from "next";
import Link from "next/link";
import { CardLink } from "@/components/tarot/card-link";
import { TAROT_DECK, type Suit } from "@/lib/tarot/cards";
import { SUITS } from "@/lib/tarot/data/minor";
import { ELEMENT_LABEL } from "@/lib/tarot/labels";

export const metadata: Metadata = {
  title: "타로 카드 사전 — 78장 의미와 정·역방향 해석 | TIL",
  description: "메이저 아르카나 22장과 마이너 아르카나 56장의 의미, 연애·속마음·직업·금전 해석을 정방향과 역방향으로 정리했어요.",
};

const SUIT_THEME: Record<Suit, string> = {
  wands: "열정·행동·일",
  cups: "감정·사랑·관계",
  swords: "생각·말·결단",
  pentacles: "돈·일·현실",
};

const sections = [
  { id: "major", title: "메이저 아르카나", description: "인생의 큰 흐름과 전환점을 나타내는 22장", cards: TAROT_DECK.filter((c) => c.arcana === "major") },
  ...(Object.keys(SUITS) as Suit[]).map((suit) => ({
    id: suit,
    title: `${SUITS[suit].name} (${SUITS[suit].nameEn})`,
    description: `${ELEMENT_LABEL[SUITS[suit].element].emoji} ${ELEMENT_LABEL[SUITS[suit].element].name}의 카드 — ${SUIT_THEME[suit]}`,
    cards: TAROT_DECK.filter((c) => c.suit === suit),
  })),
];

export default function TarotCardsPage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-4 py-8">
      <header>
        <Link href="/tarot" className="text-sm text-muted">
          ← 타로 상세 운세
        </Link>
        <h1 className="mt-1 text-2xl font-bold">타로 카드 사전 📖</h1>
        <p className="mt-1 text-sm text-muted">78장 카드의 의미를 정방향·역방향으로 살펴보세요.</p>
        <nav aria-label="분류" className="mt-3 flex flex-wrap gap-1.5">
          {sections.map((s) => (
            <a key={s.id} href={`#${s.id}`} className="rounded-full bg-accent-soft px-2.5 py-1 text-xs text-accent">
              {s.title.split(" (")[0]}
            </a>
          ))}
        </nav>
      </header>

      {sections.map((section) => (
        <section key={section.id} id={section.id} className="scroll-mt-4">
          <h2 className="font-bold">{section.title}</h2>
          <p className="text-xs text-muted">{section.description}</p>
          <ul className="mt-3 grid grid-cols-4 gap-x-2 gap-y-3">
            {section.cards.map((card) => (
              <li key={card.id}>
                <CardLink card={card} />
              </li>
            ))}
          </ul>
        </section>
      ))}

      <footer className="mt-auto pt-6 text-xs leading-relaxed text-muted">
        카드 이미지: Rider–Waite–Smith 타로(1909, Pamela Colman Smith), 퍼블릭 도메인 · Wikimedia Commons
      </footer>
    </main>
  );
}
