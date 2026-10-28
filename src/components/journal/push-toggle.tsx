"use client";

import { useEffect, useState } from "react";
import { currentPushState, disablePush, enablePush, type PushState } from "@/lib/push/client";

const STATE_TEXT: Record<Exclude<PushState, "unavailable">, string> = {
  "needs-install": "iPhone·iPad는 홈 화면에 추가한 TIL 앱에서 알림을 받을 수 있어요. Safari 공유 버튼(□↑) → '홈 화면에 추가' 후 앱으로 열어 주세요. (iOS 16.4 이상)",
  unsupported: "이 브라우저는 알림을 지원하지 않아요. Android는 Chrome, iPhone은 홈 화면에 추가한 앱에서 받을 수 있어요.",
  denied: "알림이 차단돼 있어요. 브라우저(또는 휴대폰) 설정에서 이 사이트의 알림을 허용한 뒤 다시 눌러 주세요.",
  off: "매일 아침 8시에 오늘의 일진과 함께 운세·카드가 도착했다고 알려 드려요.",
  on: "매일 아침 8시에 알림을 보내 드려요. 생년월일은 서버에 보내지 않아요.",
};

/** 아침 알림 켜고 끄기. compact면 홈 안내 카드처럼 짧게 — 켜져 있거나 쓸 수 없으면 아무것도 그리지 않는다 */
export function PushToggle({ compact = false, onDismiss }: { compact?: boolean; onDismiss?: () => void }) {
  const [state, setState] = useState<PushState | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    currentPushState()
      .then((s) => alive && setState(s))
      .catch(() => alive && setState("unsupported"));
    return () => {
      alive = false;
    };
  }, []);

  if (!state || state === "unavailable") return null;
  if (compact && state !== "off") return null;

  async function toggle() {
    setBusy(true);
    setError(null);
    try {
      setState(state === "on" ? await disablePush() : await enablePush());
    } catch (e) {
      setError(e instanceof Error ? e.message : "알림 설정을 바꾸지 못했어요.");
    } finally {
      setBusy(false);
    }
  }

  const canToggle = state === "on" || state === "off" || state === "denied";
  return (
    <section className={`flex flex-col gap-2 rounded-2xl border border-border bg-card text-sm ${compact ? "p-4" : "p-5"}`}>
      <div className="flex items-start gap-3">
        <span aria-hidden className="text-2xl">
          🔔
        </span>
        <div className="flex-1">
          <h2 className={compact ? "font-medium" : "text-xs font-medium text-accent"}>{compact ? "매일 아침 알림 받기" : "아침 알림"}</h2>
          <p className="mt-1 leading-relaxed text-muted">{STATE_TEXT[state]}</p>
        </div>
        {onDismiss && (
          <button type="button" onClick={onDismiss} aria-label="안내 닫기" className="text-muted">
            ✕
          </button>
        )}
      </div>
      {canToggle && (
        <button
          type="button"
          role="switch"
          aria-checked={state === "on"}
          disabled={busy}
          onClick={toggle}
          className={`rounded-xl py-2.5 font-medium disabled:opacity-50 ${
            state === "on" ? "border border-border" : "bg-accent text-white dark:text-background"
          }`}
        >
          {busy ? "설정 중…" : state === "on" ? "알림 끄기" : "알림 켜기"}
        </button>
      )}
      {error && (
        <p role="alert" className="text-rose-600 dark:text-rose-400">
          {error}
        </p>
      )}
    </section>
  );
}
