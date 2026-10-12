import { describe, expect, it } from "vitest";
import type { SajuDetail } from "@/lib/saju/detail";
import { POST } from "./route";

const post = (body: unknown) => POST(new Request("http://localhost/api/saju", { method: "POST", body: JSON.stringify(body) }));

describe("POST /api/saju", () => {
  it("사주 상세를 반환한다", async () => {
    const res = await post({ calendar: "solar", birthDate: "1990-03-15", birthTime: "10:30", gender: "male" });
    expect(res.status).toBe(200);
    const data = (await res.json()) as SajuDetail;
    expect(data.dayMaster.ko).toBe("기");
    expect(data.luck.periods).toHaveLength(9);
  });

  it("잘못된 입력은 400", async () => {
    expect((await post(null)).status).toBe(400);
    expect((await post({ calendar: "solar", birthDate: "1990-02-30", gender: "male" })).status).toBe(400);
    expect((await post({ calendar: "lunar", isLeapMonth: true, birthDate: "2024-02-10", gender: "male" })).status).toBe(400);
  });
});
