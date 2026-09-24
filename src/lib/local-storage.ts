"use client";

export function readStorage(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null; // 사생활 보호 모드 등에서 storage 접근이 막힌 경우
  }
}

export function writeStorage(key: string, value: string | null) {
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, value);
  } catch {
    // 저장 실패 시에도 이번 방문은 동작하도록 무시
  }
}

/** useSyncExternalStore용 구독 — 다른 탭(storage)과 같은 탭(커스텀 이벤트) 변경을 모두 받는다 */
export function subscribeStorage(event: string) {
  return (onChange: () => void) => {
    window.addEventListener("storage", onChange);
    window.addEventListener(event, onChange);
    return () => {
      window.removeEventListener("storage", onChange);
      window.removeEventListener(event, onChange);
    };
  };
}
