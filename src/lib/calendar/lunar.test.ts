import { describe, expect, it } from "vitest";
import { lunarToSolar, parseDate, todayKST } from "./lunar";

describe("lunarToSolar", () => {
  it("평달 음력을 양력으로 변환한다", () => {
    expect(lunarToSolar({ year: 1990, month: 2, day: 19 })).toBe("1990-03-15");
  });

  it("윤달을 구분해 변환한다 (2023년 윤2월)", () => {
    expect(lunarToSolar({ year: 2023, month: 2, day: 10 }, true)).toBe("2023-03-31");
    expect(lunarToSolar({ year: 2023, month: 2, day: 10 }, false)).toBe("2023-03-01");
  });

  it("윤달이 없는 달을 윤달로 요청하면 에러", () => {
    expect(() => lunarToSolar({ year: 2024, month: 2, day: 10 }, true)).toThrow();
  });
});

describe("parseDate", () => {
  it("형식이 틀리면 에러", () => {
    expect(() => parseDate("1990/03/15")).toThrow();
  });
});

describe("todayKST", () => {
  it("UTC 15시 이후는 KST 기준 다음 날", () => {
    expect(todayKST(new Date("2026-09-24T15:30:00Z"))).toBe("2026-09-25");
    expect(todayKST(new Date("2026-09-24T14:59:00Z"))).toBe("2026-09-24");
  });
});
