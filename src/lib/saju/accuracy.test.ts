// 사주 계산 정확도 대조 (NEXT_PLAN 0-6, PLAN 6장 체크리스트)
// 기준: manseryeok — 한국천문연구원(KASI) 절입 시각·음력 정본 데이터 기반 만세력 (MIT)
import { calculateFourPillars, getSolarTerm, solarToLunar } from "manseryeok";
import { checkCompatibility } from "saju-fortune";
import { describe, expect, it } from "vitest";
import { dayPillar } from "@/lib/calendar/iljin";
import { lunarToSolar } from "@/lib/calendar/lunar";
import { analyze, compatibility, type BirthProfile } from "./adapter";

const pad = (n: number) => String(n).padStart(2, "0");

function ours(birthDate: string, birthTime?: string) {
  const { pillars } = analyze({ birthDate, birthTime, gender: "male", calendar: "solar" });
  return [pillars.year.label, pillars.month.label, pillars.day.label, pillars.hour?.label ?? null];
}

function reference(birthDate: string, birthTime = "12:00") {
  const [year, month, day] = birthDate.split("-").map(Number);
  const [hour, minute] = birthTime.split(":").map(Number);
  const p = calculateFourPillars({ year, month, day, hour, minute }).toObject();
  return [p.year, p.month, p.day, p.hour];
}

/** 절입 순간에서 minutes만큼 떨어진 KST 날짜·시각 */
function aroundTerm(year: number, index: number, minutes: number): [string, string] {
  const kst = new Date(getSolarTerm(year, index).date.getTime() + (9 * 60 + minutes) * 60_000);
  return [kst.toISOString().slice(0, 10), kst.toISOString().slice(11, 16)];
}

// 24절기 index: 0 소한, 2 입춘, 4 경칩 … 22 대설 (짝수가 월이 바뀌는 절)
const JIE = [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22];

describe("정확도 대조 — 알려진 명식", () => {
  it.each([
    // [양력, 시각, 연주, 월주, 일주, 시주]
    ["1992-10-24", "05:30", "임신", "경술", "계유", "을묘"], // manseryeok README 예시
    ["1990-03-15", "10:30", "경오", "기묘", "기묘", "기사"],
    ["2024-02-04", "17:00", "계묘", "을축", "무술", "신유"], // 입춘 17:27 직전 → 아직 계묘년
    ["2024-02-04", "18:00", "갑진", "병인", "무술", "신유"], // 입춘 직후 → 갑진년 병인월
    ["2000-01-01", "00:00", "기묘", "병자", "무오", "임자"],
  ])("%s %s → %s년 %s월 %s일 %s시", (date, time, y, m, d, h) => {
    expect(ours(date, time)).toEqual([y, m, d, h]);
    expect(reference(date, time)).toEqual([y, m, d, h]);
  });
});

describe("정확도 대조 — 입춘·절기 경계 (연주·월주)", () => {
  const cases: Array<[string, number, number]> = [];
  // 입춘 전후 30분: 연주와 월주가 함께 바뀌는 경계
  for (const year of [1901, 1935, 1957, 1962, 1988, 1999, 2024, 2033, 2049]) {
    cases.push([`${year} 입춘 30분 전`, year, -30], [`${year} 입춘 30분 후`, year, 30]);
  }
  it.each(cases)("%s", (_, year, minutes) => {
    const [date, time] = aroundTerm(year, 2, minutes);
    expect(ours(date, time)).toEqual(reference(date, time));
  });

  // 나머지 11개 절 — 절입 전후 1시간
  const years = [1950, 1975, 2003, 2008, 2021, 2035];
  it.each(JIE.filter((i) => i !== 2).flatMap((index, k) => [-60, 60].map((m) => [index, years[k % years.length], m])))(
    "절 index %i (%i년) 절입 %i분",
    (index, year, minutes) => {
      const [date, time] = aroundTerm(year, index, minutes);
      expect(ours(date, time)).toEqual(reference(date, time));
    },
  );
});

describe("정확도 대조 — 자시(23:00–01:00)", () => {
  // 기본 관법은 자정 기준(당일 일주, 23시대는 당일 일간으로 시주). 조자시·야자시 옵션은 제공하지 않음
  it.each([
    ["2024-03-10", "23:30"],
    ["2024-03-11", "00:30"],
    ["1985-12-31", "23:59"],
    ["1986-01-01", "00:00"],
    ["2010-07-15", "22:59"],
    ["2010-07-15", "23:00"],
  ])("%s %s", (date, time) => {
    expect(ours(date, time)).toEqual(reference(date, time));
  });
});

describe("정확도 대조 — 윤달·음력 입력", () => {
  it.each([
    [2020, 4, 1, true],
    [2023, 2, 15, true],
    [2017, 5, 29, true],
    [2012, 3, 10, true],
    [1987, 6, 20, true],
    [1995, 8, 1, true],
    [2006, 7, 7, true],
    [2025, 6, 29, true],
    [1990, 2, 19, false],
    [1976, 8, 15, false],
  ] as const)("음력 %i-%i-%i 윤달=%s", (y, m, d, leap) => {
    const profile: BirthProfile = { birthDate: `${y}-${pad(m)}-${pad(d)}`, birthTime: "09:15", gender: "female", calendar: "lunar", isLeapMonth: leap };
    const { pillars } = analyze(profile);
    const ref = calculateFourPillars({ year: y, month: m, day: d, hour: 9, minute: 15, isLunar: true, isLeapMonth: leap }).toObject();
    expect([pillars.year.label, pillars.month.label, pillars.day.label, pillars.hour?.label]).toEqual([ref.year, ref.month, ref.day, ref.hour]);
  });

  it("음력→양력 변환이 1900–2049년 KASI 음력 정본과 일치 (5일 간격 표본)", () => {
    const mismatches: string[] = [];
    // 2050년 이후는 기준 라이브러리도 천문 계산값이라 대조에서 뺀다
    for (let t = Date.UTC(1900, 0, 31); t < Date.UTC(2050, 0, 1); t += 5 * 86_400_000) {
      const iso = new Date(t).toISOString().slice(0, 10);
      const [y, m, d] = iso.split("-").map(Number);
      const lunar = solarToLunar(y, m, d);
      const back = lunarToSolar({ year: lunar.year, month: lunar.month, day: lunar.day }, lunar.isLeapMonth);
      if (back !== iso) mismatches.push(`${iso} ← 음력 ${lunar.year}-${lunar.month}-${lunar.day}${lunar.isLeapMonth ? "(윤)" : ""} = ${back}`);
    }
    expect(mismatches).toEqual([]);
  });
});

describe("정확도 대조 — 서머타임 기간", () => {
  // 1948–51·1955–60·1987–88 서머타임, 1954–61 UTC+8:30 표준시. 지금은 입력 시각(시계 시각)을 그대로 KST로 본다
  // (manseryeok 기본값과 같음). 시계 시각 → 실제 시각 보정은 옵션 후보 — 체크리스트 참고
  it.each([
    ["1949-07-01", "12:30"],
    ["1956-06-15", "00:40"],
    ["1958-08-20", "07:10"],
    ["1987-07-01", "10:30"],
    ["1988-06-12", "23:20"],
  ])("%s %s", (date, time) => {
    expect(ours(date, time)).toEqual(reference(date, time));
  });
});

describe("정확도 대조 — 출생시 모름", () => {
  it("시주 없이 연·월·일주는 기준과 같다", () => {
    const result = analyze({ birthDate: "1993-08-20", gender: "female", calendar: "solar" });
    expect(result.pillars.hour).toBeNull();
    expect(ours("1993-08-20").slice(0, 3)).toEqual(reference("1993-08-20").slice(0, 3));
  });

  it("태어난 날에 절기가 바뀌면 월주가 잠정이라고 알린다", () => {
    const [date] = aroundTerm(1993, 14, 0); // 1993 입추
    const result = analyze({ birthDate: date, gender: "female", calendar: "solar" });
    expect(result.limitations.some((l) => l.includes("절기가 바뀌어"))).toBe(true);
    expect(analyze({ birthDate: "1993-08-20", gender: "female", calendar: "solar" }).limitations.some((l) => l.includes("절기"))).toBe(false);
  });
});

describe("정확도 대조 — 무작위 표본", () => {
  it("1900–2050년 무작위 2,000건의 사주팔자가 모두 일치", () => {
    let seed = 20260927;
    const random = () => (seed = (seed * 1_103_515_245 + 12_345) % 2_147_483_648) / 2_147_483_648;
    const start = Date.UTC(1900, 0, 1);
    const span = Date.UTC(2050, 11, 31) - start;
    const mismatches: string[] = [];
    for (let i = 0; i < 2000; i++) {
      const at = new Date(start + Math.floor(random() * span));
      const date = at.toISOString().slice(0, 10);
      const time = at.toISOString().slice(11, 16);
      const a = ours(date, time).join(" ");
      const b = reference(date, time).join(" ");
      if (a !== b) mismatches.push(`${date} ${time}: ${a} ≠ ${b}`);
    }
    expect(mismatches).toEqual([]);
  });

  it("오늘의 일진이 1900–2050년 전 구간에서 일치 (7일 간격 표본)", () => {
    for (let t = Date.UTC(1900, 0, 1); t <= Date.UTC(2050, 11, 31); t += 7 * 86_400_000) {
      const date = new Date(t).toISOString().slice(0, 10);
      expect(dayPillar(date).label, date).toBe(reference(date)[2]);
    }
  });
});

describe("보정 후 풀이", () => {
  it("월주가 바뀌면 오행 분포·용신도 바뀐 월주로 다시 계산한다", () => {
    // 2003-01-04: 소한(1/6) 전이라 병자월이 아니라 임자월 — saju-fortune 단독으로는 계축월로 계산됨
    const result = analyze({ birthDate: "2003-01-04", birthTime: "03:34", gender: "male", calendar: "solar" }, "career");
    expect(result.pillars.month.label).toBe("임자");
    const total = Object.values(result.fiveElements).reduce((a, b) => a + b, 0);
    expect(total).toBeGreaterThan(0);
    expect(result.fortune?.type).toBe("career");
  });

  it("보정이 필요 없는 궁합은 패키지 결과와 같다", () => {
    const a: BirthProfile = { birthDate: "1990-03-15", birthTime: "10:30", gender: "male", calendar: "solar" };
    const b: BirthProfile = { birthDate: "1992-07-20", birthTime: "14:30", gender: "female", calendar: "solar" };
    expect(compatibility(a, b)).toEqual(
      checkCompatibility({ person1: { ...a, calendar: "solar" }, person2: { ...b, calendar: "solar" } }),
    );
  });
});
