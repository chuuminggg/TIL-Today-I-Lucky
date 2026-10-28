import { createHash } from "node:crypto";
import type { StoredSubscription } from "./subscription";

// 알림 구독 저장소 — Upstash Redis REST (Vercel Marketplace 연동 시 KV_REST_API_* 가 자동으로 들어온다).
// 구독 주소와 암호화 키만 저장하고 생년월일 등 개인 정보는 저장하지 않는다.

const KEY = "til:push:subscriptions";

interface RedisConfig {
  url: string;
  token: string;
}

export function redisConfig(env: Record<string, string | undefined> = process.env): RedisConfig | null {
  const url = env.KV_REST_API_URL ?? env.UPSTASH_REDIS_REST_URL;
  const token = env.KV_REST_API_TOKEN ?? env.UPSTASH_REDIS_REST_TOKEN;
  return url && token ? { url, token } : null;
}

async function command<T>(config: RedisConfig, args: string[]): Promise<T> {
  const res = await fetch(config.url, {
    method: "POST",
    headers: { Authorization: `Bearer ${config.token}`, "Content-Type": "application/json" },
    body: JSON.stringify(args),
    cache: "no-store",
  });
  const data = (await res.json().catch(() => ({}))) as { result?: T; error?: string };
  if (!res.ok || data.error) throw new Error(`알림 저장소 오류: ${data.error ?? res.status}`);
  return data.result as T;
}

/** 구독 주소 → 고정 길이 필드 이름 */
export const fieldOf = (endpoint: string) => createHash("sha256").update(endpoint).digest("base64url");

export interface PushStore {
  save(subscription: StoredSubscription): Promise<void>;
  remove(endpoint: string): Promise<void>;
  all(): Promise<StoredSubscription[]>;
}

export function pushStore(config = redisConfig()): PushStore | null {
  if (!config) return null;
  return {
    async save(subscription) {
      await command(config, ["HSET", KEY, fieldOf(subscription.endpoint), JSON.stringify(subscription)]);
    },
    async remove(endpoint) {
      await command(config, ["HDEL", KEY, fieldOf(endpoint)]);
    },
    async all() {
      const flat = await command<string[]>(config, ["HGETALL", KEY]);
      const subscriptions: StoredSubscription[] = [];
      for (let i = 1; i < flat.length; i += 2) {
        try {
          subscriptions.push(JSON.parse(flat[i]) as StoredSubscription);
        } catch {
          // 깨진 항목은 건너뛴다
        }
      }
      return subscriptions;
    },
  };
}
