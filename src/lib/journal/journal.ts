import { z } from "zod";

// TIL 기록 — 운세·타로는 "프로필 + 날짜"로 언제든 다시 계산되므로 결과 전체가 아니라
// 방문 사실·달력 표시용 요약·회고만 기기에 남긴다.

export type Hit = "yes" | "half" | "no";

export interface JournalReading {
  title: string; // "연애 · 과거·현재·미래"
  summary: string; // 결론 카드 제목
  query: string; // /tarot/r 공유 주소 쿼리 (질문 제외)
}

/** 오늘의 타로 — 달력·회고에서 덱 데이터 없이 이름과 그림을 보여 주도록 이름·slug도 남긴다 */
export interface JournalTarot {
  cardId: string;
  name?: string;
  slug?: string;
  reversed: boolean;
}

export interface JournalDay {
  date: string; // "2026-10-22" (KST)
  visitedAt: string; // 첫 방문 시각 ISO
  fortune?: { score: number; headline: string };
  tarot?: JournalTarot;
  readings: JournalReading[];
  hit?: Hit;
  memo?: string; // 한 줄 회고 (최대 100자)
}

export type Journal = Record<string, JournalDay>;

export const MEMO_MAX = 100;
const MAX_READINGS_PER_DAY = 10;

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const daySchema = z.object({
  date: dateSchema,
  visitedAt: z.string(),
  fortune: z.object({ score: z.number().min(0).max(100), headline: z.string().max(100) }).optional(),
  tarot: z
    .object({ cardId: z.string().max(20), name: z.string().max(30).optional(), slug: z.string().regex(/^[a-z-]{1,40}$/).optional(), reversed: z.boolean() })
    .optional(),
  readings: z.array(z.object({ title: z.string().max(100), summary: z.string().max(100), query: z.string().max(500) })).max(MAX_READINGS_PER_DAY),
  hit: z.enum(["yes", "half", "no"]).optional(),
  memo: z.string().max(MEMO_MAX).optional(),
});

/** 저장된 원문 → 기록. 깨진 날은 버리고 나머지는 살린다 */
export function parseJournal(raw: string | null | undefined): Journal {
  if (!raw) return {};
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return {};
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return {};
  const journal: Journal = {};
  for (const [date, value] of Object.entries(parsed)) {
    const day = daySchema.safeParse(value);
    if (day.success && day.data.date === date) journal[date] = day.data;
  }
  return journal;
}

/** 하루 기록을 고친다. 없던 날이면 방문 기록부터 만든다 */
export function updateDay(journal: Journal, date: string, change: (day: JournalDay) => Partial<JournalDay>, now = new Date()): Journal {
  const day = journal[date] ?? { date, visitedAt: now.toISOString(), readings: [] };
  return { ...journal, [date]: { ...day, ...change(day) } };
}

export const withReading = (day: JournalDay, reading: JournalReading): JournalReading[] =>
  [reading, ...day.readings.filter((r) => r.query !== reading.query)].slice(0, MAX_READINGS_PER_DAY);

// ── 날짜 계산 (KST 날짜 문자열끼리, 시간대와 무관하게 UTC 자정으로 계산) ──

const toUTC = (date: string) => {
  const [y, m, d] = date.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
};
const fromUTC = (ms: number) => new Date(ms).toISOString().slice(0, 10);
export const addDays = (date: string, days: number) => fromUTC(toUTC(date) + days * 86_400_000);

/** 해당 달의 날짜 칸 — 앞쪽 빈칸(null)은 일요일 시작 기준 */
export function monthGrid(year: number, month: number): (string | null)[] {
  const first = Date.UTC(year, month - 1, 1);
  const days = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const blanks = new Date(first).getUTCDay();
  return [...Array<null>(blanks).fill(null), ...Array.from({ length: days }, (_, i) => fromUTC(first + i * 86_400_000))];
}

// ── 연속 방문 ──

/** 오늘의 운세를 확인한 날을 방문으로 센다 */
const isVisit = (day: JournalDay | undefined) => Boolean(day?.fortune);

export interface Streak {
  current: number; // 오늘(또는 아직 오늘 안 왔으면 어제)까지 이어진 날 수
  best: number;
  visitedToday: boolean;
}

export function streakOf(journal: Journal, today: string): Streak {
  const visitedToday = isVisit(journal[today]);
  let current = 0;
  for (let date = visitedToday ? today : addDays(today, -1); isVisit(journal[date]); date = addDays(date, -1)) current++;

  const dates = Object.keys(journal).filter((d) => isVisit(journal[d])).sort();
  let best = 0;
  let run = 0;
  dates.forEach((date, i) => {
    run = i > 0 && addDays(dates[i - 1], 1) === date ? run + 1 : 1;
    best = Math.max(best, run);
  });
  return { current, best: Math.max(best, current), visitedToday };
}

// ── 회고 ──

/** 회고를 물어볼 날 — 저녁 6시(KST) 이후면 오늘, 아니면 어제. 운세를 봤고 아직 답하지 않은 날만 */
export function retroTarget(journal: Journal, today: string, hourKST: number): JournalDay | null {
  const candidates = hourKST >= 18 ? [today, addDays(today, -1)] : [addDays(today, -1)];
  for (const date of candidates) {
    const day = journal[date];
    if (day?.fortune && !day.hit) return day;
  }
  return null;
}

export const HIT_LABEL: Record<Hit, string> = { yes: "맞았어요", half: "반쯤", no: "아니었어요" };
const HIT_VALUE: Record<Hit, number> = { yes: 1, half: 0.5, no: 0 };

// ── 통계·배지 ──

export interface Stats {
  visits: number;
  averageScore: number | null;
  hitRate: number | null; // 0–100
  answered: number;
  topCard: { cardId: string; count: number } | null;
}

export function statsOf(days: JournalDay[]): Stats {
  const visits = days.filter(isVisit);
  const scores = visits.map((d) => d.fortune!.score);
  const answered = days.filter((d) => d.hit);
  const cards = new Map<string, number>();
  for (const d of days) if (d.tarot) cards.set(d.tarot.cardId, (cards.get(d.tarot.cardId) ?? 0) + 1);
  const [topId, topCount] = [...cards].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0] ?? [];
  return {
    visits: visits.length,
    averageScore: scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null,
    hitRate: answered.length ? Math.round((answered.reduce((a, d) => a + HIT_VALUE[d.hit!], 0) / answered.length) * 100) : null,
    answered: answered.length,
    topCard: topId && topCount > 1 ? { cardId: topId, count: topCount } : null,
  };
}

/** 그 달의 기록만 */
export const daysInMonth = (journal: Journal, year: number, month: number) => {
  const prefix = `${year}-${String(month).padStart(2, "0")}-`;
  return Object.values(journal).filter((d) => d.date.startsWith(prefix));
};

export interface Badge {
  id: string;
  emoji: string;
  label: string;
  description: string;
  earned: boolean;
  progress?: string; // "13/22"
}

const STREAK_BADGES = [3, 7, 14, 30, 100];
const MAJOR_IDS = Array.from({ length: 22 }, (_, i) => `major-${i}`);

export function badgesOf(journal: Journal, today: string): Badge[] {
  const days = Object.values(journal);
  const { best } = streakOf(journal, today);
  const majors = new Set(days.map((d) => d.tarot?.cardId).filter((id) => id && MAJOR_IDS.includes(id)));
  return [
    ...STREAK_BADGES.map((n) => ({
      id: `streak-${n}`,
      emoji: n >= 30 ? "🏆" : n >= 7 ? "🔥" : "🌱",
      label: `${n}일 연속`,
      description: `오늘의 운세를 ${n}일 이어서 확인했어요`,
      earned: best >= n,
      progress: best >= n ? undefined : `${best}/${n}`,
    })),
    {
      id: "first-retro",
      emoji: "📝",
      label: "첫 회고",
      description: "운세가 맞았는지 처음으로 돌아봤어요",
      earned: days.some((d) => d.hit),
    },
    {
      id: "all-majors",
      emoji: "🃏",
      label: "메이저 22장",
      description: "오늘의 타로에서 메이저 아르카나 22장을 모두 만났어요",
      earned: majors.size === 22,
      progress: majors.size === 22 ? undefined : `${majors.size}/22`,
    },
  ];
}

/** 운세 점수 → 달력 색 단계 1–5 (별점과 같은 기준) */
export function scoreLevel(score: number): 1 | 2 | 3 | 4 | 5 {
  if (score >= 82) return 5;
  if (score >= 70) return 4;
  if (score >= 58) return 3;
  if (score >= 45) return 2;
  return 1;
}

/** 두 기록을 합친다 — 같은 날은 기기(base)의 값을 지키고, 비어 있는 값만 들어온 쪽으로 채운다 */
export function mergeJournals(base: Journal, incoming: Journal): Journal {
  const merged: Journal = { ...base };
  for (const [date, day] of Object.entries(incoming)) {
    const prev = merged[date];
    if (!prev) {
      merged[date] = day;
      continue;
    }
    merged[date] = {
      date,
      visitedAt: prev.visitedAt < day.visitedAt ? prev.visitedAt : day.visitedAt,
      fortune: prev.fortune ?? day.fortune,
      tarot: prev.tarot ?? day.tarot,
      readings: [...prev.readings, ...day.readings.filter((r) => !prev.readings.some((p) => p.query === r.query))].slice(0, MAX_READINGS_PER_DAY),
      hit: prev.hit ?? day.hit,
      memo: prev.memo ?? day.memo,
    };
  }
  return merged;
}
