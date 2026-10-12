"use client";

import { useEffect, useState } from "react";

export type FetchState<T> = { status: "loading" } | { status: "error"; message: string } | { status: "done"; data: T };

/** POST로 계산 결과를 받아 온다. 입력이 바뀌면 부모에서 key를 바꿔 다시 마운트한다 (이전 요청은 취소) */
export function usePostJson<T>(url: string, body: unknown, fallbackError: string): FetchState<T> {
  const [state, setState] = useState<FetchState<T>>({ status: "loading" });
  const payload = JSON.stringify(body);

  useEffect(() => {
    const controller = new AbortController();
    fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: payload, signal: controller.signal })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? fallbackError);
        setState({ status: "done", data: data as T });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setState({ status: "error", message: error instanceof Error ? error.message : fallbackError });
      });
    return () => controller.abort();
  }, [url, payload, fallbackError]);

  return state;
}
