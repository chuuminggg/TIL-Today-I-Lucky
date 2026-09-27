"use client";

import { useLayoutEffect, useRef, useState, type KeyboardEvent, type MouseEvent } from "react";
import { TAROT_DECK } from "@/lib/tarot/cards";
import type { Spread } from "@/lib/tarot/spreads";
import { CardBack } from "./card-face";

const SLOTS = Array.from({ length: TAROT_DECK.length }, (_, i) => i);
// 한 줄로 78장을 펼치면 가로 스크롤이 너무 길어 두 줄로 나눈다
const ROW = Math.ceil(SLOTS.length / 2);
const ROWS = [SLOTS.slice(0, ROW), SLOTS.slice(ROW)];

function randomSlots(count: number, taken: number[]): number[] {
  const free = SLOTS.filter((s) => !taken.includes(s));
  const result: number[] = [];
  while (result.length < count) {
    const [slot] = free.splice(Math.floor(Math.random() * free.length), 1);
    result.push(slot);
  }
  return result;
}

const prefersReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** 셔플 → 멈추기 → 펼친 78장 중 스프레드 장수만큼 고르기 */
export function CardFan({ spread, onDone }: { spread: Spread; onDone: (picks: number[]) => void }) {
  const [shuffling, setShuffling] = useState(true);
  const [picks, setPicks] = useState<number[]>([]);
  const [focused, setFocused] = useState(0);
  const cardRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const trayRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const flight = useRef<{ slot: number; from: DOMRect } | null>(null);
  const need = spread.positions.length;
  const next = spread.positions[picks.length];
  const full = picks.length >= need;

  // 고른 카드가 펼친 자리에서 스프레드 칸으로 날아가 놓이는 연출 (FLIP: 도착한 칸을 출발 위치에서부터 되돌려 재생)
  useLayoutEffect(() => {
    const pending = flight.current;
    flight.current = null;
    if (!pending || prefersReducedMotion()) return;
    const target = trayRefs.current[picks.indexOf(pending.slot)];
    if (!target) return;
    const to = target.getBoundingClientRect();
    const dx = pending.from.left + pending.from.width / 2 - (to.left + to.width / 2);
    const dy = pending.from.top + pending.from.height / 2 - (to.top + to.height / 2);
    const scale = pending.from.width / to.width;
    target.animate(
      [
        { transform: `translate(${dx}px, ${dy}px) scale(${scale})`, zIndex: 10 },
        { transform: "translate(0, 0) scale(1)", zIndex: 10 },
      ],
      { duration: 450, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)" },
    );
  }, [picks]);

  function toggle(slot: number, event?: MouseEvent<HTMLButtonElement>) {
    if (picks.includes(slot)) {
      setPicks(picks.filter((s) => s !== slot));
      return;
    }
    if (full) return;
    const source = event?.currentTarget ?? cardRefs.current[slot];
    if (source) flight.current = { slot, from: source.getBoundingClientRect() };
    setPicks([...picks, slot]);
  }

  function moveFocus(to: number) {
    const slot = Math.max(0, Math.min(SLOTS.length - 1, to));
    setFocused(slot);
    const el = cardRefs.current[slot];
    el?.focus({ preventScroll: true });
    el?.scrollIntoView({ block: "nearest", inline: "center", behavior: prefersReducedMotion() ? "auto" : "smooth" });
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const moves: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -ROW, ArrowDown: ROW };
    if (event.key in moves) {
      const target = focused + moves[event.key];
      if (target < 0 || target >= SLOTS.length) return;
      event.preventDefault();
      moveFocus(target);
    } else if (event.key === "Home" || event.key === "End") {
      event.preventDefault();
      moveFocus(event.key === "Home" ? 0 : SLOTS.length - 1);
    }
  }

  if (shuffling) {
    return (
      <div className="flex flex-col items-center gap-6 py-6">
        <div className="shuffle-stack relative aspect-[480/830] w-24" aria-hidden>
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

      {/* 스프레드 자리 — 고른 카드가 여기로 날아와 놓인다. 누르면 그 카드를 다시 내려놓는다 */}
      <ol aria-label="스프레드 자리" className="flex flex-wrap justify-center gap-x-2 gap-y-3">
        {spread.positions.map((position, i) => {
          const slot = picks[i];
          const filled = slot !== undefined;
          return (
            <li key={position.key} className="flex w-11 flex-col items-center gap-1">
              <button
                type="button"
                onClick={() => filled && toggle(slot)}
                disabled={!filled}
                aria-label={filled ? `${position.label} 자리의 카드 내려놓기` : `${position.label} 자리 (비어 있음)`}
                className="block aspect-[480/830] w-full"
              >
                {filled ? (
                  <span ref={(el) => void (trayRefs.current[i] = el)} className="relative block size-full">
                    <CardBack className="size-full text-[0.6rem] ring-2 ring-gold" />
                  </span>
                ) : (
                  <span
                    className={`flex size-full items-center justify-center rounded-md border-2 border-dashed text-xs ${
                      i === picks.length ? "border-accent text-accent" : "border-border text-muted"
                    }`}
                  >
                    {i + 1}
                  </span>
                )}
              </button>
              <span className={`w-16 text-center text-[0.6rem] leading-tight ${i === picks.length ? "font-bold text-accent" : "text-muted"}`}>
                {position.label}
              </span>
            </li>
          );
        })}
      </ol>

      <div role="group" aria-label="펼친 카드 78장" onKeyDown={onKeyDown} className="-mx-4 overflow-x-auto px-4 pb-2 pt-4">
        <div className="flex w-max flex-col gap-3 pl-2 pr-6">
          {ROWS.map((row, r) => (
            <ul key={r} className="flex">
              {row.map((slot) => {
                const order = picks.indexOf(slot);
                const picked = order !== -1;
                const unavailable = !picked && full;
                return (
                  <li key={slot} className="-ml-8 first:ml-0">
                    <button
                      ref={(el) => void (cardRefs.current[slot] = el)}
                      type="button"
                      tabIndex={slot === focused ? 0 : -1}
                      onFocus={() => setFocused(slot)}
                      onClick={(e) => (unavailable ? undefined : toggle(slot, e))}
                      aria-disabled={unavailable}
                      aria-pressed={picked}
                      aria-label={
                        picked ? `${order + 1}번째로 고른 카드 (${spread.positions[order].label}), 선택 취소` : `카드 ${slot + 1}`
                      }
                      className={`relative block aspect-[480/830] w-14 rounded-md transition duration-200 focus-visible:-translate-y-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                        picked ? "-translate-y-2 opacity-35" : unavailable ? "cursor-default" : "hover:-translate-y-2"
                      }`}
                    >
                      <CardBack className="size-full text-sm" />
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
          ))}
        </div>
      </div>
      <p className="text-center text-xs text-muted">
        <span className="pointer-fine:hidden">← 옆으로 넘기며 끌리는 카드를 고르세요 →</span>
        <span className="hidden pointer-fine:inline">옆으로 넘기거나 ←→↑↓ 키로 움직이고, Enter로 고르세요</span>
      </p>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setPicks((prev) => [...prev, ...randomSlots(need - prev.length, prev)])}
          disabled={full}
          className="rounded-xl border border-border py-3 text-sm font-medium disabled:opacity-40"
        >
          나머지 무작위로
        </button>
        <button
          type="button"
          onClick={() => onDone(picks)}
          disabled={!full}
          className="rounded-xl bg-accent py-3 font-medium text-white disabled:opacity-40 dark:text-background"
        >
          결과 보기
        </button>
      </div>
    </div>
  );
}
