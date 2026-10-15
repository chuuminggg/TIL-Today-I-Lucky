import { describe, expect, it } from "vitest";
import { interpretReading } from "./interpret";
import { parseShareQuery, readingFromShare, shareQuery } from "./share";

const reading = interpretReading({
  topic: "love",
  question: "그 사람 마음은?",
  spreadId: "three-time",
  seed: "seed-abcdef",
  picks: [5, 30, 70],
});

const toParams = (query: string) => Object.fromEntries(new URLSearchParams(query));

describe("타로 공유 주소", () => {
  it("주소만으로 같은 결과를 다시 만든다", () => {
    const again = readingFromShare(toParams(shareQuery(reading)))!;
    expect(again.cards.map((c) => [c.card.id, c.reversed])).toEqual(reading.cards.map((c) => [c.card.id, c.reversed]));
    expect(again.story).toBe(reading.story);
    expect(again.summary).toEqual(reading.summary);
  });

  it("질문은 고를 때만 싣는다", () => {
    expect(shareQuery(reading)).not.toContain("q=");
    expect(readingFromShare(toParams(shareQuery(reading)))!.question).toBeUndefined();
    expect(readingFromShare(toParams(shareQuery(reading, true)))!.question).toBe("그 사람 마음은?");
  });

  it("역방향을 뺀 판은 rev=0으로 재현", () => {
    const upright = interpretReading({ topic: "free", spreadId: "one", seed: "seed-abcdef", picks: [12], allowReversed: false });
    const query = shareQuery(upright);
    expect(query).toContain("rev=0");
    expect(readingFromShare(toParams(query))!.allowReversed).toBe(false);
    expect(parseShareQuery(toParams(shareQuery(reading)))!.allowReversed).toBe(true);
  });

  it("형식이 틀리거나 해석할 수 없는 주소는 null", () => {
    const base = toParams(shareQuery(reading));
    expect(readingFromShare({})).toBeNull();
    expect(readingFromShare({ ...base, t: "health" })).toBeNull();
    expect(readingFromShare({ ...base, p: "5,30,x" })).toBeNull();
    expect(readingFromShare({ ...base, p: "5,30,78" })).toBeNull();
    expect(readingFromShare({ ...base, p: "5,30" })).toBeNull(); // 스프레드 장수와 다름
    expect(readingFromShare({ ...base, p: "5,5,30" })).toBeNull();
    expect(readingFromShare({ ...base, s: "nope" })).toBeNull();
  });
});
