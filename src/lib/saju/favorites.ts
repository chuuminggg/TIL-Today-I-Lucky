"use client";

import { useSyncExternalStore } from "react";
import { readStorage, subscribeStorage, writeStorage } from "@/lib/local-storage";
import { birthProfileSchema, type BirthProfileInput } from "@/lib/profile/schema";

// 자주 보는 사람(가족·친구 등)의 사주 즐겨찾기 — 이 기기에만 저장한다

const KEY = "til:saju-favorites";
const EVENT = "til:saju-favorites-change";
export const MAX_FAVORITES = 20;
const subscribe = subscribeStorage(EVENT);

export interface Favorite {
  id: string;
  label: string; // 목록에 보일 이름
  profile: BirthProfileInput;
  savedAt: string; // ISO
}

/** 같은 사람인가 — 이름이 아니라 사주 계산에 쓰는 값으로 비교한다 */
export const sameBirth = (a: BirthProfileInput, b: BirthProfileInput) =>
  a.calendar === b.calendar &&
  Boolean(a.isLeapMonth) === Boolean(b.isLeapMonth) &&
  a.birthDate === b.birthDate &&
  (a.birthTime ?? "") === (b.birthTime ?? "") &&
  a.gender === b.gender;

export function parseFavorites(raw: string | null | undefined): Favorite[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap((item) => {
      const profile = birthProfileSchema.safeParse(item?.profile);
      return profile.success && typeof item.id === "string" && typeof item.label === "string"
        ? [{ id: item.id, label: item.label, profile: profile.data, savedAt: String(item.savedAt ?? "") }]
        : [];
    });
  } catch {
    return [];
  }
}

/** 맨 앞에 추가한다. 같은 사람이 이미 있으면 이름만 바꿔 맨 앞으로 올린다. */
export function addFavorite(list: Favorite[], entry: Favorite): Favorite[] {
  const existing = list.find((f) => sameBirth(f.profile, entry.profile));
  if (existing) return [{ ...existing, label: entry.label, profile: entry.profile }, ...list.filter((f) => f !== existing)];
  if (list.length >= MAX_FAVORITES) throw new Error(`즐겨찾기는 최대 ${MAX_FAVORITES}명까지 저장할 수 있어요. 안 보는 사람을 지운 뒤 다시 저장해 주세요.`);
  return [entry, ...list];
}

export const removeFavorite = (list: Favorite[], id: string) => list.filter((f) => f.id !== id);

export function useFavoritesRaw(): string | null | undefined {
  return useSyncExternalStore(subscribe, () => readStorage(KEY), () => undefined);
}

function write(list: Favorite[]) {
  writeStorage(KEY, JSON.stringify(list));
  window.dispatchEvent(new Event(EVENT));
}

/** 저장하고 그 즐겨찾기의 id를 돌려준다 (같은 사람이면 기존 id) */
export function saveFavorite(label: string, profile: BirthProfileInput): string {
  const list = addFavorite(parseFavorites(readStorage(KEY)), {
    id: crypto.randomUUID(),
    label: label.trim() || profile.name || "이름 없음",
    profile,
    savedAt: new Date().toISOString(),
  });
  write(list);
  return list[0].id;
}

export function deleteFavorite(id: string) {
  write(removeFavorite(parseFavorites(readStorage(KEY)), id));
}
