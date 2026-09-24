import { describe, expect, it } from "vitest";
import type { TodayReading } from "@/lib/today";
import { POST } from "./route";

const post = (body: unknown) =>
  POST(new Request("http://localhost/api/today", { method: "POST", body: JSON.stringify(body) }));

describe("POST /api/today", () => {
  it("오늘의 운세·행운 요소·타로를 반환한다", async () => {
    const res = await post({ calendar: "solar", birthDate: "1990-03-15", birthTime: "10:30", gender: "male" });
    expect(res.status).toBe(200);
    const data = (await res.json()) as TodayReading;
    expect(data.me.dayMaster).toBe("기토(己土)");
    expect(data.me.pillars).toEqual(["庚午", "己卯", "己卯", "己巳"]);
    expect(data.fortune.categories).toHaveLength(4);
    expect(data.lucky.color).toBeTruthy();
    expect(data.tarot.card.name).toBeTruthy();
  });

  it("출생시를 모르면 시주를 ??로 표시하고 한계를 알린다", async () => {
    const res = await post({ calendar: "solar", birthDate: "1990-03-15", gender: "female" });
    const data = (await res.json()) as TodayReading;
    expect(data.me.pillars[3]).toBe("??");
    expect(data.me.timeKnown).toBe(false);
    expect(data.limitations.length).toBeGreaterThan(0);
  });

  it("잘못된 입력은 400", async () => {
    expect((await post({ calendar: "solar", birthDate: "1990-02-30", gender: "male" })).status).toBe(400);
    expect((await post({ calendar: "solar", birthDate: "1990-03-15", birthTime: "25:00", gender: "male" })).status).toBe(400);
    const bad = await post(null);
    expect(bad.status).toBe(400);
    expect((await bad.json()).error).toBe("요청 형식이 올바르지 않습니다.");
  });

  it("존재하지 않는 음력 윤달은 400과 이유를 반환한다", async () => {
    const res = await post({ calendar: "lunar", isLeapMonth: true, birthDate: "2024-02-10", gender: "male" });
    expect(res.status).toBe(400);
    expect((await res.json()).error).toContain("음력");
  });
});
