import { describe, expect, it } from "vitest";
import type { CompatDetail } from "@/lib/saju/compat";
import { POST } from "./route";

const post = (body: unknown) => POST(new Request("http://localhost/api/compat", { method: "POST", body: JSON.stringify(body) }));
const me = { calendar: "solar", birthDate: "1990-03-15", birthTime: "10:30", gender: "female" };
const partner = { calendar: "solar", birthDate: "1992-10-24", gender: "male", name: "준호" };

describe("POST /api/compat", () => {
  it("궁합을 반환한다", async () => {
    const res = await post({ me, partner, relation: "crush" });
    expect(res.status).toBe(200);
    const data = (await res.json()) as CompatDetail;
    expect(data.relation).toBe("crush");
    expect(data.people[1].nickname).toBe("준호");
  });

  it("누구의 입력이 잘못됐는지 알려준다", async () => {
    const bad = await post({ me, partner: { ...partner, birthDate: "1992-13-01" }, relation: "lover" });
    expect(bad.status).toBe(400);
    expect((await bad.json()).error).toMatch(/^상대 정보: /);
    expect((await post({ me, partner, relation: "enemy" })).status).toBe(400);
    expect((await post(null)).status).toBe(400);
  });
});
