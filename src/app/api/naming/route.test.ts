import { describe, expect, it } from "vitest";
import type { NamingReport } from "@/lib/naming/report";
import { POST } from "./route";

const post = (body: unknown) => POST(new Request("http://localhost/api/naming", { method: "POST", body: JSON.stringify(body) }));
const profile = { calendar: "solar", birthDate: "2024-05-18", birthTime: "09:20", gender: "female" };

describe("POST /api/naming", () => {
  it("후보 이름을 채점한다", async () => {
    const res = await post({ profile, surname: "김", surnameHanja: "金", candidates: [{ givenName: "서아", hanjaName: "瑞雅" }, { givenName: "지유", hanjaName: "" }] });
    expect(res.status).toBe(200);
    const data = (await res.json()) as NamingReport;
    expect(data.names).toHaveLength(2);
  });

  it("잘못된 입력은 400과 한국어 안내", async () => {
    const bad = async (body: unknown) => {
      const res = await post(body);
      expect(res.status).toBe(400);
      return ((await res.json()) as { error: string }).error;
    };
    expect(await bad({ profile, surname: "Kim", candidates: [{ givenName: "서아" }] })).toContain("성씨");
    expect(await bad({ profile, surname: "김", candidates: [] })).toContain("하나 이상");
    expect(await bad({ profile, surname: "김", candidates: [{ givenName: "서아", hanjaName: "abc" }] })).toContain("한자");
    expect(await bad({ profile, surname: "김", candidates: Array(6).fill({ givenName: "서아" }) })).toContain("5개");
  });
});
