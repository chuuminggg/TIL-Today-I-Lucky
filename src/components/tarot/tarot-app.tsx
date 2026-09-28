"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  clearHistory,
  parseHistory,
  recentSameTopic,
  removeFromHistory,
  saveToHistory,
  useTarotHistoryRaw,
  type HistoryEntry,
} from "@/lib/tarot/history";
import type { Reading, ReadingRequest } from "@/lib/tarot/interpret";
import { loadTarotSettings, saveTarotSettings } from "@/lib/tarot/settings";
import { SPREADS, spreadsForTopic, TOPIC_IDS, TOPICS, type Spread, type Topic } from "@/lib/tarot/spreads";
import { CardFan } from "./card-fan";
import { ReadingResult } from "./reading-result";

type Step =
  | { name: "topic" }
  | { name: "setup"; topic: Topic }
  | { name: "pick"; topic: Topic; question: string; spread: Spread; allowReversed: boolean; seed: string }
  | { name: "loading" }
  | { name: "result"; reading: Reading; initiallyRevealed: boolean };

const NETWORK_ERROR = "인터넷 연결을 확인하고 다시 시도해 주세요.";

async function requestReading(request: ReadingRequest): Promise<Reading> {
  const res = await fetch("/api/tarot/reading", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  }).catch(() => {
    throw new Error(NETWORK_ERROR);
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? "타로를 해석하지 못했어요.");
  return data as Reading;
}

const historyTitle = (topic: Topic, spreadName: string) => `${TOPICS[topic].label} · ${spreadName}`;

function TopicStep({ onSelect, onOpen }: { onSelect: (topic: Topic) => void; onOpen: (entry: HistoryEntry) => void }) {
  const raw = useTarotHistoryRaw();
  const all = useMemo(() => parseHistory(raw), [raw]);
  const [expanded, setExpanded] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const history = expanded ? all : all.slice(0, 5);

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
          <div className="flex items-baseline justify-between">
            <h2 className="text-sm font-bold text-muted">{expanded ? `본 타로 기록 ${all.length}개` : "최근 본 타로"}</h2>
            {(all.length > 5 || expanded) && (
              <button
                type="button"
                onClick={() => {
                  setExpanded((v) => !v);
                  setConfirmClear(false);
                }}
                className="text-xs text-muted underline underline-offset-2"
              >
                {expanded ? "접기" : `전체 보기 (${all.length})`}
              </button>
            )}
          </div>
          <ul className="mt-2 flex flex-col divide-y divide-border rounded-xl border border-border bg-card">
            {history.map((entry) => (
              <li key={entry.request.seed} className="flex items-center">
                <button type="button" onClick={() => onOpen(entry)} className="flex min-w-0 flex-1 flex-col px-3 py-2.5 text-left">
                  <span className="truncate text-sm font-medium">{entry.request.question || entry.title}</span>
                  <span className="truncate text-xs text-muted">
                    {new Date(entry.createdAt).toLocaleDateString("ko-KR")} · {entry.title} · {entry.summary}
                  </span>
                </button>
                {expanded && (
                  <button
                    type="button"
                    onClick={() => removeFromHistory(entry.request.seed)}
                    aria-label={`${entry.request.question || entry.title} 기록 삭제`}
                    className="shrink-0 px-3 py-2.5 text-muted hover:text-foreground"
                  >
                    ✕
                  </button>
                )}
              </li>
            ))}
          </ul>
          {expanded && (
            <div className="mt-2 flex items-center justify-end gap-2 text-xs">
              {confirmClear ? (
                <>
                  <span className="text-muted">기록 {all.length}개를 모두 지울까요?</span>
                  <button type="button" onClick={() => setConfirmClear(false)} className="rounded-lg border border-border px-2.5 py-1">
                    취소
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      clearHistory();
                      setConfirmClear(false);
                      setExpanded(false);
                    }}
                    className="rounded-lg bg-rose-600 px-2.5 py-1 font-medium text-white"
                  >
                    모두 지우기
                  </button>
                </>
              ) : (
                <button type="button" onClick={() => setConfirmClear(true)} className="text-muted underline underline-offset-2">
                  기록 모두 지우기
                </button>
              )}
            </div>
          )}
          <p className="mt-1.5 text-[0.7rem] text-muted">기록은 이 기기에만 저장돼요 (최근 20개).</p>
        </section>
      )}
    </div>
  );
}

function SetupStep({
  topic,
  onBack,
  onStart,
  onOpen,
}: {
  topic: Topic;
  onBack: () => void;
  onStart: (options: { question: string; spread: Spread; allowReversed: boolean }) => void;
  onOpen: (entry: HistoryEntry) => void;
}) {
  const recommended = spreadsForTopic(topic);
  const [question, setQuestion] = useState("");
  const [spreadId, setSpreadId] = useState(recommended[0].id);
  const [showAll, setShowAll] = useState(false);
  // 설정 화면은 주제를 고른 뒤에만 그려지므로(서버 렌더 없음) 기기 저장값을 바로 읽어도 된다
  const [allowReversed, setAllowReversed] = useState(() => loadTarotSettings().allowReversed);
  const [openedAt] = useState(() => Date.now());
  const raw = useTarotHistoryRaw();
  const [recent] = useMemo(() => recentSameTopic(parseHistory(raw), topic, openedAt), [raw, topic, openedAt]);
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
        <input
          type="checkbox"
          checked={allowReversed}
          onChange={(e) => {
            setAllowReversed(e.target.checked);
            saveTarotSettings({ allowReversed: e.target.checked });
          }}
          className="size-4 accent-accent"
        />
        역방향 카드 포함 <span className="text-xs text-muted">(다음에도 기억해요)</span>
      </label>

      {recent && (
        <div className="rounded-xl border border-gold/40 bg-gold/10 p-3 text-sm leading-relaxed">
          <p>
            🕯️ 조금 전에도 {TOPICS[topic].label} 타로를 봤어요. 같은 질문을 짧은 시간에 반복해서 뽑으면 카드의 메시지가 흐려질 수 있어요.
            앞의 결과를 먼저 곱씹어 보는 건 어떨까요?
          </p>
          <button type="button" onClick={() => onOpen(recent)} className="mt-1.5 text-sm font-medium text-accent underline underline-offset-2">
            앞의 결과 다시 보기
          </button>
        </div>
      )}

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
          onOpen={(entry) => show(entry.request, true)}
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
