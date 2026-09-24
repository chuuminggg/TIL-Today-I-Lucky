import { describe, expect, it } from "vitest";
import { cardById, TAROT_DECK } from "./cards";

describe("TAROT_DECK 데이터", () => {
  it("78장 (메이저 22 + 수트별 14), id·slug 중복 없음", () => {
    expect(TAROT_DECK).toHaveLength(78);
    expect(TAROT_DECK.filter((c) => c.arcana === "major")).toHaveLength(22);
    for (const suit of ["wands", "cups", "swords", "pentacles"]) {
      expect(TAROT_DECK.filter((c) => c.suit === suit)).toHaveLength(14);
    }
    expect(new Set(TAROT_DECK.map((c) => c.id)).size).toBe(78);
    expect(new Set(TAROT_DECK.map((c) => c.slug)).size).toBe(78);
  });

  it("순서가 고정돼 있다 (오늘의 타로 시드 결과 유지)", () => {
    expect(TAROT_DECK[0].id).toBe("major-0");
    expect(TAROT_DECK[21].slug).toBe("the-world");
    expect(TAROT_DECK[22].id).toBe("wands-1");
    expect(TAROT_DECK[77].slug).toBe("king-of-pentacles");
  });

  it("모든 카드의 정·역방향 해석 필드가 채워져 있다", () => {
    for (const card of TAROT_DECK) {
      for (const side of [card.upright, card.reversed]) {
        expect(side.keywords.length, card.id).toBeGreaterThan(0);
        for (const field of ["meaning", "love", "feeling", "career", "money", "advice"] as const) {
          expect(side[field].trim(), `${card.id}.${field}`).not.toBe("");
        }
      }
      expect(card.caution, card.id).toBeTruthy();
    }
  });

  it("메이저는 직접 작성한 해석이다", () => {
    expect(TAROT_DECK.filter((c) => c.detailed).map((c) => c.arcana)).toEqual(Array(22).fill("major"));
  });

  it("조합 카드는 실제 존재하는 다른 카드를 가리킨다", () => {
    for (const card of TAROT_DECK) {
      for (const id of [...card.combos.reinforce, ...card.combos.oppose]) {
        expect(cardById(id), `${card.id} → ${id}`).toBeDefined();
        expect(id).not.toBe(card.id);
      }
    }
  });

  it("마이너 카드는 수트 원소를 따른다", () => {
    expect(cardById("wands-3")?.element).toBe("fire");
    expect(cardById("cups-3")?.element).toBe("water");
    expect(cardById("swords-3")?.element).toBe("air");
    expect(cardById("pentacles-3")?.element).toBe("earth");
  });
});
