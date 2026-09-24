import { describe, expect, it } from "vitest";
import { analyze, compatibility } from "./adapter";

describe("saju adapter", () => {
  it("양력 입력으로 사주팔자를 계산한다 (1990-03-15 10:30)", () => {
    const result = analyze({ birthDate: "1990-03-15", birthTime: "10:30", gender: "male", calendar: "solar" });
    expect(result.pillars.year.label).toBe("경오");
    expect(result.pillars.month.label).toBe("기묘"); // 경칩(3/6) 이후 묘월
    expect(result.pillars.hour?.label).toBe("기사");
    expect(result.dayMaster.element).toBe("earth");
  });

  it("음력 입력은 양력으로 변환한 뒤 같은 결과를 낸다", () => {
    const solar = analyze({ birthDate: "1990-03-15", birthTime: "10:30", gender: "male", calendar: "solar" });
    const lunar = analyze({ birthDate: "1990-02-19", birthTime: "10:30", gender: "male", calendar: "lunar" });
    expect(lunar.pillars).toEqual(solar.pillars);
  });

  it("출생시를 모르면 시주를 확정하지 않는다", () => {
    const result = analyze({ birthDate: "1990-03-15", gender: "female", calendar: "solar" }, "love");
    expect(result.pillars.hour).toBeNull();
    expect(result.timeAccuracy).toBe("unknown");
    expect(result.fortune?.type).toBe("love");
  });

  it("궁합 점수는 0–100", () => {
    const result = compatibility(
      { birthDate: "1990-03-15", birthTime: "10:30", gender: "male", calendar: "solar" },
      { birthDate: "1992-07-20", birthTime: "14:30", gender: "female", calendar: "solar" },
    );
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });
});
