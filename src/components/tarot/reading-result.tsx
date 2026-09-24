"use client";

import { useState } from "react";
import { direction, type Reading } from "@/lib/tarot/interpret";
import { buildAiPrompt } from "@/lib/tarot/prompt";
import { TOPICS } from "@/lib/tarot/spreads";
import { CardBack, CardFront } from "./card-face";

const VERDICT_STYLE = { yes: "text-emerald-600 dark:text-emerald-400", maybe: "text-gold", no: "text-rose-600 dark:text-rose-400" } as const;

export function ReadingResult({
  reading,
  initiallyRevealed,
  onRetry,
  onHome,
}: {
  reading: Reading;
  initiallyRevealed: boolean;
  onRetry: () => void;
  onHome: () => void;
}) {
  const total = reading.cards.length;
  const [revealed, setRevealed] = useState(initiallyRevealed ? total : 0);
  const [copied, setCopied] = useState(false);
  const done = revealed >= total;

  async function copyPrompt() {
    try {
      await navigator.clipboard.writeText(buildAiPrompt(reading));
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <header className="rounded-2xl border border-border bg-card p-5">
        <p className="text-xs font-medium text-accent">
          {TOPICS[reading.topic].emoji} {TOPICS[reading.topic].label} · {reading.spread.name}
        </p>
        <h2 className="mt-1 text-lg font-bold">{reading.question ?? "지금 나에게 필요한 메시지"}</h2>
        <p className="mt-1 text-sm text-muted">{done ? "모든 카드를 펼쳤어요." : "카드를 순서대로 눌러 한 장씩 펼쳐 보세요."}</p>

        <ol className="mt-4 flex flex-wrap justify-center gap-2">
          {reading.cards.map((c, i) => {
            const open = i < revealed;
            return (
              <li key={c.position.key} className="flex w-[4.5rem] flex-col items-center gap-1">
                <div className="flip-card h-28 w-full" data-revealed={open}>
                  <button
                    type="button"
                    onClick={() => setRevealed(i + 1)}
                    disabled={open || i !== revealed}
                    aria-label={open ? `${c.position.label}: ${c.card.name} ${direction(c.reversed)}` : `${c.position.label} 카드 펼치기`}
                    className="flip-inner relative size-full"
                  >
                    <CardBack className={`flip-face absolute inset-0 text-base ${i === revealed ? "animate-pulse" : ""}`} />
                    <CardFront card={c.card} reversed={c.reversed} compact className="flip-face flip-back absolute inset-0" />
                  </button>
                </div>
                <span className="text-center text-[0.7rem] leading-tight text-muted">{c.position.label}</span>
              </li>
            );
          })}
        </ol>
        {!done && (
          <button type="button" onClick={() => setRevealed(total)} className="mt-3 w-full text-sm text-muted underline underline-offset-2">
            모두 펼치기
          </button>
        )}
      </header>

      {reading.cards.slice(0, revealed).map((c, i) => (
        <section key={c.position.key} className="rounded-2xl border border-border bg-card p-5">
          <p className="text-xs font-medium text-accent">
            {i + 1}. {c.position.label}
          </p>
          <h3 className="mt-1 font-bold">
            {c.card.name} <span className="text-sm font-normal text-muted">{direction(c.reversed)}</span>
          </h3>
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {c.keywords.map((k) => (
              <li key={k} className="rounded-full bg-accent-soft px-2.5 py-1 text-xs text-accent">
                #{k}
              </li>
            ))}
          </ul>
          <p className="mt-2 leading-relaxed">{c.text}</p>
        </section>
      ))}

      {done && (
        <>
          <section className="flex flex-col gap-3 rounded-2xl border-2 border-gold/60 bg-card p-5">
            <p className="text-xs font-medium text-accent">종합 해석</p>
            {reading.verdict && (
              <p className="text-2xl font-bold">
                <span className={VERDICT_STYLE[reading.verdict.answer]}>{reading.verdict.label}</span>
                <span className="ml-2 text-sm font-normal text-muted">{reading.verdict.text}</span>
              </p>
            )}
            <div>
              <h3 className="font-bold">{reading.summary.title}</h3>
              <p className="mt-1 leading-relaxed">{reading.summary.text}</p>
            </div>
            {reading.insights.length > 0 && (
              <ul className="flex flex-col gap-2 border-t border-border pt-3 text-sm leading-relaxed">
                {reading.insights.map((insight) => (
                  <li key={insight.text} className="flex gap-2">
                    <span aria-hidden className="text-gold">✦</span>
                    {insight.text}
                  </li>
                ))}
              </ul>
            )}
            <p className="rounded-xl bg-accent-soft p-3 text-sm leading-relaxed text-accent">💡 {reading.advice}</p>
          </section>

          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={onRetry} className="rounded-xl border border-border py-3 text-sm font-medium">
              같은 주제로 다시 보기
            </button>
            <button type="button" onClick={onHome} className="rounded-xl bg-accent py-3 text-sm font-medium text-white dark:text-background">
              다른 주제 보기
            </button>
          </div>
          <button type="button" onClick={copyPrompt} className="text-sm text-muted underline underline-offset-2">
            {copied ? "복사했어요! 사용하는 AI에 붙여 넣어 보세요." : "AI에게 더 물어보기용 프롬프트 복사"}
          </button>
        </>
      )}
    </div>
  );
}
