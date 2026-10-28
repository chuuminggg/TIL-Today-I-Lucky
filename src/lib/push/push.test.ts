import { afterEach, describe, expect, it, vi } from "vitest";
import { dailyMessage } from "./message";
import { sendToAll } from "./send";
import { fieldOf, pushStore, redisConfig, type PushStore } from "./store";
import { isPushEndpoint, subscriptionSchema, type StoredSubscription } from "./subscription";

vi.mock("web-push", () => ({
  default: {
    sendNotification: vi.fn(async (sub: StoredSubscription) => {
      if (sub.endpoint.endsWith("gone")) throw Object.assign(new Error("gone"), { statusCode: 410 });
      if (sub.endpoint.endsWith("busy")) throw Object.assign(new Error("busy"), { statusCode: 500 });
      return { statusCode: 201 };
    }),
  },
}));

const sub = (endpoint: string): StoredSubscription => ({ endpoint, keys: { p256dh: "p", auth: "a" } });
const VAPID = { publicKey: "pub", privateKey: "priv", subject: "mailto:a@b.c" };

describe("구독 검증", () => {
  it("알려진 푸시 서비스 주소만 받는다", () => {
    expect(isPushEndpoint("https://fcm.googleapis.com/fcm/send/abc")).toBe(true);
    expect(isPushEndpoint("https://web.push.apple.com/QH1")).toBe(true);
    expect(isPushEndpoint("https://wns2-par02p.notify.windows.com/w/?token=x")).toBe(true);
    expect(isPushEndpoint("http://fcm.googleapis.com/x")).toBe(false);
    expect(isPushEndpoint("https://evil.example.com/fcm.googleapis.com")).toBe(false);
    expect(isPushEndpoint("not a url")).toBe(false);
  });

  it("키가 없으면 거절", () => {
    expect(subscriptionSchema.safeParse({ endpoint: "https://fcm.googleapis.com/x", keys: { p256dh: "p", auth: "a" } }).success).toBe(true);
    expect(subscriptionSchema.safeParse({ endpoint: "https://fcm.googleapis.com/x" }).success).toBe(false);
  });
});

describe("저장소", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("환경 변수가 없으면 null — 기능을 숨긴다", () => {
    expect(redisConfig({})).toBeNull();
    expect(pushStore(null)).toBeNull();
    expect(redisConfig({ KV_REST_API_URL: "u", KV_REST_API_TOKEN: "t" })).toEqual({ url: "u", token: "t" });
    expect(redisConfig({ UPSTASH_REDIS_REST_URL: "u2", UPSTASH_REDIS_REST_TOKEN: "t2" })).toEqual({ url: "u2", token: "t2" });
  });

  it("Redis REST 명령으로 저장·삭제·조회", async () => {
    const calls: unknown[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (_url: string, init: RequestInit) => {
        const args = JSON.parse(String(init.body)) as string[];
        calls.push(args);
        const result = args[0] === "HGETALL" ? ["f1", JSON.stringify(sub("https://fcm.googleapis.com/1")), "f2", "{broken"] : 1;
        return new Response(JSON.stringify({ result }));
      }),
    );
    const store = pushStore({ url: "https://redis", token: "t" })!;
    await store.save(sub("https://fcm.googleapis.com/1"));
    await store.remove("https://fcm.googleapis.com/1");
    expect(await store.all()).toEqual([sub("https://fcm.googleapis.com/1")]);
    const field = fieldOf("https://fcm.googleapis.com/1");
    expect(calls[0]).toEqual(["HSET", "til:push:subscriptions", field, JSON.stringify(sub("https://fcm.googleapis.com/1"))]);
    expect(calls[1]).toEqual(["HDEL", "til:push:subscriptions", field]);
  });

  it("저장소 오류는 예외", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ error: "WRONGPASS" }), { status: 401 })));
    await expect(pushStore({ url: "https://redis", token: "x" })!.all()).rejects.toThrow("WRONGPASS");
  });
});

describe("알림 문구", () => {
  it("그날 일진이 들어가고 빈칸이 없다", () => {
    const m = dailyMessage("2026-10-01");
    expect(m.body).toContain("무신(戊申)");
    expect(`${m.title}${m.body}`).not.toMatch(/\{|\}/);
    expect(m.tag).toBe("til-daily-2026-10-01");
  });

  it("날마다 문구가 바뀐다", () => {
    const bodies = new Set(Array.from({ length: 10 }, (_, i) => dailyMessage(`2026-11-${String(i + 1).padStart(2, "0")}`).body));
    expect(bodies.size).toBe(10);
  });
});

describe("발송", () => {
  it("해지된 구독(410)은 지우고 나머지는 센다", async () => {
    const removed: string[] = [];
    const store: PushStore = {
      save: async () => undefined,
      remove: async (endpoint) => void removed.push(endpoint),
      all: async () => [sub("https://fcm.googleapis.com/ok"), sub("https://fcm.googleapis.com/gone"), sub("https://fcm.googleapis.com/busy")],
    };
    const summary = await sendToAll(store, dailyMessage("2026-10-01"), VAPID);
    expect(summary).toEqual({ total: 3, sent: 1, removed: 1, failed: 1 });
    expect(removed).toEqual(["https://fcm.googleapis.com/gone"]);
  });

  it("VAPID 키가 없으면 보내지 않는다", async () => {
    const store: PushStore = { save: async () => undefined, remove: async () => undefined, all: async () => [] };
    await expect(sendToAll(store, dailyMessage("2026-10-01"), null)).rejects.toThrow("VAPID");
  });
});
