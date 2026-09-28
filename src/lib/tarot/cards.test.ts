import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { SYMBOLS } from "./data/symbols";
import { cardById, cardBySlug, relatedCards, TAROT_DECK } from "./cards";

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

  it("카드마다 고유한 해석을 가진다 (문장 복붙 방지)", () => {
    for (const field of ["meaning", "love", "feeling", "career", "money", "advice"] as const) {
      const texts = TAROT_DECK.flatMap((c) => [c.upright[field], c.reversed[field]]);
      const dupes = texts.filter((t, i) => texts.indexOf(t) !== i);
      expect(dupes, field).toEqual([]);
    }
  });

  it("조합 카드는 실제 존재하는 다른 카드를 가리킨다", () => {
    for (const card of TAROT_DECK) {
      for (const id of [...card.combos.reinforce, ...card.combos.oppose]) {
        expect(cardById(id), `${card.id} → ${id}`).toBeDefined();
        expect(id).not.toBe(card.id);
      }
    }
  });

  it("같은 두 카드가 강화이면서 대립일 수는 없다", () => {
    const pair = (a: string, b: string) => [a, b].sort().join("+");
    const reinforce = new Set(TAROT_DECK.flatMap((c) => c.combos.reinforce.map((id) => pair(c.id, id))));
    const conflicts = TAROT_DECK.flatMap((c) => c.combos.oppose.map((id) => pair(c.id, id))).filter((p) => reinforce.has(p));
    expect(conflicts).toEqual([]);
  });

  it("궁정 카드(11–14)만 인물 설명을 가진다", () => {
    const withPerson = TAROT_DECK.filter((c) => c.person).map((c) => c.id);
    const courts = TAROT_DECK.filter((c) => c.arcana === "minor" && c.number > 10).map((c) => c.id);
    expect(withPerson).toEqual(courts);
    expect(cardById("swords-14")?.person).toBe("논리적이고 원칙을 중시하는 권위자");
  });

  it("마이너 카드는 수트 원소를 따른다", () => {
    expect(cardById("wands-3")?.element).toBe("fire");
    expect(cardById("cups-3")?.element).toBe("water");
    expect(cardById("swords-3")?.element).toBe("air");
    expect(cardById("pentacles-3")?.element).toBe("earth");
  });

  it("모든 카드에 이미지가 있다 (public/tarot/rws/{slug}.webp)", () => {
    const missing = TAROT_DECK.filter((c) => !existsSync(path.join(process.cwd(), "public/tarot/rws", `${c.slug}.webp`)));
    expect(missing.map((c) => c.slug)).toEqual([]);
  });

  it("slug로 카드를 찾는다", () => {
    expect(cardBySlug("queen-of-cups")?.id).toBe("cups-13");
    expect(cardBySlug("nope")).toBeUndefined();
  });

  it("관련 카드는 양방향으로 모인다", () => {
    // 태양은 별을 강화로 적고, 컵 5는 태양을 대립으로 적었다
    const sun = relatedCards(cardById("major-19")!);
    expect(sun.reinforce.map((c) => c.id)).toContain("major-17");
    expect(sun.oppose.map((c) => c.id)).toContain("cups-5");
    expect(relatedCards(cardById("cups-5")!).oppose.map((c) => c.id)).toContain("major-19");
  });
});

describe("그림 속 상징 (카드 사전)", () => {
  it("메이저 22장 모두 상징이 4개 이상이고, 이름이 겹치지 않는다", () => {
    for (const card of TAROT_DECK.filter((c) => c.arcana === "major")) {
      const symbols = SYMBOLS[card.id];
      expect(symbols?.length, card.id).toBeGreaterThanOrEqual(4);
      expect(new Set(symbols.map((s) => s.name)).size, card.id).toBe(symbols.length);
      for (const s of symbols) expect(s.meaning, `${card.id} ${s.name}`).toMatch(/[.요]$/);
    }
  });

  it("없는 카드 id를 쓰지 않는다", () => {
    for (const id of Object.keys(SYMBOLS)) expect(cardById(id), id).toBeDefined();
  });
});
