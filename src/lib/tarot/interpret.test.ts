import { describe, expect, it } from "vitest";
import { cardById } from "./cards";
import { shuffleDeck } from "./draw";
import { interpretReading, type ReadingRequest } from "./interpret";

const SEED = "test-seed-0001";
const deck = shuffleDeck(SEED, false);
/** 원하는 카드가 놓인 자리 — 역방향 없이 섞었을 때 기준 */
const slots = (...ids: string[]) => ids.map((id) => deck.findIndex((d) => d.card.id === id));

const read = (req: Partial<ReadingRequest> & Pick<ReadingRequest, "spreadId" | "picks">) =>
  interpretReading({ topic: "free", seed: SEED, allowReversed: false, ...req });

describe("interpretReading — 카드별 해석", () => {
  it("포지션 관점과 주제에 맞는 문장을 고른다", () => {
    const r = read({ topic: "love", spreadId: "relationship", picks: slots("major-6", "major-19", "cups-2", "major-4", "major-21") });
    const [me, them, , obstacle, future] = r.cards;
    expect(me.text).toBe(cardById("major-6")!.upright.love);
    expect(them.text).toBe(cardById("major-19")!.upright.feeling); // 상대의 마음
    expect(obstacle.text).toBe(cardById("major-4")!.caution); // 정방향이어도 장애물은 주의점
    expect(future.text).toBe(cardById("major-21")!.upright.love);
    expect(r.summary.title).toContain("앞으로의 전망");
  });

  it("직업 주제는 career, 조언 포지션은 advice", () => {
    const r = read({ topic: "career", spreadId: "three-action", picks: slots("wands-3", "major-1", "major-19") });
    expect(r.cards[0].text).toBe(cardById("wands-3")!.upright.career);
    expect(r.cards[1].text).toBe(cardById("major-1")!.upright.advice);
    expect(r.advice).toBe(cardById("major-1")!.upright.advice);
  });

  it("역방향이면 역방향 해석을 쓴다", () => {
    const withRev = shuffleDeck(SEED);
    const slot = withRev.findIndex((d) => d.reversed);
    const r = interpretReading({ topic: "money", seed: SEED, spreadId: "one", picks: [slot] });
    expect(r.cards[0].reversed).toBe(true);
    expect(r.cards[0].text).toBe(withRev[slot].card.reversed.money);
  });
});

describe("interpretReading — 전체 분석", () => {
  it("메이저가 절반 이상이면 큰 흐름, 강화 조합을 알려준다", () => {
    const r = read({ spreadId: "three-time", picks: slots("major-17", "cups-4", "major-19") });
    const kinds = r.insights.map((i) => i.kind);
    expect(kinds).toContain("major");
    expect(r.insights.find((i) => i.kind === "combo")?.text).toContain("뒷받침");
  });

  it("같은 수트·같은 숫자가 반복되면 알려준다", () => {
    const r = read({ spreadId: "three-time", picks: slots("cups-5", "cups-2", "pentacles-5") });
    expect(r.insights.find((i) => i.kind === "suit")?.text).toContain("컵");
    expect(r.insights.find((i) => i.kind === "number")?.text).toContain("갈등과 변화");
    expect(r.insights.find((i) => i.kind === "major")?.text).toContain("모두 마이너");
  });

  it("불과 물이 이어지면 원소 충돌을 알려준다", () => {
    const r = read({ spreadId: "three-time", picks: slots("wands-2", "cups-3", "wands-4") });
    expect(r.insights.find((i) => i.kind === "element")?.text).toContain("부딪히는");
  });

  it("궁정 카드는 인물의 영향을 알려준다", () => {
    const r = read({ spreadId: "three-time", picks: slots("cups-13", "major-0", "wands-2") });
    expect(r.insights.find((i) => i.kind === "court")?.text).toContain("섬세하고 품이 넓은 사람");
  });

  it("과거보다 미래가 좋으면 나아지는 흐름", () => {
    const r = read({ spreadId: "three-time", picks: slots("major-16", "cups-2", "major-19") });
    expect(r.insights.find((i) => i.kind === "flow")?.text).toContain("나아지는");
  });

  it("이번 주 스프레드는 좋은 날과 조심할 날을 알려준다", () => {
    const r = read({ spreadId: "week", picks: slots("major-19", "cups-2", "cups-3", "major-16", "wands-2", "wands-3", "wands-4") });
    expect(r.insights.find((i) => i.kind === "flow")?.text).toBe("기운이 가장 좋은 날은 월요일, 조심할 날은 목요일이에요.");
    expect(r.summary.title).toContain("월요일");
  });
});

describe("interpretReading — 예/아니오", () => {
  it("긍정 카드가 많으면 예", () => {
    const r = read({ topic: "yesno", spreadId: "yes-no", picks: slots("major-19", "major-17", "major-21") });
    expect(r.verdict?.answer).toBe("yes");
  });

  it("결과 카드가 부정이면 아니오 쪽으로 기운다", () => {
    const r = read({ topic: "yesno", spreadId: "yes-no", picks: slots("cups-2", "major-16", "swords-9") });
    expect(r.verdict?.answer).toBe("no");
  });

  it("예/아니오 주제가 아니면 판정하지 않는다", () => {
    expect(read({ spreadId: "three-time", picks: slots("major-19", "major-17", "major-21") }).verdict).toBeUndefined();
  });
});

describe("interpretReading — 요청 검증", () => {
  it("카드 장수·중복·스프레드를 확인한다", () => {
    expect(() => read({ spreadId: "three-time", picks: [1, 2] })).toThrow("3장");
    expect(() => read({ spreadId: "three-time", picks: [1, 1, 2] })).toThrow("두 번");
    expect(() => read({ spreadId: "nope", picks: [1] })).toThrow("스프레드");
  });

  it("같은 요청이면 같은 결과", () => {
    const req = { topic: "love" as const, seed: "abc-12345", spreadId: "reunion", picks: [0, 10, 20, 30, 40] };
    expect(interpretReading(req)).toEqual(interpretReading(req));
  });
});
