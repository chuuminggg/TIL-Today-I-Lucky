import { describe, expect, it } from "vitest";
import { applyBackup, buildBackup, parseBackup } from "./backup";
import {
  addDays,
  badgesOf,
  mergeJournals,
  monthGrid,
  parseJournal,
  retroTarget,
  scoreLevel,
  statsOf,
  streakOf,
  updateDay,
  withReading,
  type Journal,
  type JournalDay,
} from "./journal";

const NOW = new Date("2026-10-22T01:00:00Z");
const visit = (date: string, extra: Partial<JournalDay> = {}): JournalDay => ({
  date,
  visitedAt: `${date}T00:00:00.000Z`,
  fortune: { score: 70, headline: "갑자일 · 주체성의 날" },
  tarot: { cardId: "major-0", reversed: false },
  readings: [],
  ...extra,
});
const journalOf = (...days: JournalDay[]): Journal => Object.fromEntries(days.map((d) => [d.date, d]));

describe("날짜 계산", () => {
  it("월·연 경계를 넘는다", () => {
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2024-03-01", -1)).toBe("2024-02-29");
  });

  it("달력 칸 — 2026년 10월 1일은 목요일", () => {
    const grid = monthGrid(2026, 10);
    expect(grid.slice(0, 4)).toEqual([null, null, null, null]);
    expect(grid[4]).toBe("2026-10-01");
    expect(grid.at(-1)).toBe("2026-10-31");
    expect(grid.filter(Boolean)).toHaveLength(31);
  });
});

describe("기록 저장", () => {
  it("없던 날은 방문 기록부터 만들고, 있던 날은 첫 방문 시각을 지킨다", () => {
    const a = updateDay({}, "2026-10-22", () => ({ fortune: { score: 60, headline: "x" } }), NOW);
    expect(a["2026-10-22"].visitedAt).toBe(NOW.toISOString());
    const b = updateDay(a, "2026-10-22", () => ({ hit: "yes" }), new Date("2026-10-22T10:00:00Z"));
    expect(b["2026-10-22"]).toMatchObject({ visitedAt: NOW.toISOString(), hit: "yes", fortune: { score: 60 } });
  });

  it("같은 타로 결과는 한 번만, 최신이 앞", () => {
    const day = visit("2026-10-22", { readings: [{ title: "a", summary: "a", query: "q1" }] });
    const twice = { ...day, readings: withReading(day, { title: "b", summary: "b", query: "q2" }) };
    const readings = withReading(twice, { title: "a2", summary: "a", query: "q1" });
    expect(readings.map((r) => r.query)).toEqual(["q1", "q2"]);
  });

  it("깨진 날은 버리고 나머지는 살린다", () => {
    const raw = JSON.stringify({ "2026-10-21": visit("2026-10-21"), "2026-10-22": { date: "2026-10-22" }, bad: 1 });
    expect(Object.keys(parseJournal(raw))).toEqual(["2026-10-21"]);
    expect(parseJournal("not json")).toEqual({});
    expect(parseJournal("[]")).toEqual({});
  });
});

describe("연속 방문", () => {
  it("오늘까지 이어진 날 수와 최고 기록", () => {
    const j = journalOf(visit("2026-10-01"), visit("2026-10-02"), visit("2026-10-03"), visit("2026-10-04"), visit("2026-10-20"), visit("2026-10-21"), visit("2026-10-22"));
    expect(streakOf(j, "2026-10-22")).toEqual({ current: 3, best: 4, visitedToday: true });
  });

  it("오늘 아직 안 왔으면 어제까지로 센다", () => {
    const j = journalOf(visit("2026-10-20"), visit("2026-10-21"));
    expect(streakOf(j, "2026-10-22")).toEqual({ current: 2, best: 2, visitedToday: false });
    expect(streakOf(j, "2026-10-23").current).toBe(0);
  });

  it("타로만 본 날은 방문으로 세지 않는다", () => {
    const j = journalOf(visit("2026-10-21"), { date: "2026-10-22", visitedAt: "", readings: [{ title: "", summary: "", query: "" }] });
    expect(streakOf(j, "2026-10-22")).toMatchObject({ current: 1, visitedToday: false });
  });
});

describe("회고 대상", () => {
  const j = journalOf(visit("2026-10-21"), visit("2026-10-22"));
  it("낮에는 어제, 저녁 6시 이후에는 오늘", () => {
    expect(retroTarget(j, "2026-10-22", 9)?.date).toBe("2026-10-21");
    expect(retroTarget(j, "2026-10-22", 19)?.date).toBe("2026-10-22");
  });
  it("이미 답한 날은 묻지 않는다", () => {
    const answered = journalOf(visit("2026-10-21", { hit: "yes" }), visit("2026-10-22"));
    expect(retroTarget(answered, "2026-10-22", 9)).toBeNull();
    expect(retroTarget(answered, "2026-10-22", 20)?.date).toBe("2026-10-22");
  });
});

describe("통계·배지", () => {
  it("평균 점수, 적중률, 자주 나온 카드", () => {
    const days = [
      visit("2026-10-01", { fortune: { score: 60, headline: "" }, hit: "yes", tarot: { cardId: "cups-2", reversed: false } }),
      visit("2026-10-02", { fortune: { score: 80, headline: "" }, hit: "half", tarot: { cardId: "cups-2", reversed: true } }),
      visit("2026-10-03", { fortune: { score: 71, headline: "" }, hit: "no" }),
    ];
    expect(statsOf(days)).toEqual({ visits: 3, averageScore: 70, hitRate: 50, answered: 3, topCard: { cardId: "cups-2", count: 2 } });
    expect(statsOf([])).toEqual({ visits: 0, averageScore: null, hitRate: null, answered: 0, topCard: null });
  });

  it("연속 배지와 메이저 22장 진행도", () => {
    const days = Array.from({ length: 7 }, (_, i) => visit(addDays("2026-10-16", i), { tarot: { cardId: `major-${i}`, reversed: false } }));
    const badges = badgesOf(journalOf(...days), "2026-10-22");
    const byId = Object.fromEntries(badges.map((b) => [b.id, b]));
    expect(byId["streak-7"].earned).toBe(true);
    expect(byId["streak-14"]).toMatchObject({ earned: false, progress: "7/14" });
    expect(byId["all-majors"]).toMatchObject({ earned: false, progress: "7/22" });
    expect(byId["first-retro"].earned).toBe(false);
  });

  it("점수 색 단계는 별점 기준과 같다", () => {
    expect([30, 45, 58, 70, 82, 98].map(scoreLevel)).toEqual([1, 2, 3, 4, 5, 5]);
  });
});

describe("백업", () => {
  const profile = JSON.stringify({ calendar: "solar", birthDate: "1990-03-15", gender: "male" });
  const history = [{ createdAt: "2026-10-22T00:00:00Z", title: "연애", summary: "결과", request: { topic: "love", spreadId: "one", seed: "seed-abcdefgh", picks: [3] } }];

  it("내보낸 파일을 다시 읽으면 같은 내용", () => {
    const backup = buildBackup({ profile, journal: JSON.stringify(journalOf(visit("2026-10-22"))), tarotHistory: JSON.stringify(history) }, NOW);
    const parsed = parseBackup(JSON.stringify(backup));
    expect(parsed).toEqual(backup);
    expect(parsed.profile?.birthDate).toBe("1990-03-15");
  });

  it("다른 파일은 거절한다", () => {
    expect(() => parseBackup("hello")).toThrow("JSON");
    expect(() => parseBackup(JSON.stringify({ journal: {} }))).toThrow("TIL");
  });

  it("잘못된 타로 기록은 걸러 낸다", () => {
    const parsed = parseBackup(JSON.stringify({ app: "til", tarotHistory: [...history, { title: "x" }], favorites: [{ id: 1 }] }));
    expect(parsed.tarotHistory).toHaveLength(1);
    expect(parsed.favorites).toEqual([]);
  });

  it("가져오기는 기록을 합치고, 기기의 프로필은 덮어쓰지 않는다", () => {
    const other = JSON.stringify({ calendar: "solar", birthDate: "2000-01-01", gender: "female" });
    const backup = parseBackup(JSON.stringify(buildBackup({ profile: other, journal: JSON.stringify(journalOf(visit("2026-10-01", { hit: "yes" }), visit("2026-10-22", { memo: "좋았다" }))) }, NOW)));
    const current = { profile, journal: JSON.stringify(journalOf(visit("2026-10-22", { hit: "half" }))) };
    const next = applyBackup(current, backup);
    expect(next.profile).toBe(profile);
    const journal = parseJournal(next.journal);
    expect(Object.keys(journal).sort()).toEqual(["2026-10-01", "2026-10-22"]);
    expect(journal["2026-10-22"]).toMatchObject({ hit: "half", memo: "좋았다" });

    expect(applyBackup({}, backup).profile).toBe(JSON.stringify(backup.profile));
  });

  it("같은 날은 기기 값을 지키고 빈 값만 백업으로 채운다", () => {
    const merged = mergeJournals(journalOf(visit("2026-10-22", { hit: "no" })), journalOf(visit("2026-10-22", { hit: "yes", memo: "백업" })));
    expect(merged["2026-10-22"]).toMatchObject({ hit: "no", memo: "백업" });
  });
});
