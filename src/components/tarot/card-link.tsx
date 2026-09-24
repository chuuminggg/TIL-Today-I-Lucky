import Image from "next/image";
import Link from "next/link";
import type { TarotCard } from "@/lib/tarot/cards";
import { cardImage } from "./card-face";

/** 카드 사전 목록·관련 카드에 쓰는 작은 카드 링크 */
export function CardLink({ card }: { card: TarotCard }) {
  return (
    <Link href={`/tarot/cards/${card.slug}`} className="group flex flex-col items-center gap-1 text-center">
      <span className="relative block aspect-[480/830] w-full overflow-hidden rounded-lg shadow-sm transition group-hover:-translate-y-1 group-hover:shadow-md">
        <Image src={cardImage(card)} alt="" fill sizes="96px" className="object-cover" />
      </span>
      <span className="text-xs leading-tight">{card.name}</span>
    </Link>
  );
}
