import { afterEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";

const call = (auth?: string) => GET(new Request("http://localhost/api/cron/push", { headers: auth ? { authorization: auth } : {} }));

describe("GET /api/cron/push", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("CRON_SECRET이 맞지 않으면 401", async () => {
    vi.stubEnv("CRON_SECRET", "s3cret");
    expect((await call()).status).toBe(401);
    expect((await call("Bearer nope")).status).toBe(401);
  });

  it("비밀값이 아예 없으면 누구도 부를 수 없다", async () => {
    vi.stubEnv("CRON_SECRET", "");
    expect((await call("Bearer ")).status).toBe(401);
  });

  it("인증은 됐지만 저장소·키가 없으면 503", async () => {
    vi.stubEnv("CRON_SECRET", "s3cret");
    vi.stubEnv("KV_REST_API_URL", "");
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "");
    expect((await call("Bearer s3cret")).status).toBe(503);
  });
});
