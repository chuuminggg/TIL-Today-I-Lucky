import { describe, expect, it } from "vitest";
import { dayPillar } from "@/lib/calendar/iljin";
import { analyze } from "./adapter";
import { computeDailyFortune } from "./daily";
import { SCENE } from "./narrative";
import { STEMS, isClash, isHarmony, tenGodOf } from "./ganji";
import { luckyItems } from "./luck";

const stem = (ko: string) => STEMS.find((s) => s.ko === ko)!;

describe("tenGodOf", () => {
  it("기토(己) 일간 기준 십신", () => {
    const dm = stem("기");
    expect(tenGodOf(dm, stem("기"))).toBe("비견");
    expect(tenGodOf(dm, stem("무"))).toBe("겁재");
    expect(tenGodOf(dm, stem("신"))).toBe("식신");
    expect(tenGodOf(dm, stem("경"))).toBe("상관");
    expect(tenGodOf(dm, stem("계"))).toBe("편재");
    expect(tenGodOf(dm, stem("임"))).toBe("정재");
    expect(tenGodOf(dm, stem("을"))).toBe("편관");
    expect(tenGodOf(dm, stem("갑"))).toBe("정관");
    expect(tenGodOf(dm, stem("정"))).toBe("편인");
    expect(tenGodOf(dm, stem("병"))).toBe("정인");
  });
});

describe("지지 합·충", () => {
  it("자축합, 자오충", () => {
    expect(isHarmony(0, 1)).toBe(true);
    expect(isHarmony(1, 0)).toBe(true);
    expect(isClash(0, 6)).toBe(true);
    expect(isClash(0, 1)).toBe(false);
  });
});

describe("computeDailyFortune", () => {
  const saju = analyze({ birthDate: "1990-03-15", birthTime: "10:30", gender: "male", calendar: "solar" });

  it("같은 입력이면 같은 결과", () => {
    const today = dayPillar("2026-09-24");
    const a = computeDailyFortune(saju, "male", today, "seed");
    const b = computeDailyFortune(saju, "male", today, "seed");
    expect(a).toEqual(b);
  });

  it("60일 동안 점수가 범위 안에 있고 날마다 달라진다", () => {
    const scores = new Set<number>();
    for (let d = 1; d <= 60; d++) {
      const date = new Date(Date.UTC(2026, 0, d)).toISOString().slice(0, 10);
      const result = computeDailyFortune(saju, "male", dayPillar(date), date);
      expect(result.score).toBeGreaterThanOrEqual(30);
      expect(result.score).toBeLessThanOrEqual(98);
      expect(result.categories).toHaveLength(4);
      for (const c of result.categories) expect(c.stars).toBeGreaterThanOrEqual(1);
      expect(result.factors.length).toBeGreaterThan(0);
      scores.add(result.score);
    }
    expect(scores.size).toBeGreaterThan(5);
  });
});

describe("오늘의 이야기 문단", () => {
  const saju = analyze({ birthDate: "1990-03-15", birthTime: "10:30", gender: "male", calendar: "solar" });

  it("7일 연속 매일 다르게 읽히고, 빈칸·조사 미처리가 없다", () => {
    const stories = new Set<string>();
    for (let d = 1; d <= 7; d++) {
      const date = `2026-10-${String(20 + d).padStart(2, "0")}`;
      const { story, avoid } = computeDailyFortune(saju, "male", dayPillar(date), date);
      expect(story).not.toMatch(/\{|\}|undefined|null|이\/가|을\/를|은\/는/);
      expect(story.split(/(?<=요\.)\s/).length).toBeGreaterThanOrEqual(2);
      expect(avoid.length).toBeGreaterThanOrEqual(1);
      expect(avoid.length).toBeLessThanOrEqual(3);
      for (const item of avoid) expect(item, item).toMatch(/[.요]$/);
      expect(avoid.join(" "), "조사").not.toMatch(/[고증정]는 /);
      stories.add(story);
    }
    expect(stories.size).toBe(7);
  });

  it("1년 내내 문장 규칙을 지킨다", () => {
    for (let d = 0; d < 365; d++) {
      const date = new Date(Date.UTC(2026, 0, 1 + d)).toISOString().slice(0, 10);
      const { story } = computeDailyFortune(saju, "male", dayPillar(date), date);
      expect(story, date).not.toMatch(/\{|\}|undefined/);
      expect(story.length, date).toBeLessThanOrEqual(300);
    }
  });
});

describe("luckyItems", () => {
  it("오행별 행운 요소", () => {
    const lucky = luckyItems("wood", "2026-09-24");
    expect(lucky.direction).toBe("동쪽");
    expect(lucky.numbers).toEqual([3, 8]);
    expect(lucky.colorHex).toMatch(/^#[0-9a-f]{6}$/);
  });
});

describe("구체적인 장면·행동 문장", () => {
  const saju = analyze({ birthDate: "1990-03-15", birthTime: "10:30", gender: "male", calendar: "solar" });

  it("이야기 문단에 그날 십신의 생활 장면이 들어간다", () => {
    for (let d = 1; d <= 10; d++) {
      const date = `2026-11-${String(d).padStart(2, "0")}`;
      const f = computeDailyFortune(saju, "male", dayPillar(date), `scene:${date}`);
      expect(SCENE[f.tenGod].some((s) => f.story.includes(s)), f.story).toBe(true);
    }
  });

  it("분야별 문장 뒤에 구체적인 행동 한 줄이 붙는다", () => {
    const f = computeDailyFortune(saju, "male", dayPillar("2026-11-03"), "tip");
    for (const c of f.categories) expect(c.text.split(/(?<=[.요])\s+/).length, c.text).toBeGreaterThanOrEqual(2);
  });
});
