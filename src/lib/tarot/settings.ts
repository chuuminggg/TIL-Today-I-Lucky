"use client";

import { readStorage, writeStorage } from "@/lib/local-storage";

const KEY = "til:tarot-settings";

/** 기기에 기억해 두는 타로 설정 */
export interface TarotSettings {
  allowReversed: boolean;
}

const DEFAULTS: TarotSettings = { allowReversed: true };

export function loadTarotSettings(): TarotSettings {
  try {
    const parsed: unknown = JSON.parse(readStorage(KEY) ?? "{}");
    const allowReversed = (parsed as Partial<TarotSettings>)?.allowReversed;
    return { allowReversed: typeof allowReversed === "boolean" ? allowReversed : DEFAULTS.allowReversed };
  } catch {
    return DEFAULTS;
  }
}

export function saveTarotSettings(settings: TarotSettings) {
  writeStorage(KEY, JSON.stringify(settings));
}
