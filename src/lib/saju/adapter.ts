import { calculateFourPillars } from "manseryeok";
import {
  analyzeSaju,
  type BirthInput,
  type CompatibilityResult,
  type Element,
  type FortuneType,
  type Gender,
  type SajuAnalysis,
} from "saju-fortune";
import {
  buildFortuneReading,
  countFiveElements,
  estimateDayMasterStrength,
  formatElement,
  getDominantElements,
  getWeakElements,
  selectUsefulElements,
  summarizePerson,
} from "saju-fortune/src/readings";
import { lunarToSolar, parseDate } from "@/lib/calendar/lunar";

/** 사용자 입력 형태. 음력이면 어댑터에서 양력으로 변환한 뒤 패키지에 넘긴다. */
export interface BirthProfile {
  birthDate: string; // YYYY-MM-DD (calendar 기준)
  birthTime?: string; // HH:mm, 모르면 생략
  gender: Gender;
  calendar: "solar" | "lunar";
  isLeapMonth?: boolean;
}

export function toSolarInput(profile: BirthProfile): BirthInput {
  const birthDate =
    profile.calendar === "lunar"
      ? lunarToSolar(parseDate(profile.birthDate), profile.isLeapMonth)
      : profile.birthDate;
  return { birthDate, birthTime: profile.birthTime, gender: profile.gender, calendar: "solar" };
}

// ── 연주·월주 보정 ─────────────────────────────────────────────
// saju-fortune은 절기를 해마다 같은 날짜(입춘 2/4, 경칩 3/6 …)로 보고 시각도 보지 않아서, 절입 전후 며칠 사이에
// 태어나면 월주(가끔 연주)가 틀린다 (1900–2050 무작위 2만 건 중 약 3%). 한국천문연구원 절입 시각을 담은
// manseryeok으로 연주·월주를 구하고, 다르면 saju-fortune의 나머지 계산(오행·신강약·용신·풀이)을 다시 돌린다.

const STEMS = "갑을병정무기경신임계";
const BRANCHES = "자축인묘진사오미신유술해";

// 월지별로 그 절기 달의 한가운데(중기 무렵) 날짜. saju-fortune은 절기 경계에서만 틀리므로
// 이 날짜로 구한 연주·월주는 정확하고, 패키지와 같은 모양의 Pillar 객체를 얻을 수 있다.
const MID_MONTH: Record<string, [monthOffsetYear: number, month: number, day: number]> = {
  인: [0, 2, 19], 묘: [0, 3, 21], 진: [0, 4, 20], 사: [0, 5, 21], 오: [0, 6, 21], 미: [0, 7, 23],
  신: [0, 8, 23], 유: [0, 9, 23], 술: [0, 10, 23], 해: [0, 11, 22], 자: [0, 12, 22], 축: [1, 1, 20],
};

const yearLabel = (year: number) => STEMS[(((year - 4) % 10) + 10) % 10] + BRANCHES[(((year - 4) % 12) + 12) % 12];
const pad = (n: number) => String(n).padStart(2, "0");

const TERM_DAY_LIMITATION = "태어난 날에 절기가 바뀌어 태어난 시간에 따라 월주가 달라질 수 있어요. 시간을 알면 입력해 주세요.";

function referenceYearMonth(birthDate: string, birthTime?: string) {
  const { year, month, day } = parseDate(birthDate);
  const at = (hour: number, minute: number) => calculateFourPillars({ year, month, day, hour, minute }).toObject();
  if (birthTime) {
    const [hour, minute] = birthTime.split(":").map(Number);
    return { ...at(hour, minute), ambiguous: false };
  }
  // 시간을 모르면 정오 기준. 그날 절기가 바뀌면(자정과 자정 직전의 월주가 다르면) 잠정으로 표시
  const start = at(0, 0);
  const end = at(23, 59);
  return { ...at(12, 0), ambiguous: start.month !== end.month || start.year !== end.year };
}

function correctYearMonth(base: SajuAnalysis): { pillars: SajuAnalysis["pillars"]; ambiguous: boolean } | null {
  const { birthDate, birthTime } = base.input;
  const ref = referenceYearMonth(birthDate, birthTime);
  if (!ref.ambiguous && ref.year === base.pillars.year.label && ref.month === base.pillars.month.label) return null;

  const birthYear = parseDate(birthDate).year;
  const sajuYear = [birthYear, birthYear - 1].find((y) => yearLabel(y) === ref.year);
  if (sajuYear === undefined) throw new Error(`연주를 맞출 수 없습니다: ${birthDate} ${ref.year}`);
  const [offset, month, day] = MID_MONTH[ref.month[1]];
  const proxy = analyzeSaju({ birthDate: `${sajuYear + offset}-${pad(month)}-${pad(day)}`, gender: base.input.gender }).pillars;
  if (proxy.year.label !== ref.year || proxy.month.label !== ref.month) {
    throw new Error(`연주·월주 보정 실패: ${birthDate} ${ref.year}년 ${ref.month}월`);
  }
  return { pillars: { ...base.pillars, year: proxy.year, month: proxy.month }, ambiguous: ref.ambiguous };
}

function withCorrectedPillars(base: SajuAnalysis, fortuneType?: FortuneType): SajuAnalysis {
  const corrected = correctYearMonth(base);
  if (!corrected) return base;

  const { pillars } = corrected;
  const fiveElements = countFiveElements(pillars);
  const dayMaster = { ...base.dayMaster, strength: estimateDayMasterStrength(pillars, fiveElements) };
  const result: SajuAnalysis = {
    ...base,
    pillars,
    fiveElements,
    dominantElements: getDominantElements(fiveElements),
    weakElements: getWeakElements(fiveElements),
    dayMaster,
    yongsin: selectUsefulElements(dayMaster, fiveElements),
    limitations: corrected.ambiguous ? [...base.limitations, TERM_DAY_LIMITATION] : base.limitations,
  };
  if (fortuneType) result.fortune = buildFortuneReading(result, fortuneType);
  return result;
}

export function analyze(profile: BirthProfile, fortuneType?: FortuneType): SajuAnalysis {
  const input = toSolarInput(profile);
  const base = fortuneType ? analyzeSaju(input, { analysisType: "fortune", fortuneType }) : analyzeSaju(input);
  return withCorrectedPillars(base, fortuneType);
}

// ── 궁합 ──────────────────────────────────────────────────────
// checkCompatibility는 내부에서 보정 전 analyzeSaju를 부르므로, 보정된 분석으로 같은 공식(saju-fortune 0.2.0)을 계산한다

const ELEMENT_CYCLE: Element[] = ["wood", "fire", "earth", "metal", "water"];

export function compatibility(a: BirthProfile, b: BirthProfile): CompatibilityResult {
  const first = analyze(a);
  const second = analyze(b);
  const shared = ELEMENT_CYCLE.filter((e) => first.dominantElements.includes(e) && second.dominantElements.includes(e));
  const complementary = ELEMENT_CYCLE.filter((e) => first.weakElements.includes(e) && second.dominantElements.includes(e));
  const reverse = ELEMENT_CYCLE.filter((e) => second.weakElements.includes(e) && first.dominantElements.includes(e));
  const sameDayElement = first.dayMaster.element === second.dayMaster.element;
  const score = Math.max(
    0,
    Math.min(100, 50 + shared.length * 8 + (complementary.length + reverse.length) * 10 + (sameDayElement ? 8 : 0)),
  );

  const focusAreas: string[] = [];
  if (shared.length) {
    focusAreas.push(`공통으로 강한 ${shared.map(formatElement).join(", ")} 기운은 공감대가 되지만 고집도 같이 커질 수 있습니다.`);
  }
  if (complementary.length || reverse.length) {
    focusAreas.push("서로 부족한 오행을 보완하는 지점이 있어 역할 분담을 의식하면 관계가 안정됩니다.");
  }
  if (!focusAreas.length) focusAreas.push("두 사주의 중심 기운이 달라 속도와 표현 방식을 맞추는 대화가 중요합니다.");
  focusAreas.push("궁합은 결정론이 아니라 관계를 돌아보는 대화 재료로만 사용하세요.");

  return {
    people: [summarizePerson(first), summarizePerson(second)],
    score,
    sharedElements: shared,
    complementaryElements: [...new Set([...complementary, ...reverse])],
    focusAreas,
    summary: `두 사람의 궁합은 ${score}점 수준으로, 관계의 장점과 조율 포인트를 함께 보는 해석이 적절합니다.`,
    sources: ["saju-fortune-local-calculation", "fortuneteller-mcp-tool-model"],
  };
}
