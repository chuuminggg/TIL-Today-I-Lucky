import { birthProfileSchema, type BirthProfileInput } from "@/lib/profile/schema";
import { parseFavorites } from "@/lib/saju/favorites";
import { readingRequestSchema } from "@/lib/tarot/schema";
import { mergeJournals, parseJournal, type Journal } from "./journal";

// 기기 저장 데이터 백업 — 기기를 바꿔도 이어 갈 수 있게 JSON 파일로 내보내고 가져온다.

export const BACKUP_KEYS = {
  profile: "til:profile",
  journal: "til:journal",
  tarotHistory: "til:tarot-history",
  favorites: "til:saju-favorites",
} as const;

type Raw = Partial<Record<keyof typeof BACKUP_KEYS, string | null>>;

export interface Backup {
  app: "til";
  version: 1;
  exportedAt: string;
  profile?: BirthProfileInput;
  journal: Journal;
  tarotHistory: unknown[];
  favorites: unknown[];
}

const parseArray = (raw: string | null | undefined): unknown[] => {
  try {
    const value: unknown = JSON.parse(raw ?? "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
};

const parseProfileRaw = (raw: string | null | undefined) => {
  try {
    const parsed = birthProfileSchema.safeParse(JSON.parse(raw ?? "null"));
    return parsed.success ? parsed.data : undefined;
  } catch {
    return undefined;
  }
};

export function buildBackup(raw: Raw, now = new Date()): Backup {
  return {
    app: "til",
    version: 1,
    exportedAt: now.toISOString(),
    profile: parseProfileRaw(raw.profile),
    journal: parseJournal(raw.journal),
    tarotHistory: parseArray(raw.tarotHistory),
    favorites: parseArray(raw.favorites),
  };
}

export const backupFileName = (today: string) => `til-backup-${today}.json`;

/** 백업 파일 내용 → 검증된 백업. 이 앱의 백업이 아니면 오류 */
export function parseBackup(text: string): Backup {
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    throw new Error("JSON 파일이 아니에요.");
  }
  if (typeof value !== "object" || value === null || (value as { app?: unknown }).app !== "til") {
    throw new Error("TIL에서 내보낸 백업 파일이 아니에요.");
  }
  const v = value as Record<string, unknown>;
  return {
    app: "til",
    version: 1,
    exportedAt: typeof v.exportedAt === "string" ? v.exportedAt : "",
    profile: parseProfileRaw(JSON.stringify(v.profile ?? null)),
    journal: parseJournal(JSON.stringify(v.journal ?? {})),
    tarotHistory: Array.isArray(v.tarotHistory) ? v.tarotHistory.filter(isHistoryEntry) : [],
    favorites: parseFavorites(JSON.stringify(v.favorites ?? [])),
  };
}

/** 타로 기록 한 줄 — 요청이 다시 해석될 수 있는 모양인지까지 확인 */
function isHistoryEntry(item: unknown): boolean {
  if (typeof item !== "object" || item === null) return false;
  const e = item as Record<string, unknown>;
  return typeof e.createdAt === "string" && typeof e.title === "string" && typeof e.summary === "string" && readingRequestSchema.safeParse(e.request).success;
}

const keyOf = (item: unknown, field: "id" | "seed") => {
  if (typeof item !== "object" || item === null) return undefined;
  if (field === "id") return (item as { id?: unknown }).id;
  return (item as { request?: { seed?: unknown } }).request?.seed;
};

/** 배열 기록은 같은 항목(id·seed)을 겹치지 않게 합친다 — 기기의 것이 앞 */
function mergeList(current: unknown[], incoming: unknown[], field: "id" | "seed", max: number) {
  const seen = new Set(current.map((item) => keyOf(item, field)));
  return [...current, ...incoming.filter((item) => !seen.has(keyOf(item, field)))].slice(0, max);
}

/** 가져오기 결과로 저장할 원문들 — 기록은 합치고, 프로필은 기기에 없을 때만 채운다 */
export function applyBackup(current: Raw, backup: Backup): Required<Raw> {
  const merge = <T,>(list: T[]) => (list.length ? JSON.stringify(list) : null);
  const journal = mergeJournals(parseJournal(current.journal), backup.journal);
  const hasProfile = parseProfileRaw(current.profile) !== undefined;
  return {
    profile: hasProfile ? current.profile ?? null : backup.profile ? JSON.stringify(backup.profile) : current.profile ?? null,
    journal: Object.keys(journal).length ? JSON.stringify(journal) : null,
    tarotHistory: merge(mergeList(parseArray(current.tarotHistory), backup.tarotHistory, "seed", 20)),
    favorites: merge(mergeList(parseArray(current.favorites), backup.favorites, "id", 20)),
  };
}
