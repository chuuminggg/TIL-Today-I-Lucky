import { afterEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

const post = (body: unknown) => POST(new Request("http://localhost/api/push/subscribe", { method: "POST", body: JSON.stringify(body) }));
const valid = { endpoint: "https://fcm.googleapis.com/fcm/send/abc", keys: { p256dh: "p", auth: "a" } };

describe("POST /api/push/subscribe", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("저장소 설정이 없으면 503", async () => {
    vi.stubEnv("KV_REST_API_URL", "");
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "");
    expect((await post(valid)).status).toBe(503);
  });

  it("알 수 없는 주소는 400, 올바른 구독은 저장", async () => {
    vi.stubEnv("KV_REST_API_URL", "https://redis");
    vi.stubEnv("KV_REST_API_TOKEN", "t");
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ result: 1 })));
    vi.stubGlobal("fetch", fetchMock);
    expect((await post({ ...valid, endpoint: "https://example.com/x" })).status).toBe(400);
    expect((await post(valid)).status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
