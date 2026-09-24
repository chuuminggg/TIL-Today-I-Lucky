import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cardImage } from "@/components/tarot/card-face";
import { CardLink } from "@/components/tarot/card-link";
import { cardBySlug, relatedCards, TAROT_DECK, type CardSide, type TarotCard } from "@/lib/tarot/cards";
import { SUITS } from "@/lib/tarot/data/minor";
import { ELEMENT_LABEL, YES_NO_LABEL } from "@/lib/tarot/labels";

// 78장 모두 빌드 때 만들고, 목록에 없는 주소는 404
export const dynamicParams = false;

export function generateStaticParams() {
  return TAROT_DECK.map((card) => ({ slug: card.slug }));
}

export async function generateMetadata({ params }: PageProps<"/tarot/cards/[slug]">): Promise<Metadata> {
  const card = cardBySlug((await params).slug);
  if (!card) return {};
  const title = `${card.name} (${card.nameEn}) 타로 카드 의미 — 정방향·역방향 해석 | TIL`;
  const description = `${card.upright.keywords.join(", ")}. ${card.upright.meaning}`;
  return { title, description, openGraph: { title, description, images: [cardImage(card)] } };
}

const TOPICS: Array<["love" | "feeling" | "career" | "money", string]> = [
  ["love", "💘 연애"],
  ["feeling", "💭 상대의 속마음"],
  ["career", "💼 직업·학업"],
  ["money", "💰 금전"],
];

function SideSection({ title, side, reversed }: { title: string; side: CardSide; reversed: boolean }) {
  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-bold">{title}</h2>
        <span className="rounded-full bg-accent-soft px-2.5 py-1 text-xs text-accent">예/아니오: {YES_NO_LABEL[side.yesNo]}</span>
      </div>
      <ul className="flex flex-wrap gap-1.5">
        {side.keywords.map((k) => (
          <li key={k} className={`rounded-full px-2.5 py-1 text-xs ${reversed ? "bg-border/60 text-muted" : "bg-accent-soft text-accent"}`}>
            #{k}
          </li>
        ))}
      </ul>
      <p className="leading-relaxed">{side.meaning}</p>
      <dl className="flex flex-col gap-3 border-t border-border pt-3">
        {TOPICS.map(([field, label]) => (
          <div key={field}>
            <dt className="text-sm font-medium">{label}</dt>
            <dd className="mt-0.5 text-sm leading-relaxed text-muted">{side[field]}</dd>
          </div>
        ))}
      </dl>
      <p className="rounded-xl bg-accent-soft p-3 text-sm leading-relaxed text-accent">💡 {side.advice}</p>
    </section>
  );
}

function RelatedSection({ title, description, cards }: { title: string; description: string; cards: TarotCard[] }) {
  if (cards.length === 0) return null;
  return (
    <div>
      <h3 className="text-sm font-medium">{title}</h3>
      <p className="text-xs text-muted">{description}</p>
      <ul className="mt-2 grid grid-cols-4 gap-2">
        {cards.map((c) => (
          <li key={c.id}>
            <CardLink card={c} />
          </li>
        ))}
      </ul>
    </div>
  );
}

export default async function TarotCardPage({ params }: PageProps<"/tarot/cards/[slug]">) {
  const card = cardBySlug((await params).slug);
  if (!card) notFound();

  const index = TAROT_DECK.indexOf(card);
  const prev = TAROT_DECK[index - 1];
  const next = TAROT_DECK[index + 1];
  const related = relatedCards(card);
  const element = ELEMENT_LABEL[card.element];
  const group = card.suit ? `마이너 아르카나 · ${SUITS[card.suit].name}` : "메이저 아르카나";

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-5 px-4 py-8">
      <Link href="/tarot/cards" className="text-sm text-muted">
        ← 카드 사전
      </Link>

      <header className="flex gap-4">
        <span className="relative block aspect-[480/830] w-32 shrink-0 overflow-hidden rounded-xl shadow-md">
          <Image src={cardImage(card)} alt={`${card.name} (${card.nameEn})`} fill priority sizes="128px" className="object-cover" />
        </span>
        <div className="flex flex-col gap-2">
          <p className="text-xs text-muted">{group}</p>
          <h1 className="text-2xl font-bold leading-tight">{card.name}</h1>
          <p className="text-sm text-muted">{card.nameEn}</p>
          <p className="text-sm">
            {element.emoji} {element.name}의 기운
          </p>
          {card.person && <p className="text-sm leading-snug">👤 {card.person}</p>}
          <p className="text-sm leading-snug">{card.upright.keywords.join(" · ")}</p>
        </div>
      </header>

      <SideSection title="정방향" side={card.upright} reversed={false} />
      <SideSection title="역방향" side={card.reversed} reversed />

      <section className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5">
        <div>
          <h2 className="font-bold">주의할 점</h2>
          <p className="mt-1 text-sm leading-relaxed text-muted">
            장애물 자리에 나오면 정방향이어도 이렇게 읽어요. {card.caution}
          </p>
        </div>
        <RelatedSection title="함께 나오면 강해지는 카드" description="의미를 서로 뒷받침해요" cards={related.reinforce} />
        <RelatedSection title="함께 나오면 부딪히는 카드" description="두 힘 사이의 균형이 관건이에요" cards={related.oppose} />
      </section>

      <Link href="/tarot" className="rounded-xl bg-accent py-3 text-center font-medium text-white dark:text-background">
        🔮 이 카드가 나에게 나올까? 타로 보러 가기
      </Link>

      <nav aria-label="이전·다음 카드" className="grid grid-cols-2 gap-2 text-sm">
        {prev ? (
          <Link href={`/tarot/cards/${prev.slug}`} className="rounded-xl border border-border px-3 py-2.5">
            <span className="block text-xs text-muted">← 이전</span>
            {prev.name}
          </Link>
        ) : (
          <span />
        )}
        {next && (
          <Link href={`/tarot/cards/${next.slug}`} className="rounded-xl border border-border px-3 py-2.5 text-right">
            <span className="block text-xs text-muted">다음 →</span>
            {next.name}
          </Link>
        )}
      </nav>
    </main>
  );
}
