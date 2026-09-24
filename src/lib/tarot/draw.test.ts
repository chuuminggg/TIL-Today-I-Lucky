import { describe, expect, it } from "vitest";
import { TAROT_DECK } from "./cards";
import { drawCards } from "./draw";

describe("TAROT_DECK", () => {
  it("78장 (메이저 22 + 마이너 56), id 중복 없음", () => {
    expect(TAROT_DECK).toHaveLength(78);
    expect(TAROT_DECK.filter((c) => c.arcana === "major")).toHaveLength(22);
    expect(new Set(TAROT_DECK.map((c) => c.id)).size).toBe(78);
  });
});

describe("drawCards", () => {
  it("같은 시드면 같은 카드", () => {
    expect(drawCards("a:2026-09-24")).toEqual(drawCards("a:2026-09-24"));
  });

  it("여러 장을 뽑을 때 중복이 없다", () => {
    const ids = drawCards("seed", 3).map((d) => d.card.id);
    expect(new Set(ids).size).toBe(3);
  });

  it("날짜가 바뀌면 카드가 고르게 바뀐다", () => {
    const seen = new Set<string>();
    let reversed = 0;
    for (let d = 0; d < 365; d++) {
      const [drawn] = drawCards(`user:${d}`);
      seen.add(drawn.card.id);
      if (drawn.reversed) reversed++;
    }
    expect(seen.size).toBeGreaterThan(60);
    expect(reversed / 365).toBeGreaterThan(0.2);
    expect(reversed / 365).toBeLessThan(0.4);
  });
});
