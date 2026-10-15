import { z } from "zod";
import { RELATION_TYPES, type RelationType } from "./detail-text";

// 궁합 공유 주소(/compat?a=…&b=…&s=…&r=…) — 결과를 다시 만들려면 생년월일이 필요하므로 결과가 아니라
// 미리보기용 닉네임·점수·관계만 싣고, 한 줄 문장은 점수로 다시 만든다(주소로 문장을 바꿔 넣을 수 없게).

export interface CompatShare {
  a: string;
  b: string;
  score: number;
  relation: RelationType;
}

type SearchParams = Record<string, string | string[] | undefined>;

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

const nickname = z.string().trim().min(1).max(20);
const schema = z.object({
  a: nickname,
  b: nickname,
  score: z.coerce.number().int().min(0).max(100),
  relation: z.enum(Object.keys(RELATION_TYPES) as [RelationType, ...RelationType[]]),
});

export function compatShareQuery({ a, b, score, relation }: CompatShare) {
  return new URLSearchParams({ a, b, s: String(score), r: relation }).toString();
}

/** 형식이 틀리면 null — 그때는 공유 미리보기 없이 평범한 궁합 시작 화면 */
export function parseCompatShare(params: SearchParams): CompatShare | null {
  const score = first(params.s);
  const parsed = schema.safeParse({
    a: first(params.a),
    b: first(params.b),
    score: score && /^\d{1,3}$/.test(score) ? score : undefined,
    relation: first(params.r),
  });
  return parsed.success ? parsed.data : null;
}
