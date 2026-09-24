import { describe, expect, it } from "vitest";
import { cardById, TAROT_DECK } from "./cards";
import { PHRASES } from "./data/phrases";
import { interpretReading } from "./interpret";
import { buildStory, type StoryCard } from "./narrative";
import { SPREADS, spreadById } from "./spreads";

/** 스프레드 자리에 원하는 카드를 직접 놓는다 — "cups-5" 는 정방향, "cups-5r" 는 역방향 */
const lay = (spreadId: string, ids: string[]): StoryCard[] =>
  spreadById(spreadId)!.positions.map((position, i) => ({
    position,
    card: cardById(ids[i].replace(/r$/, ""))!,
    reversed: ids[i].endsWith("r"),
  }));

const CONNECTORS = ["그러니", "그래서", "다만", "하지만", "다행히", "그래도", "그런데", "한편", "그리고", "이어서"];

describe("PHRASES", () => {
  it("78장 × 정·역방향 구절이 모두 있고 짧다", () => {
    for (const card of TAROT_DECK) {
      const phrases = PHRASES[card.id];
      expect(phrases, card.id).toHaveLength(2);
      for (const p of phrases) expect(p.length, `${card.id}: ${p}`).toBeLessThanOrEqual(20);
    }
    const all = Object.values(PHRASES).flat();
    expect(new Set(all).size).toBe(all.length);
  });
});

describe("buildStory — 모든 스프레드 무작위 조합", () => {
  it.each(SPREADS.map((s) => [s.id, s.positions.length] as const))("%s: 빈칸·조사 미처리 없이 적당한 길이", (spreadId, n) => {
    for (let s = 0; s < 200; s++) {
      const picks = Array.from({ length: n }, (_, i) => (s * 13 + i * 11) % 78);
      if (new Set(picks).size < n) continue;
      const { story } = interpretReading({ topic: "free", spreadId, seed: `story-${s}-seed`, picks });
      expect(story).not.toMatch(/\{|\}|undefined|null|\(이\)|\(을\)|\(으\)|이\/가|을\/를/);
      expect(story.length).toBeGreaterThanOrEqual(30);
      expect(story.length).toBeLessThanOrEqual(500);
      for (const connector of CONNECTORS) {
        const starts = story.split(/(?<=[.요])\s+/).filter((sentence) => sentence.startsWith(`${connector} `));
        expect(starts.length, `${connector} 중복: ${story}`).toBeLessThanOrEqual(1);
      }
    }
  });

  it("같은 요청이면 같은 문단", () => {
    const req = { topic: "love" as const, spreadId: "relationship", seed: "same-seed-01", picks: [3, 14, 25, 36, 47] };
    expect(interpretReading(req).story).toBe(interpretReading(req).story);
  });
});

describe("buildStory — 문장 규칙", () => {
  it("과거→현재→미래를 연결어로 잇고, 나아지면 '다행히'", () => {
    const story = buildStory("three-time", lay("three-time", ["swords-3", "cups-6", "major-19"]), "fixed-seed-1");
    expect(story).toMatch(/^(지난 시간에는 소드 3 카드가 보여 주는 말로 받은 상처가 있었어요|이 흐름은 소드 3 카드의 말로 받은 상처에서 시작됐어요)\./);
    expect(story).toContain("다행히");
    expect(story).toContain("태양 카드");
  });

  it("장애물 자리의 정방향은 '지나치면', 역방향은 가로막는 것으로 읽는다", () => {
    const up = buildStory("relationship", lay("relationship", ["cups-2", "cups-11", "cups-10", "wands-13", "major-21"]), "s1");
    expect(up).toMatch(/다만 .*빛나는 자신감.*(지나치면|과하면)/);
    const down = buildStory("relationship", lay("relationship", ["cups-2", "cups-11", "cups-10", "wands-13r", "major-21"]), "s1");
    expect(down).toMatch(/다만 .*불안에서 나온 질투.*(가로막고|걸림돌은)/);
  });

  it("재회의 '헤어진 이유'에 좋은 카드가 나오면 '그것만으로는 부족했다'로 읽는다", () => {
    const good = buildStory("reunion", lay("reunion", ["cups-2", "cups-6", "swords-3r", "major-20", "cups-5r"]), "s2");
    expect(good).toMatch(/서로 통하는 마음이 있었(지만|는데도)/);
    const bad = buildStory("reunion", lay("reunion", ["swords-3", "cups-6", "swords-3r", "major-20", "cups-5r"]), "s2");
    expect(bad).toMatch(/말로 받은 상처가 (컸어요|두 사람 사이를)/);
  });

  it("조언 자리는 카드의 조언 문장을 그대로 잇는다", () => {
    const story = buildStory("yes-no", lay("yes-no", ["cups-1", "major-19", "major-1"]), "s3");
    expect(story).toContain(cardById("major-1")!.upright.advice);
    expect(story).toMatch(/(그러니|그래서) /);
  });

  it("양자택일은 두 길을 비교해 더 밝은 쪽을 알려준다", () => {
    const story = buildStory("choice", lay("choice", ["pentacles-2", "swords-9", "swords-10", "major-17", "major-19"]), "s4");
    expect(story).toContain("A를 택하면 소드 9 카드의 잠 못 드는 걱정을 지나 소드 10 카드의 바닥을 친 끝으로 이어지고");
    expect(story).toContain("B를 택하면 별 카드의 다시 빛나는 희망을 지나 태양 카드의 밝은 기쁨과 성공으로 이어져요");
    expect(story).toContain("B 쪽 흐름이 더 밝아요");
  });

  it("이번 주는 가장 좋은 날과 조심할 날, 한 주 전체를 알려준다", () => {
    const story = buildStory("week", lay("week", ["major-19", "cups-2", "cups-3", "swords-9", "wands-6", "major-17", "cups-9"]), "s5");
    expect(story).toBe(
      "이번 주 기운이 가장 좋은 날은 월요일이에요. 태양 카드의 밝은 기쁨과 성공이 함께해요. 목요일에는 소드 9 카드의 잠 못 드는 걱정을 조심하세요. 일곱 날 중 6일이 밝은 흐름이라, 전체적으로 밝은 한 주예요.",
    );
  });

  it("켈틱 크로스는 핵심 자리만 엮는다", () => {
    const ids = ["major-0", "major-16", "major-17", "major-9", "cups-6", "wands-8", "wands-7", "pentacles-3", "major-19", "major-21"];
    const story = buildStory("celtic-cross", lay("celtic-cross", ids), "s6");
    expect(story).not.toContain("컵 6 카드"); // 과거 자리 생략
    expect(story).not.toContain("펜타클 3 카드"); // 주변 환경 생략
    expect(story).toContain("세계 카드");
    expect(story).toContain("바라면서도 두려워하고");
  });
});
