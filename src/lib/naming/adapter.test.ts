import { describe, expect, it } from "vitest";
import { recommend } from "./adapter";

describe("naming adapter", () => {
  it("후보 이름을 100점 만점으로 채점한다", async () => {
    const result = await recommend({
      surname: "김",
      surnameHanja: "金",
      birthDate: "2024-05-18",
      birthTime: "09:20",
      gender: "female",
      calendar: "solar",
      candidates: [{ givenName: "서아", hanjaName: "瑞雅" }, { givenName: "지유" }],
    });
    expect(result.recommendations.length).toBeGreaterThan(0);
    for (const rec of result.recommendations) {
      const { elementBalance, strokeHarmony, soundFlow, preferenceFit } = rec.components;
      expect(elementBalance + strokeHarmony + soundFlow + preferenceFit).toBe(rec.score);
    }
  });
});
