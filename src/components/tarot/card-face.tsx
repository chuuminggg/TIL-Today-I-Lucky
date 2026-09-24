import type { TarotCard } from "@/lib/tarot/cards";

// 카드 이미지(RWS) 도입 전까지는 기호로 앞면을 그린다 — 이미지로 바꿀 때 이 파일만 수정

export function CardBack({ className = "" }: { className?: string }) {
  return (
    <span className={`flex items-center justify-center rounded-xl border-2 border-gold bg-accent shadow-md ${className}`}>
      <span className="rounded-full border border-gold/60 p-[0.45em] leading-none text-gold">✦</span>
    </span>
  );
}

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
    <span
      className={`flex flex-col items-center justify-between rounded-xl border-2 border-gold bg-card shadow-md ${
        compact ? "p-1.5" : "p-3"
      } ${className}`}
    >
      <span className={`text-muted ${compact ? "text-[0.55rem] leading-tight" : "text-xs"}`}>{card.nameEn}</span>
      <span className={`${compact ? "text-3xl" : "text-6xl"} ${reversed ? "rotate-180" : ""}`}>{card.symbol}</span>
      <span className={`text-center font-bold ${compact ? "text-[0.65rem] leading-tight" : "text-sm"}`}>{card.name}</span>
    </span>
  );
}
