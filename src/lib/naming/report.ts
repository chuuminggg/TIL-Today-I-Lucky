import type { Element } from "saju-fortune";
import hanja from "hanja";
import HANJA_EUM from "hanja/lib/data/hanjaeum.json";
import { normalizeNamingInput, scoreNameCandidate, type NameCandidate, type NamingContext } from "naming-house";
import { analyze, toSolarInput, type BirthProfile } from "@/lib/saju/adapter";
import { ELEMENT_HANJA } from "@/lib/saju/ganji";

// 이름 감정 — 후보 이름(한글 + 선택 한자)을 사주 보완 오행·획수·발음으로 채점한다.
// 채점은 naming-house를 쓰되, 사주는 연주·월주를 보정한 analyze()로 계산해 다른 화면과 같은 명식을 쓴다.

export interface NamingRequest {
  profile: BirthProfile;
  surname: string;
  surnameHanja?: string;
  candidates: NameCandidate[];
  avoidSyllables?: string[];
}

export type Grade = "excellent" | "good" | "fair" | "weak";

export const GRADE_LABEL: Record<Grade, string> = { excellent: "아주 좋음", good: "좋음", fair: "보통", weak: "아쉬움" };

export const COMPONENTS = [
  { key: "elementBalance", label: "사주 오행 보완", max: 40 },
  { key: "strokeHarmony", label: "획수 조화", max: 30 },
  { key: "soundFlow", label: "발음 흐름", max: 20 },
  { key: "preferenceFit", label: "선호 반영", max: 10 },
] as const;

type ComponentKey = (typeof COMPONENTS)[number]["key"];

export interface NameReport {
  rank: number;
  fullName: string; // "김서아"
  hanjaName?: string; // "金瑞雅"
  romanized: string;
  score: number;
  grade: Grade;
  components: Record<ComponentKey, number>;
  /** 글자별 획수·획수 오행 (성 포함) */
  strokes: Array<{ char: string; strokes: number; element: string }>;
  basis: "hanja" | "hangul";
  matched: string[]; // 이름이 채워 주는 보완 오행 ("수(水)")
  clashing: string[]; // 보완 오행을 누르는 이름 오행
  notes: string[];
}

export interface NamingReport {
  needed: string[]; // 보완 오행 ("목(木)")
  neededReason: string;
  names: NameReport[];
  warnings: string[];
}

const ELEMENT_KO: Record<Element, string> = { wood: "목", fire: "화", earth: "토", metal: "금", water: "수" };
const CANONICAL: Element[] = ["wood", "fire", "earth", "metal", "water"];
export const elementLabel = (e: Element) => `${ELEMENT_KO[e]}(${ELEMENT_HANJA[e]})`;

const EUM = HANJA_EUM as Record<string, string>;
/** 사전의 대표 음과 다르게 읽는 성씨 */
const SURNAME_READING: Record<string, string> = { 金: "김" };

/** 한자 한 글자가 한글 음절로 읽힐 수 있는지 — 대표 음, 두음법칙 적용 음, 성씨 예외까지 */
export function readsAs(char: string, syllable: string, isSurname = false): boolean {
  if (isSurname && SURNAME_READING[char] === syllable) return true;
  const raw = EUM[char];
  if (!raw) return true; // 사전에 없는 글자는 판단하지 않는다
  return raw === syllable || hanja.translate(char, "SUBSTITUTION") === syllable;
}

/** 한글과 한자 글자 수·음이 맞는지 — 여러 음을 가진 한자가 있어 오류가 아니라 안내로 돌려준다 */
function readingNotes(hangul: string, hanjaText: string | undefined, isSurname: boolean): string[] {
  if (!hanjaText) return [];
  const syllables = Array.from(hangul);
  const chars = Array.from(hanjaText);
  if (syllables.length !== chars.length) return [`한글(${hangul})과 한자(${hanjaText})의 글자 수가 달라요.`];
  return chars.flatMap((char, i) =>
    readsAs(char, syllables[i], isSurname) ? [] : [`${char}의 대표 음은 '${EUM[char]}'예요. '${syllables[i]}'로 읽는 한자가 맞는지 확인해 주세요.`],
  );
}

export async function getNamingReport(request: NamingRequest): Promise<NamingReport> {
  const solar = toSolarInput(request.profile);
  const input = normalizeNamingInput({
    surname: request.surname,
    surnameHanja: request.surnameHanja || undefined,
    birthDate: solar.birthDate,
    birthTime: solar.birthTime,
    calendar: "solar",
    gender: solar.gender,
    candidates: request.candidates.map((c) => ({ givenName: c.givenName, ...(c.hanjaName ? { hanjaName: c.hanjaName } : {}) })),
    preferences: { avoidSyllables: request.avoidSyllables ?? [], maxCandidates: 10 },
  });

  if (input.surnameHanja && Array.from(input.surnameHanja).length !== Array.from(input.surname).length) {
    throw new Error("성씨 한글과 한자의 글자 수가 달라요.");
  }

  // naming-house의 buildNamingContext와 같은 규칙 — 용신·희신 + 부족한 오행, 고르면 다섯 오행 모두
  const saju = analyze(request.profile);
  const wanted = new Set<Element>([saju.yongsin.primary, saju.yongsin.secondary, ...saju.weakElements]);
  const balanced = wanted.size === 0;
  const neededElements = balanced ? CANONICAL : CANONICAL.filter((e) => wanted.has(e));
  const context: NamingContext = {
    input,
    neededElements,
    limitations: [...saju.limitations, ...(balanced ? ["balanced-saju-no-specific-needed-element"] : [])],
    sources: ["saju-fortune"],
  };

  const scored = [];
  for (const candidate of input.candidates) scored.push(await scoreNameCandidate(candidate, context));
  scored.sort((a, b) => b.score - a.score || b.components.elementBalance - a.components.elementBalance || a.fullName.localeCompare(b.fullName, "ko"));

  const surnameNotes = readingNotes(input.surname, input.surnameHanja, true);
  const names = scored.map((s, i): NameReport => {
    const hanjaBasis = s.strokeProfile.source === "hanja-stroke-order" && s.strokeProfile.available;
    const notes = [...readingNotes(s.givenName, s.hanjaName, false)];
    if (!s.hanjaName) notes.push("한자 없이 한글 획수로 채점해 정밀도가 낮아요. 한자를 넣으면 더 정확해져요.");
    else if (!hanjaBasis) notes.push("일부 한자의 획수를 찾지 못해 한글 획수로 대신 채점했어요.");
    if (!input.surnameHanja && s.hanjaName) notes.push("성씨 한자를 넣지 않아 이름 한자만으로 획수를 봤어요.");
    return {
      rank: i + 1,
      fullName: s.fullName,
      hanjaName: s.hanjaName ? `${input.surnameHanja ?? ""}${s.hanjaName}` : undefined,
      romanized: s.romanized,
      score: s.score,
      grade: s.grade,
      components: s.components,
      strokes: s.strokeProfile.strokes.map((x) => ({ char: x.char, strokes: x.strokes, element: elementLabel(x.element) })),
      basis: hanjaBasis ? "hanja" : "hangul",
      matched: s.elementProfile.matchedNeededElements.map(elementLabel),
      clashing: s.elementProfile.incompatibleElements.map(elementLabel),
      notes,
    };
  });

  return {
    needed: neededElements.map(elementLabel),
    neededReason: balanced
      ? "사주의 오행이 고른 편이라 특정 오행을 고집하지 않고 다섯 오행을 모두 보완 대상으로 봤어요."
      : `${neededElements
          .map((e) => {
            const roles = [
              ...(e === saju.yongsin.primary ? ["용신"] : []),
              ...(e === saju.yongsin.secondary ? ["희신"] : []),
              ...(saju.weakElements.includes(e) ? ["부족한 오행"] : []),
            ];
            return `${elementLabel(e)} ${roles.join("·")}`;
          })
          .join(" / ")} — 이름으로 채워 주면 좋은 기운이에요.`,
    names,
    warnings: [
      ...surnameNotes,
      ...(saju.timeAccuracy === "unknown" ? ["태어난 시간을 몰라 시주를 빼고 계산했어요. 보완 오행이 달라질 수 있어요."] : []),
    ],
  };
}
