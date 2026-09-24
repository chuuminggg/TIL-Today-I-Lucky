import { describe, expect, it } from "vitest";
import { drawCards, pickCards, shuffleDeck } from "./draw";

describe("drawCards", () => {
  it("같은 시드면 같은 카드", () => {
    expect(drawCards("a:2026-09-24")).toEqual(drawCards("a:2026-09-24"));
  });

  it("여러 장을 뽑을 때 중복이 없다", () => {
    const ids = drawCards("seed", 3).map((d) => d.card.id);
    expect(new Set(ids).size).toBe(3);
  });

  it("뒤집힌 카드는 역방향 해석을 가진다", () => {
    for (let d = 0; d < 50; d++) {
      const [drawn] = drawCards(`user:${d}`);
      expect(drawn.side).toBe(drawn.reversed ? drawn.card.reversed : drawn.card.upright);
    }
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

describe("shuffleDeck / pickCards", () => {
  it("78장을 빠짐없이 섞는다", () => {
    const deck = shuffleDeck("seed-1234");
    expect(new Set(deck.map((d) => d.card.id)).size).toBe(78);
    expect(shuffleDeck("seed-5678").map((d) => d.card.id)).not.toEqual(deck.map((d) => d.card.id));
  });

  it("같은 시드 + 같은 선택이면 같은 결과", () => {
    expect(pickCards("seed-1234", [3, 40, 77])).toEqual(pickCards("seed-1234", [3, 40, 77]));
  });

  it("역방향을 끄면 배치는 같고 방향만 모두 정방향", () => {
    const withRev = shuffleDeck("seed-1234");
    const noRev = shuffleDeck("seed-1234", false);
    expect(noRev.map((d) => d.card.id)).toEqual(withRev.map((d) => d.card.id));
    expect(withRev.some((d) => d.reversed)).toBe(true);
    expect(noRev.every((d) => !d.reversed)).toBe(true);
  });

  it("범위를 벗어난 자리는 에러", () => {
    expect(() => pickCards("seed-1234", [78])).toThrow(RangeError);
  });
});
