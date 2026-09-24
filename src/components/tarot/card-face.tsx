import Image from "next/image";
import type { TarotCard } from "@/lib/tarot/cards";

// 앞면은 RWS(1909, 퍼블릭 도메인) 카드 이미지, 뒷면은 자체 디자인

export function CardBack({ className = "" }: { className?: string }) {
  return (
    <span className={`flex items-center justify-center rounded-xl border-2 border-gold bg-accent shadow-md ${className}`}>
      <span className="rounded-full border border-gold/60 p-[0.45em] leading-none text-gold">✦</span>
    </span>
  );
}

/** 카드 이미지 경로 — scripts/tarot/fetch-images.mjs가 slug 이름으로 만든다 */
export const cardImage = (card: TarotCard) => `/tarot/rws/${card.slug}.webp`;

export function CardFront({
  card,
  reversed,
  compact = false,
  className = "",
}: {
  card: TarotCard;
  reversed: boolean;
  compact?: boolean;
  className?: string;
}) {
  return (
    <span className={`overflow-hidden rounded-xl bg-card shadow-md ${className}`}>
      <span className="relative block size-full">
        <Image
          src={cardImage(card)}
          alt={`${card.name} (${card.nameEn})${reversed ? " 역방향" : ""}`}
          fill
          sizes={compact ? "72px" : "160px"}
          className={`object-cover ${reversed ? "rotate-180" : ""}`}
        />
      </span>
    </span>
  );
}
