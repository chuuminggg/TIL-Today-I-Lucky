import { describe, expect, it } from "vitest";
import { COMPONENTS, getNamingReport, readsAs } from "./report";

const baby = { calendar: "solar", birthDate: "2024-05-18", birthTime: "09:20", gender: "female" } as const;

describe("readsAs", () => {
  it("대표 음, 두음법칙, 성씨 예외", () => {
    expect(readsAs("瑞", "서")).toBe(true);
    expect(readsAs("李", "이")).toBe(true);
    expect(readsAs("李", "리")).toBe(true);
    expect(readsAs("金", "김", true)).toBe(true);
    expect(readsAs("金", "김")).toBe(false);
    expect(readsAs("瑞", "아")).toBe(false);
  });
});

describe("getNamingReport", () => {
  it("후보를 점수순으로 채점하고 항목 합이 총점", async () => {
    const report = await getNamingReport({
      profile: baby,
      surname: "김",
      surnameHanja: "金",
      candidates: [{ givenName: "서아", hanjaName: "瑞雅" }, { givenName: "지유" }, { givenName: "하린", hanjaName: "河潾" }],
    });
    expect(report.names.map((n) => n.rank)).toEqual([1, 2, 3]);
    for (let i = 1; i < report.names.length; i++) expect(report.names[i - 1].score).toBeGreaterThanOrEqual(report.names[i].score);
    for (const n of report.names) {
      expect(COMPONENTS.reduce((sum, c) => sum + n.components[c.key], 0)).toBe(n.score);
      for (const c of COMPONENTS) expect(n.components[c.key]).toBeLessThanOrEqual(c.max);
    }
    expect(report.needed.length).toBeGreaterThan(0);
    expect(report.neededReason).toMatch(/^.\(.\) [^/]*용신/);
    expect(report.neededReason).not.toMatch(/\)\(/);

    const seoa = report.names.find((n) => n.fullName === "김서아")!;
    expect(seoa).toMatchObject({ hanjaName: "金瑞雅", basis: "hanja" });
    expect(seoa.strokes.map((s) => s.char)).toEqual(["金", "瑞", "雅"]);
    expect(seoa.notes).toEqual([]);

    const jiyu = report.names.find((n) => n.fullName === "김지유")!;
    expect(jiyu.basis).toBe("hangul");
    expect(jiyu.notes.join()).toContain("한글 획수");
  });

  it("음이 맞지 않는 한자는 안내한다", async () => {
    const report = await getNamingReport({ profile: baby, surname: "김", surnameHanja: "金", candidates: [{ givenName: "서아", hanjaName: "瑞金" }] });
    expect(report.names[0].notes.join()).toContain("金의 대표 음은 '금'");
  });

  it("음력 생일도 양력으로 바꿔 계산하고, 잘못된 입력은 오류", async () => {
    const lunar = await getNamingReport({ profile: { calendar: "lunar", birthDate: "2024-04-11", gender: "male" }, surname: "이", candidates: [{ givenName: "도윤" }] });
    expect(lunar.warnings.join()).toContain("시간");
    await expect(getNamingReport({ profile: baby, surname: "Kim", candidates: [{ givenName: "서아" }] })).rejects.toThrow();
    await expect(getNamingReport({ profile: baby, surname: "김", surnameHanja: "金李", candidates: [{ givenName: "서아" }] })).rejects.toThrow("글자 수");
  });
});
