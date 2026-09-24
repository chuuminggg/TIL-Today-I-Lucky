import { describe, expect, it } from "vitest";
import type { Reading } from "@/lib/tarot/interpret";
import { POST } from "./route";

const post = (body: unknown) =>
  POST(new Request("http://localhost/api/tarot/reading", { method: "POST", body: JSON.stringify(body) }));

const valid = { topic: "love", question: " 그 사람 마음은? ", spreadId: "three-time", seed: "seed-abcdef", picks: [5, 30, 70] };

describe("POST /api/tarot/reading", () => {
  it("스프레드 해석을 반환한다", async () => {
    const res = await post(valid);
    expect(res.status).toBe(200);
    const data = (await res.json()) as Reading;
    expect(data.cards).toHaveLength(3);
    expect(data.cards.map((c) => c.position.label)).toEqual(["과거", "현재", "미래"]);
    expect(data.question).toBe("그 사람 마음은?");
    expect(data.summary.text).toBeTruthy();
  });

  it("잘못된 입력은 400과 이유", async () => {
    expect((await post(null)).status).toBe(400);
    expect((await post({ ...valid, topic: "health" })).status).toBe(400);
    expect((await post({ ...valid, picks: [5, 30, 78] })).status).toBe(400);
    const wrongCount = await post({ ...valid, picks: [5, 30] });
    expect(wrongCount.status).toBe(400);
    expect((await wrongCount.json()).error).toContain("3장");
  });
});
