import { interpretReading, type Reading, type ReadingRequest } from "./interpret";
import { readingRequestSchema } from "./schema";

// 결과는 seed + 고른 자리 + 스프레드 + 주제로 서버에서 그대로 재현되므로 DB 없이 주소만으로 공유한다.
// 질문은 개인적인 내용일 수 있어 사용자가 고를 때만 싣는다.

type SearchParams = Record<string, string | string[] | undefined>;

/** /tarot/r 뒤에 붙는 쿼리 — 역방향을 뺀 판일 때만 rev=0 */
export function shareQuery(reading: Pick<Reading, "topic" | "spread" | "seed" | "picks" | "allowReversed" | "question">, includeQuestion = false) {
  const params = new URLSearchParams({ t: reading.topic, s: reading.spread.id, seed: reading.seed, p: reading.picks.join(",") });
  if (!reading.allowReversed) params.set("rev", "0");
  if (includeQuestion && reading.question) params.set("q", reading.question);
  return params.toString();
}

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

/** 공유 주소의 쿼리를 해석 요청으로 — 형식이 틀리면 null */
export function parseShareQuery(params: SearchParams): ReadingRequest | null {
  const picks = first(params.p)?.split(",").map((v) => (/^\d+$/.test(v) ? Number(v) : NaN));
  const parsed = readingRequestSchema.safeParse({
    topic: first(params.t),
    spreadId: first(params.s),
    seed: first(params.seed),
    picks,
    allowReversed: first(params.rev) !== "0",
    question: first(params.q) || undefined,
  });
  return parsed.success ? parsed.data : null;
}

/** 공유 주소로 결과 재현 — 스프레드와 장수가 안 맞는 등 해석할 수 없으면 null */
export function readingFromShare(params: SearchParams): Reading | null {
  const request = parseShareQuery(params);
  if (!request) return null;
  try {
    return interpretReading(request);
  } catch {
    return null;
  }
}
