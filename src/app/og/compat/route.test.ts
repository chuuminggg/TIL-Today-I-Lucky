import { describe, expect, it } from "vitest";
import { GET } from "./route";

describe("GET /og/compat", () => {
  it("형식이 틀린 공유 주소는 400", async () => {
    expect((await GET(new Request("http://localhost/og/compat"))).status).toBe(400);
    expect((await GET(new Request("http://localhost/og/compat?a=a&b=b&s=200&r=lover"))).status).toBe(400);
  });
});
