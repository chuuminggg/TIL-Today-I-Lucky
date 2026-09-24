"use client";

import { useSyncExternalStore } from "react";
import { readStorage, subscribeStorage, writeStorage } from "@/lib/local-storage";
import type { Reading, ReadingRequest } from "./interpret";

const KEY = "til:tarot-history";
const EVENT = "til:tarot-history-change";
const MAX = 20;
const subscribe = subscribeStorage(EVENT);

/** 결과 전체가 아니라 요청만 저장한다 — 같은 요청이면 서버에서 같은 해석이 다시 나온다 */
export interface HistoryEntry {
  createdAt: string; // ISO
  request: ReadingRequest;
  title: string; // "연애 · 과거·현재·미래"
  summary: string; // 결론 카드 제목
}

export function useTarotHistoryRaw(): string | null | undefined {
  return useSyncExternalStore(subscribe, () => readStorage(KEY), () => undefined);
}

export function parseHistory(raw: string | null | undefined): HistoryEntry[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as HistoryEntry[]) : [];
  } catch {
    return [];
  }
}

export function saveToHistory(reading: Reading, title: string) {
  const { topic, question, seed, picks, allowReversed } = reading;
  const entry: HistoryEntry = {
    createdAt: new Date().toISOString(),
    request: { topic, question, spreadId: reading.spread.id, seed, picks, allowReversed },
    title,
    summary: reading.summary.title,
  };
  const rest = parseHistory(readStorage(KEY)).filter((e) => e.request.seed !== seed);
  writeStorage(KEY, JSON.stringify([entry, ...rest].slice(0, MAX)));
  window.dispatchEvent(new Event(EVENT));
}
