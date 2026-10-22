"use client";

import { useMemo, useSyncExternalStore } from "react";
import { readStorage, subscribeStorage, writeStorage } from "@/lib/local-storage";
import { applyBackup, BACKUP_KEYS, buildBackup, parseBackup, type Backup } from "./backup";
import { MEMO_MAX, parseJournal, updateDay, withReading, type Hit, type Journal, type JournalDay, type JournalReading, type JournalTarot } from "./journal";

const KEY = BACKUP_KEYS.journal;
const EVENT = "til:journal-change";
const subscribe = subscribeStorage(EVENT);

/** 서버 렌더링·하이드레이션 중에는 undefined(로딩) */
export function useJournal(): Journal | undefined {
  const raw = useSyncExternalStore(subscribe, () => readStorage(KEY), () => undefined);
  return useMemo(() => (raw === undefined ? undefined : parseJournal(raw)), [raw]);
}

function change(date: string, patch: (day: JournalDay) => Partial<JournalDay>) {
  const next = updateDay(parseJournal(readStorage(KEY)), date, patch);
  writeStorage(KEY, JSON.stringify(next));
  window.dispatchEvent(new Event(EVENT));
}

/** 홈에서 오늘의 운세를 불러왔을 때 — 같은 날 다시 와도 첫 방문 시각은 그대로 */
export const recordFortune = (date: string, fortune: { score: number; headline: string }, tarot: JournalTarot) =>
  change(date, () => ({ fortune, tarot }));

/** 상세 타로 결과가 나왔을 때 */
export const recordReading = (date: string, reading: JournalReading) => change(date, (day) => ({ readings: withReading(day, reading) }));

export const recordRetro = (date: string, hit: Hit, memo: string) =>
  change(date, () => ({ hit, memo: memo.trim().slice(0, MEMO_MAX) || undefined }));

const readAll = () => Object.fromEntries(Object.entries(BACKUP_KEYS).map(([name, key]) => [name, readStorage(key)]));

export function exportBackup(): Backup {
  return buildBackup(readAll());
}

/** 백업 파일을 읽어 기기 기록과 합친다. 바뀐 화면이 바로 반영되도록 각 저장소의 변경 이벤트를 보낸다 */
export function importBackup(text: string): { days: number } {
  const backup = parseBackup(text);
  const next = applyBackup(readAll(), backup);
  for (const [name, key] of Object.entries(BACKUP_KEYS)) writeStorage(key, next[name as keyof typeof BACKUP_KEYS]);
  for (const event of [EVENT, "til:profile-change", "til:tarot-history-change", "til:saju-favorites-change"]) {
    window.dispatchEvent(new Event(event));
  }
  return { days: Object.keys(backup.journal).length };
}

