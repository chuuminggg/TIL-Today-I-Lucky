"use client";

import { useEffect, useState } from "react";
import { readStorage, writeStorage } from "@/lib/local-storage";

const DISMISSED = "til:install-hint-dismissed";

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
}

type Platform = "prompt" | "ios" | "other";

function detectPlatform(): Platform | null {
  if (readStorage(DISMISSED) === "1") return null;
  if (window.matchMedia("(display-mode: standalone)").matches || (navigator as { standalone?: boolean }).standalone) return null;
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  return ios ? "ios" : "other";
}

/**
 * 두 번째 방문부터 "홈 화면에 추가" 안내. 닫으면 다시 띄우지 않는다.
 * Android Chrome은 설치 창을 바로 띄우고, iOS Safari는 공유 버튼 경로를 알려 준다.
 */
export function InstallHint({ visits }: { visits: number }) {
  // 운세 결과를 받은 뒤에만 렌더링되므로 초기값에서 브라우저 환경을 읽어도 하이드레이션과 충돌하지 않는다
  const [platform, setPlatform] = useState<Platform | null>(detectPlatform);
  const [promptEvent, setPromptEvent] = useState<InstallPromptEvent | null>(null);

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setPromptEvent(e as InstallPromptEvent);
      setPlatform((current) => (current ? "prompt" : current));
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  if (visits < 2 || !platform || platform === "other") return null;

  const dismiss = () => {
    writeStorage(DISMISSED, "1");
    setPlatform(null);
  };

  return (
    <section className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4 text-sm">
      <span aria-hidden className="text-2xl">📲</span>
      <div className="flex-1">
        <p className="font-medium">홈 화면에 추가하면 매일 한 번에 열 수 있어요</p>
        {platform === "ios" ? (
          <p className="mt-1 text-muted">Safari 아래쪽 공유 버튼(□↑) → &lsquo;홈 화면에 추가&rsquo;를 눌러 주세요.</p>
        ) : (
          <button
            type="button"
            onClick={async () => {
              await promptEvent?.prompt();
              dismiss();
            }}
            className="mt-2 rounded-lg bg-accent px-3 py-1.5 font-medium text-white dark:text-background"
          >
            홈 화면에 추가
          </button>
        )}
      </div>
      <button type="button" onClick={dismiss} aria-label="안내 닫기" className="text-muted">
        ✕
      </button>
    </section>
  );
}
