import { describe, expect, it } from "vitest";
import { SPREADS, spreadsForTopic, TOPIC_IDS } from "./spreads";

describe("SPREADS", () => {
  it("id와 포지션 key가 중복되지 않는다", () => {
    expect(new Set(SPREADS.map((s) => s.id)).size).toBe(SPREADS.length);
    for (const s of SPREADS) expect(new Set(s.positions.map((p) => p.key)).size).toBe(s.positions.length);
  });

  it("모든 주제에 추천 스프레드가 있다", () => {
    for (const topic of TOPIC_IDS) expect(spreadsForTopic(topic).length, topic).toBeGreaterThan(0);
  });

  it("주제에 가장 맞는 스프레드가 먼저 나온다", () => {
    expect(spreadsForTopic("reunion")[0].id).toBe("reunion");
    expect(spreadsForTopic("crush")[0].id).toBe("relationship");
    expect(spreadsForTopic("yesno")[0].id).toBe("yes-no");
    expect(spreadsForTopic("career")[0].id).toBe("three-action");
  });

  it("켈틱 크로스는 10장", () => {
    expect(SPREADS.find((s) => s.id === "celtic-cross")?.positions).toHaveLength(10);
  });
});
