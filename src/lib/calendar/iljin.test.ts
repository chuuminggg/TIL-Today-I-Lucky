import { analyzeSaju } from "saju-fortune";
import { describe, expect, it } from "vitest";
import { dayPillar } from "./iljin";

describe("dayPillar", () => {
  it("기준일 2000-01-01은 무오일", () => {
    expect(dayPillar("2000-01-01").hanja).toBe("戊午");
  });

  it("saju-fortune의 일주와 1900–2099년 전 구간에서 일치한다", () => {
    for (let year = 1900; year < 2100; year += 7) {
      for (const md of ["01-01", "02-28", "03-01", "07-15", "12-31"]) {
        const date = `${year}-${md}`;
        // 정오 출생으로 두어 자시(23시) 경계의 영향을 배제
        const expected = analyzeSaju({ birthDate: date, birthTime: "12:00", gender: "male" }).pillars.day.label;
        expect(dayPillar(date).label, date).toBe(expected);
      }
    }
  });
});
