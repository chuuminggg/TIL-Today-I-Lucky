import { describe, expect, it } from "vitest";
import { parseHistory, recentSameTopic, type HistoryEntry } from "./history";

const entry = (topic: HistoryEntry["request"]["topic"], minutesAgo: number, now: number, seed = `${topic}-${minutesAgo}`): HistoryEntry => ({
  createdAt: new Date(now - minutesAgo * 60_000).toISOString(),
  request: { topic, spreadId: "one", seed, picks: [1] },
  title: "t",
  summary: "s",
});

describe("tarot history", () => {
  it("망가진 저장값은 빈 기록으로 본다", () => {
    expect(parseHistory("{oops")).toEqual([]);
    expect(parseHistory('{"a":1}')).toEqual([]);
    expect(parseHistory(null)).toEqual([]);
  });

  it("같은 주제를 30분 안에 본 기록만 찾는다", () => {
    const now = Date.parse("2026-09-27T12:00:00Z");
    const entries = [entry("love", 5, now), entry("career", 3, now), entry("love", 45, now)];
    expect(recentSameTopic(entries, "love", now).map((e) => e.request.seed)).toEqual(["love-5"]);
    expect(recentSameTopic(entries, "money", now)).toEqual([]);
    expect(recentSameTopic(entries, "love", now, 60 * 60_000)).toHaveLength(2);
  });
});
