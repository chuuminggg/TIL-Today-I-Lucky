"use client";

import Link from "next/link";
import { useState } from "react";
import { isTarotRevealed, markTarotRevealed } from "@/lib/profile/storage";
import type { DrawnCard } from "@/lib/tarot/draw";
import { CardBack, CardFront } from "./tarot/card-face";

export function TarotCard({ drawn, date }: { drawn: DrawnCard; date: string }) {
  // 결과를 받은 뒤에만 렌더링되는 클라이언트 컴포넌트라 초기값에서 storage를 읽어도 하이드레이션과 충돌하지 않는다
  const [revealed, setRevealed] = useState(() => isTarotRevealed(date));
  const { card, reversed } = drawn;

  function reveal() {
    setRevealed(true);
    markTarotRevealed(date);
  }

  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <h2 className="text-xs font-medium text-accent">오늘의 타로</h2>
      <p className="mt-1 text-sm text-muted">
        {revealed ? "오늘 당신에게 온 카드예요." : "마음속으로 오늘 하루를 떠올리며 카드를 뒤집어 보세요."}
      </p>

      <div className="flip-card mx-auto mt-4 h-64 w-40" data-revealed={revealed}>
        <button
          type="button"
          onClick={reveal}
          disabled={revealed}
          aria-label={revealed ? `${card.name}${reversed ? " 역방향" : ""}` : "타로 카드 뒤집기"}
          className="flip-inner relative size-full"
        >
          <CardBack className="flip-face absolute inset-0 text-4xl" />
          <CardFront card={card} reversed={reversed} className="flip-face flip-back absolute inset-0" />
        </button>
      </div>

      {revealed && (
        <div className="mt-5 flex flex-col gap-2">
          <p className="text-center">
            <span className="font-bold">{card.name}</span>{" "}
            <span className="text-sm text-muted">{reversed ? "역방향" : "정방향"}</span>
          </p>
          <ul className="flex flex-wrap justify-center gap-1.5">
            {drawn.side.keywords.map((k) => (
              <li key={k} className="rounded-full bg-accent-soft px-2.5 py-1 text-xs text-accent">
                #{k}
              </li>
            ))}
          </ul>
          <p className="mt-1 leading-relaxed">{drawn.side.meaning}</p>
          <p className="text-sm text-muted">💡 {drawn.side.advice}</p>
          <Link href="/tarot" className="mt-2 rounded-xl border border-accent py-2.5 text-center text-sm font-medium text-accent">
            고민이 있다면, 타로로 더 깊게 보기 →
          </Link>
        </div>
      )}
    </section>
  );
}
