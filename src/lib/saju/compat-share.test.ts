import { describe, expect, it } from "vitest";
import { compatShareQuery, parseCompatShare } from "./compat-share";
import { compatHeadline } from "./detail-text";

const toParams = (query: string) => Object.fromEntries(new URLSearchParams(query));

describe("궁합 공유 주소", () => {
  const share = { a: "민주", b: "하늘 & 별", score: 72, relation: "lover" as const };

  it("닉네임·점수·관계를 주고받는다", () => {
    const query = compatShareQuery(share);
    expect(query).not.toMatch(/\d{4}-\d{2}/); // 생년월일 없음
    expect(parseCompatShare(toParams(query))).toEqual(share);
  });

  it("한 줄 문장은 주소가 아니라 점수로 만든다", () => {
    expect(compatHeadline(share.score)).toBe("잘 맞는 부분이 많은 궁합이에요");
    expect(parseCompatShare({ ...toParams(compatShareQuery(share)), h: "천생연분" })).toEqual(share);
  });

  it("형식이 틀리면 null", () => {
    const base = toParams(compatShareQuery(share));
    expect(parseCompatShare({})).toBeNull();
    expect(parseCompatShare({ ...base, s: "101" })).toBeNull();
    expect(parseCompatShare({ ...base, s: "7.5" })).toBeNull();
    expect(parseCompatShare({ ...base, s: "" })).toBeNull();
    expect(parseCompatShare({ ...base, r: "enemy" })).toBeNull();
    expect(parseCompatShare({ ...base, a: "  " })).toBeNull();
    expect(parseCompatShare({ ...base, b: "가".repeat(21) })).toBeNull();
  });
});
