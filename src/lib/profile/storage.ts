"use client";

import { useSyncExternalStore } from "react";
import { readStorage as read, subscribeStorage, writeStorage as write } from "@/lib/local-storage";
import { birthProfileSchema, type BirthProfileInput } from "./schema";

const KEY = "til:profile";
const EVENT = "til:profile-change";
const subscribe = subscribeStorage(EVENT);

/**
 * 저장된 프로필 원문(JSON 문자열).
 * 서버 렌더링·하이드레이션 중에는 undefined(로딩), 저장된 값이 없으면 null.
 */
export function useStoredProfileRaw(): string | null | undefined {
  return useSyncExternalStore(subscribe, () => read(KEY), () => undefined);
}

export function parseProfile(raw: string | null | undefined): BirthProfileInput | null {
  if (!raw) return null;
  try {
    const parsed = birthProfileSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export function saveProfile(profile: BirthProfileInput) {
  write(KEY, JSON.stringify(profile));
  window.dispatchEvent(new Event(EVENT));
}

const tarotKey = (date: string) => `til:tarot-revealed:${date}`;

export const isTarotRevealed = (date: string) => read(tarotKey(date)) === "1";
export const markTarotRevealed = (date: string) => write(tarotKey(date), "1");
