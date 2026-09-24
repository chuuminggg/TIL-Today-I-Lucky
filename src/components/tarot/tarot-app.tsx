"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { parseHistory, saveToHistory, useTarotHistoryRaw, type HistoryEntry } from "@/lib/tarot/history";
import type { Reading, ReadingRequest } from "@/lib/tarot/interpret";
import { SPREADS, spreadsForTopic, TOPIC_IDS, TOPICS, type Spread, type Topic } from "@/lib/tarot/spreads";
import { CardFan } from "./card-fan";
import { ReadingResult } from "./reading-result";

type Step =
  | { name: "topic" }
  | { name: "setup"; topic: Topic }
  | { name: "pick"; topic: Topic; question: string; spread: Spread; allowReversed: boolean; seed: string }
  | { name: "loading" }
  | { name: "result"; reading: Reading; initiallyRevealed: boolean };

async function requestReading(request: ReadingRequest): Promise<Reading> {
  const res = await fetch("/api/tarot/reading", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "타로를 해석하지 못했어요.");
  return data as Reading;
}

const historyTitle = (topic: Topic, spreadName: string) => `${TOPICS[topic].label} · ${spreadName}`;

function TopicStep({ onSelect, onOpen }: { onSelect: (topic: Topic) => void; onOpen: (entry: HistoryEntry) => void }) {
  const raw = useTarotHistoryRaw();
  const history = useMemo(() => parseHistory(raw).slice(0, 5), [raw]);

  return (
    <div className="flex flex-col gap-5">
      <section>
        <h2 className="font-bold">무엇이 궁금한가요?</h2>
        <ul className="mt-3 grid grid-cols-2 gap-2">
          {TOPIC_IDS.map((id) => (
            <li key={id}>
              <button
                type="button"
                onClick={() => onSelect(id)}
                className="flex w-full items-center gap-2 rounded-xl border border-border bg-card px-3 py-3 text-left font-medium transition hover:border-accent"
              >
                <span aria-hidden>{TOPICS[id].emoji}</span>
                {TOPICS[id].label}
              </button>
            </li>
          ))}
        </ul>
      </section>

      <Link href="/tarot/cards" className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3 text-sm">
        <span>
          <span className="font-medium">📖 타로 카드 사전</span>
          <span className="block text-xs text-muted">78장 카드의 정·역방향 의미 살펴보기</span>
        </span>
        <span aria-hidden className="text-muted">→</span>
      </Link>

      {history.length > 0 && (
        <section>
          <h2 className="text-sm font-bold text-muted">최근 본 타로</h2>
          <ul className="mt-2 flex flex-col divide-y divide-border rounded-xl border border-border bg-card">
            {history.map((entry) => (
              <li key={entry.request.seed}>
                <button type="button" onClick={() => onOpen(entry)} className="flex w-full flex-col px-3 py-2.5 text-left">
                  <span className="text-sm font-medium">{entry.request.question || entry.title}</span>
                  <span className="text-xs text-muted">
                    {new Date(entry.createdAt).toLocaleDateString("ko-KR")} · {entry.title} · {entry.summary}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function SetupStep({
  topic,
  onBack,
  onStart,
}: {
  topic: Topic;
  onBack: () => void;
  onStart: (options: { question: string; spread: Spread; allowReversed: boolean }) => void;
}) {
  const recommended = spreadsForTopic(topic);
  const [question, setQuestion] = useState("");
  const [spreadId, setSpreadId] = useState(recommended[0].id);
  const [showAll, setShowAll] = useState(false);
  const [allowReversed, setAllowReversed] = useState(true);
  const spreads = showAll ? SPREADS : recommended;
  const spread = SPREADS.find((s) => s.id === spreadId) ?? recommended[0];

  return (
    <div className="flex flex-col gap-5">
      <button type="button" onClick={onBack} className="self-start text-sm text-muted">
        ← 주제 다시 고르기
      </button>

      <section className="flex flex-col gap-2">
        <label htmlFor="question" className="font-bold">
          {TOPICS[topic].emoji} {TOPICS[topic].label} — 질문을 적어 주세요 <span className="text-sm font-normal text-muted">(선택)</span>
        </label>
        <textarea
          id="question"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          maxLength={200}
          rows={2}
          placeholder={TOPICS[topic].examples[0]}
          className="w-full resize-none rounded-xl border border-border bg-card px-3 py-2.5 outline-none focus:border-accent"
        />
        <ul className="flex flex-wrap gap-1.5">
          {TOPICS[topic].examples.map((example) => (
            <li key={example}>
              <button type="button" onClick={() => setQuestion(example)} className="rounded-full bg-accent-soft px-2.5 py-1 text-xs text-accent">
                {example}
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="font-bold">스프레드</h2>
        <div role="radiogroup" aria-label="스프레드" className="flex flex-col gap-2">
          {spreads.map((s, i) => (
            <button
              key={s.id}
              type="button"
              role="radio"
              aria-checked={s.id === spread.id}
              onClick={() => setSpreadId(s.id)}
              className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5 text-left transition ${
                s.id === spread.id ? "border-accent bg-accent-soft" : "border-border bg-card"
              }`}
            >
              <span>
                <span className="font-medium">{s.name}</span>
                {!showAll && i === 0 && <span className="ml-1.5 rounded bg-gold/20 px-1.5 py-0.5 text-[0.65rem] text-gold">추천</span>}
                {s.level === "advanced" && <span className="ml-1.5 text-[0.65rem] text-muted">고급</span>}
                <span className="block text-xs text-muted">{s.description}</span>
              </span>
              <span className="shrink-0 text-sm text-muted">{s.positions.length}장</span>
            </button>
          ))}
        </div>
        {!showAll && (
          <button type="button" onClick={() => setShowAll(true)} className="self-start text-sm text-muted underline underline-offset-2">
            다른 스프레드 보기
          </button>
        )}
        <p className="text-xs text-muted">{spread.positions.map((p) => p.label).join(" → ")}</p>
      </section>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={allowReversed} onChange={(e) => setAllowReversed(e.target.checked)} className="size-4 accent-accent" />
        역방향 카드 포함
      </label>

      <button
        type="button"
        onClick={() => onStart({ question: question.trim(), spread, allowReversed })}
        className="rounded-xl bg-accent py-3 font-medium text-white dark:text-background"
      >
        카드 섞기
      </button>
    </div>
  );
}

export function TarotApp() {
  const [step, setStep] = useState<Step>({ name: "topic" });
  const [error, setError] = useState<string | null>(null);

  async function show(request: ReadingRequest, fromHistory: boolean) {
    setError(null);
    setStep({ name: "loading" });
    try {
      const reading = await requestReading(request);
      if (!fromHistory) saveToHistory(reading, historyTitle(reading.topic, reading.spread.name));
      setStep({ name: "result", reading, initiallyRevealed: fromHistory });
    } catch (e) {
      setError(e instanceof Error ? e.message : "타로를 해석하지 못했어요.");
      setStep({ name: "topic" });
    }
    window.scrollTo({ top: 0 });
  }

  return (
    <div className="flex flex-col gap-4">
      {error && (
        <p role="alert" className="rounded-xl border border-rose-300 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-300">
          {error}
        </p>
      )}

      {step.name === "topic" && (
        <TopicStep onSelect={(topic) => setStep({ name: "setup", topic })} onOpen={(entry) => show(entry.request, true)} />
      )}

      {step.name === "setup" && (
        <SetupStep
          topic={step.topic}
          onBack={() => setStep({ name: "topic" })}
          onStart={(options) => setStep({ name: "pick", topic: step.topic, seed: crypto.randomUUID(), ...options })}
        />
      )}

      {step.name === "pick" && (
        <CardFan
          spread={step.spread}
          onDone={(picks) =>
            show(
              {
                topic: step.topic,
                question: step.question || undefined,
                spreadId: step.spread.id,
                seed: step.seed,
                picks,
                allowReversed: step.allowReversed,
              },
              false,
            )
          }
        />
      )}

      {step.name === "loading" && (
        <div aria-busy className="flex flex-col items-center gap-3 py-16 text-muted">
          <span className="animate-spin text-3xl text-gold">✦</span>
          카드를 읽고 있어요…
        </div>
      )}

      {step.name === "result" && (
        <ReadingResult
          key={step.reading.seed}
          reading={step.reading}
          initiallyRevealed={step.initiallyRevealed}
          onRetry={() => setStep({ name: "setup", topic: step.reading.topic })}
          onHome={() => setStep({ name: "topic" })}
        />
      )}
    </div>
  );
}
