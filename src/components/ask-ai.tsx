"use client";

import { track } from "@vercel/analytics";
import { useMemo, useState } from "react";
import { AI_TARGETS, aiChatUrl, type AiTarget } from "@/lib/ai-handoff";

type Status = { kind: "idle" } | { kind: "opened"; target: AiTarget; prefilled: boolean; copied: boolean } | { kind: "copied" | "copy-failed" };

const PASTE_HINT = "새 창의 입력창에 붙여넣기(PC: Ctrl+V · 휴대폰: 길게 눌러 붙여넣기) 해 주세요.";

function statusText(status: Status): string | null {
  switch (status.kind) {
    case "idle":
      return null;
    case "copied":
      return `프롬프트를 복사했어요. 사용하는 AI에 붙여 넣어 보세요.`;
    case "copy-failed":
      return "복사하지 못했어요. 브라우저의 클립보드 권한을 확인해 주세요.";
    case "opened": {
      const name = AI_TARGETS[status.target];
      if (status.prefilled) return `${name}에 질문을 채워 두었어요. 새 창에서 전송만 누르면 돼요.`;
      return status.copied ? `프롬프트를 복사했어요. ${name} ${PASTE_HINT}` : `${name}을(를) 열었지만 복사에 실패했어요. 아래 '프롬프트만 복사'를 눌러 주세요.`;
    }
  }
}

/** 어느 화면에서 넘겼는지 — 클릭 집계용 */
export type AskAiSource = "today" | "tarot" | "saju" | "compat";

/**
 * 결과를 사용자의 ChatGPT·Gemini로 넘겨 더 깊게 물어보기 — 우리 쪽 AI 비용 없음.
 * prompts는 긴 것부터: 첫 번째(전체)는 클립보드에, 주소에 실을 수 있는 첫 프롬프트는 ChatGPT 입력창에.
 * 버튼 클릭은 Vercel Analytics 커스텀 이벤트(ai_handoff)로 센다 — 요금제가 지원하지 않으면 전송되지 않을 뿐 동작에는 영향 없음.
 */
export function AskAi({ prompts, description, notice, source }: { prompts: string[]; description: string; notice: string; source: AskAiSource }) {
  const prompt = prompts[0];
  const links = useMemo(() => ({ chatgpt: aiChatUrl("chatgpt", prompts), gemini: aiChatUrl("gemini", prompts) }), [prompts]);
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  // 새 탭이 열리기 전(아직 이 페이지에 포커스가 있을 때) 복사를 시작해야 브라우저가 허용한다
  const copy = () => navigator.clipboard?.writeText(prompt) ?? Promise.reject(new Error("clipboard unavailable"));

  function open(target: AiTarget) {
    const { prefilled } = links[target];
    track("ai_handoff", { target, source, prefilled });
    copy().then(
      () => setStatus({ kind: "opened", target, prefilled, copied: true }),
      () => setStatus({ kind: "opened", target, prefilled, copied: false }),
    );
  }

  const message = statusText(status);

  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5">
      <div>
        <h3 className="font-bold">🤖 AI에게 더 깊게 물어보기</h3>
        <p className="mt-1 text-sm leading-relaxed text-muted">{description}</p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {(Object.keys(AI_TARGETS) as AiTarget[]).map((target) => (
          <a
            key={target}
            href={links[target].url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => open(target)}
            className="rounded-xl border border-accent py-3 text-center text-sm font-medium text-accent"
          >
            {AI_TARGETS[target]}에서 이어 보기 ↗
          </a>
        ))}
      </div>
      <button
        type="button"
        onClick={() => {
          track("ai_handoff", { target: "copy", source, prefilled: false });
          copy().then(() => setStatus({ kind: "copied" }), () => setStatus({ kind: "copy-failed" }));
        }}
        className="self-center text-sm text-muted underline underline-offset-2"
      >
        프롬프트만 복사
      </button>
      {message && (
        <p role="status" className="rounded-xl bg-accent-soft p-3 text-sm leading-relaxed text-accent">
          {message}
        </p>
      )}
      <p className="text-xs leading-relaxed text-muted">{notice} 해당 서비스의 개인정보 처리 방침이 적용됩니다.</p>
    </section>
  );
}
