"use client";

import Link from "next/link";
import { useState } from "react";
import { hourKST } from "@/lib/calendar/kst";
import { HIT_LABEL, MEMO_MAX, retroTarget, type Hit, type Journal } from "@/lib/journal/journal";
import { recordRetro } from "@/lib/journal/storage";

const HIT_EMOJI: Record<Hit, string> = { yes: "👍", half: "🤏", no: "👎" };

/** "오늘 어땠나요?" — 낮에는 어제, 저녁 6시 이후에는 오늘의 운세가 맞았는지 묻는다 */
export function RetroCard({ journal, today }: { journal: Journal; today: string }) {
  // 결과를 받은 뒤에만 렌더링되므로 초기값에서 시각을 읽어도 하이드레이션과 충돌하지 않는다
  const [target] = useState(() => retroTarget(journal, today, hourKST()));
  const [hit, setHit] = useState<Hit | null>(null);
  const [memo, setMemo] = useState("");
  const [saved, setSaved] = useState(false);

  if (!target) return null;
  const when = target.date === today ? "오늘" : "어제";

  if (saved) {
    return (
      <section className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card px-5 py-4 text-sm">
        <p>📝 {when}의 회고를 남겼어요.</p>
        <Link href="/calendar" className="shrink-0 font-medium text-accent underline underline-offset-2">
          캘린더 보기
        </Link>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-accent/40 bg-accent-soft/60 p-5">
      <div>
        <h2 className="text-xs font-medium text-accent">{when} 어땠나요?</h2>
        <p className="mt-1 font-bold">{target.fortune!.headline}</p>
        <p className="mt-0.5 text-sm text-muted">
          {target.fortune!.score}점{target.tarot?.name && ` · ${target.tarot.name}${target.tarot.reversed ? " 역방향" : ""}`}
        </p>
      </div>
      <div role="radiogroup" aria-label={`${when} 운세가 맞았나요?`} className="grid grid-cols-3 gap-2">
        {(Object.keys(HIT_LABEL) as Hit[]).map((value) => (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={hit === value}
            onClick={() => setHit(value)}
            className="rounded-xl border border-border bg-card py-2 text-sm font-medium aria-checked:border-accent aria-checked:bg-accent aria-checked:text-white dark:aria-checked:text-background"
          >
            {HIT_EMOJI[value]} {HIT_LABEL[value]}
          </button>
        ))}
      </div>
      {hit && (
        <form
          className="flex flex-col gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            recordRetro(target.date, hit, memo);
            setSaved(true);
          }}
        >
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-muted">한 줄 메모 (선택)</span>
            <input
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              maxLength={MEMO_MAX}
              placeholder={when === "오늘" ? "오늘 있었던 일을 한 줄로" : "어제 있었던 일을 한 줄로"}
              className="rounded-xl border border-border bg-card px-3 py-2"
            />
          </label>
          <button type="submit" className="rounded-xl bg-accent py-2.5 text-sm font-medium text-white dark:text-background">
            기록하기
          </button>
        </form>
      )}
    </section>
  );
}
