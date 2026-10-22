"use client";

import { useState } from "react";
import { shareOrCopy } from "@/lib/share";
import type { Reading } from "@/lib/tarot/interpret";
import { shareQuery } from "@/lib/tarot/share";
import { TOPICS } from "@/lib/tarot/spreads";

/** 결과 공유 링크 — 질문은 체크했을 때만 주소에 싣는다 */
export function ShareButton({ reading }: { reading: Reading }) {
  const [includeQuestion, setIncludeQuestion] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function share() {
    const url = `${window.location.origin}/tarot/r?${shareQuery(reading, includeQuestion)}`;
    const text = `${TOPICS[reading.topic].emoji} ${TOPICS[reading.topic].label} 타로 — ${reading.summary.title}`;
    try {
      const result = await shareOrCopy({ title: "TIL 타로", text, url });
      if (result === "copied") setMessage(includeQuestion ? "링크를 복사했어요. 질문도 함께 보여요." : "링크를 복사했어요. 질문은 들어가지 않아요.");
    } catch {
      setMessage("공유하지 못했어요.");
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button type="button" onClick={share} className="rounded-xl border border-accent py-3 text-sm font-medium text-accent">
        🔗 결과 공유하기
      </button>
      {reading.question && (
        <label className="flex items-center justify-center gap-2 text-xs text-muted">
          <input
            type="checkbox"
            checked={includeQuestion}
            onChange={(e) => {
              setIncludeQuestion(e.target.checked);
              setMessage(null);
            }}
            className="size-3.5 accent-accent"
          />
          공유할 때 질문도 보여 주기
        </label>
      )}
      {message && (
        <p role="status" className="text-center text-xs text-muted">
          {message}
        </p>
      )}
    </div>
  );
}
