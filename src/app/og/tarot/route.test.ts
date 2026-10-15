import { describe, expect, it } from "vitest";
import { GET } from "./route";

describe("GET /og/tarot", () => {
  it("해석할 수 없는 공유 주소는 400", async () => {
    expect((await GET(new Request("http://localhost/og/tarot"))).status).toBe(400);
    expect((await GET(new Request("http://localhost/og/tarot?t=love&s=three-time&seed=seed-abcdef&p=5,30"))).status).toBe(400);
  });
});
