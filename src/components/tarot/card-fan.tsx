"use client";

import { useState } from "react";
import { TAROT_DECK } from "@/lib/tarot/cards";
import type { Spread } from "@/lib/tarot/spreads";
import { CardBack } from "./card-face";

const SLOTS = Array.from({ length: TAROT_DECK.length }, (_, i) => i);

function randomSlots(count: number, taken: number[]): number[] {
  const free = SLOTS.filter((s) => !taken.includes(s));
  const result: number[] = [];
  while (result.length < count) {
    const [slot] = free.splice(Math.floor(Math.random() * free.length), 1);
    result.push(slot);
  }
  return result;
}

/** 셔플 → 멈추기 → 펼친 78장 중 스프레드 장수만큼 고르기 */
export function CardFan({ spread, onDone }: { spread: Spread; onDone: (picks: number[]) => void }) {
  const [shuffling, setShuffling] = useState(true);
  const [picks, setPicks] = useState<number[]>([]);
  const need = spread.positions.length;
  const next = spread.positions[picks.length];

  function toggle(slot: number) {
    setPicks((prev) => (prev.includes(slot) ? prev.filter((s) => s !== slot) : prev.length < need ? [...prev, slot] : prev));
  }

  if (shuffling) {
    return (
      <div className="flex flex-col items-center gap-6 py-6">
        <div className="shuffle-stack relative h-40 w-24" aria-hidden>
          {[0, 1, 2, 3, 4].map((i) => (
            <CardBack key={i} className="shuffle-card absolute inset-0 text-2xl" />
          ))}
        </div>
        <p className="text-center text-sm text-muted">
          질문을 마음속으로 떠올리며 카드를 섞고 있어요.
          <br />
          마음이 정해지면 멈춰 주세요.
        </p>
        <button type="button" onClick={() => setShuffling(false)} className="w-full rounded-xl bg-accent py-3 font-medium text-white dark:text-background">
          섞기 멈추기
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <p aria-live="polite" className="text-center text-sm">
        {next ? (
          <>
            <span className="font-bold text-accent">{next.label}</span> 카드를 골라 주세요{" "}
            <span className="text-muted">
              ({picks.length + 1}/{need})
            </span>
          </>
        ) : (
          <span className="font-bold text-accent">{need}장을 모두 골랐어요</span>
        )}
      </p>

      <div className="-mx-4 overflow-x-auto px-4 pb-2 pt-5">
        <ul className="flex w-max pl-2 pr-6">
          {SLOTS.map((slot) => {
            const order = picks.indexOf(slot);
            const picked = order !== -1;
            return (
              <li key={slot} className="-ml-8 first:ml-0">
                <button
                  type="button"
                  onClick={() => toggle(slot)}
                  disabled={!picked && picks.length >= need}
                  aria-pressed={picked}
                  aria-label={picked ? `${order + 1}번째로 고른 카드 (${spread.positions[order].label}), 선택 취소` : `카드 ${slot + 1}`}
                  className={`relative block h-24 w-14 transition-transform duration-200 ${picked ? "-translate-y-4" : "hover:-translate-y-2"}`}
                >
                  <CardBack className={`size-full text-sm ${picked ? "ring-2 ring-gold ring-offset-2 ring-offset-background" : ""}`} />
                  {picked && (
                    <span className="absolute -top-2 left-1/2 flex size-5 -translate-x-1/2 items-center justify-center rounded-full bg-gold text-[0.65rem] font-bold text-background">
                      {order + 1}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
      <p className="text-center text-xs text-muted">← 옆으로 넘기며 끌리는 카드를 고르세요 →</p>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setPicks((prev) => [...prev, ...randomSlots(need - prev.length, prev)])}
          disabled={picks.length >= need}
          className="rounded-xl border border-border py-3 text-sm font-medium disabled:opacity-40"
        >
          나머지 무작위로
        </button>
        <button
          type="button"
          onClick={() => onDone(picks)}
          disabled={picks.length < need}
          className="rounded-xl bg-accent py-3 font-medium text-white disabled:opacity-40 dark:text-background"
        >
          결과 보기
        </button>
      </div>
    </div>
  );
}
