import { calculateFourPillars } from "manseryeok";
import { describe, expect, it } from "vitest";
import { getSajuDetail } from "./detail";

const profile = { birthDate: "1990-03-15", birthTime: "10:30", gender: "male" as const, calendar: "solar" as const };
const TODAY = "2026-09-30";
const pad = (n: number) => String(n).padStart(2, "0");

describe("getSajuDetail — 1990-03-15 10:30 남 (庚午 己卯 己卯 己巳)", () => {
  const d = getSajuDetail(profile, TODAY);

  it("일간과 캐릭터", () => {
    expect(d.dayMaster).toMatchObject({ ko: "기", hanja: "己", element: "earth", image: "너른 들판" });
  });

  it("명식 표: 시·일·월·연 순서, 십신·지장간", () => {
    expect(d.chart.map((c) => c?.label)).toEqual(["시주", "일주", "월주", "연주"]);
    const [hour, day, month, year] = d.chart;
    expect(day?.stem.tenGod).toBe("일간");
    expect(year?.stem).toMatchObject({ ko: "경", tenGod: "상관" });
    expect(year?.branch).toMatchObject({ ko: "오", tenGod: "편인", animal: "말" });
    expect(year?.hidden.map((h) => h.ko)).toEqual(["병", "기", "정"]);
    expect(month?.branch.tenGod).toBe("편관");
    expect(hour?.branch).toMatchObject({ ko: "사", tenGod: "정인" });
  });

  it("십신 묶음: 동점이면 함께 알려주고, 없는 묶음을 짚는다", () => {
    expect(d.groups.find((g) => g.group === "재성")?.count).toBe(0);
    expect(d.groupSummary).toContain("비겁·관성·인성 기운이 2개씩으로 가장 많아요");
    expect(d.groupSummary).toContain("재성이 없어요");
  });

  it("대운: 양남 순행, 월주 다음 간지부터, 지금 대운 표시", () => {
    const ref = calculateFourPillars({ year: 1990, month: 3, day: 15, hour: 10, minute: 30, gender: "male" }).luckPillars!;
    expect(d.luck.forward).toBe(true);
    expect(d.luck.startAge).toBe(ref.startAge);
    expect(d.luck.periods[0].label).toBe("경진");
    expect(d.luck.periods.filter((p) => p.current)).toHaveLength(1);
    expect(d.luck.periods.find((p) => p.current)?.label).toBe("임오"); // 36세 → 27세 대운
    expect(d.luck.approximate).toBe(false);
  });

  it("세운: 올해·내년 연주와 일지 관계", () => {
    expect(d.years.map((y) => y.label)).toEqual(["병오", "정미"]);
    expect(d.years[0].tenGod).toBe("정인");
    expect(d.years[1].text).toContain("일지와 어울려"); // 미 + 일지 묘 = 해묘미 삼합
  });

  it("주제별 풀이 5개", () => {
    expect(d.topics.map((t) => t.type)).toEqual(["general", "love", "wealth", "career", "health"]);
    for (const t of d.topics) expect(t.summary).toBeTruthy();
  });
});

describe("getSajuDetail — 예외 상황", () => {
  it("출생시를 모르면 시주 없이, 대운은 잠정", () => {
    const d = getSajuDetail({ ...profile, birthTime: undefined }, TODAY);
    expect(d.chart[0]).toBeNull();
    expect(d.luck.approximate).toBe(true);
    expect(d.limitations.length).toBeGreaterThan(0);
  });

  it("음간 연주면 여성은 순행(음녀), 남성은 역행(음남)", () => {
    // 1987-12-24 → 丁卯년(음간)
    const female = getSajuDetail({ birthDate: "1987-12-24", birthTime: "08:00", gender: "female", calendar: "solar" }, TODAY);
    const male = getSajuDetail({ birthDate: "1987-12-24", birthTime: "08:00", gender: "male", calendar: "solar" }, TODAY);
    expect(female.luck.forward).toBe(true);
    expect(male.luck.forward).toBe(false);
  });

  it("무작위 200명 — 빈 문장·조사 미처리 없이 계산된다", () => {
    for (let i = 0; i < 200; i++) {
      const birthDate = `${1930 + ((i * 7) % 90)}-${pad(1 + ((i * 5) % 12))}-${pad(1 + ((i * 11) % 28))}`;
      const birthTime = i % 3 ? `${pad(i % 24)}:15` : undefined;
      const d = getSajuDetail({ birthDate, birthTime, gender: i % 2 ? "male" : "female", calendar: "solar" }, TODAY);
      expect(JSON.stringify(d)).not.toMatch(/undefined|\(이\)|\(가\)|이\/가|을\/를/);
      expect(d.luck.periods).toHaveLength(9);
    }
  });
});
