import webpush from "web-push";
import type { PushMessage } from "./message";
import type { PushStore } from "./store";

// VAPID 키는 환경 변수로만 둔다 — 공개 키는 브라우저 구독에도 써서 NEXT_PUBLIC_ 이름으로.
export function vapidConfig(env: Record<string, string | undefined> = process.env) {
  const publicKey = env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = env.VAPID_PRIVATE_KEY;
  const subject = env.VAPID_SUBJECT ?? "https://til-today-i-lucky.vercel.app";
  return publicKey && privateKey ? { publicKey, privateKey, subject } : null;
}

export interface SendSummary {
  total: number;
  sent: number;
  removed: number; // 만료·해지돼 지운 구독
  failed: number;
}

/** 모든 구독에 보낸다. 410/404(구독 해지)는 저장소에서 지운다 */
export async function sendToAll(store: PushStore, message: PushMessage, vapid = vapidConfig()): Promise<SendSummary> {
  if (!vapid) throw new Error("VAPID 키가 설정되지 않았어요.");
  const subscriptions = await store.all();
  const summary: SendSummary = { total: subscriptions.length, sent: 0, removed: 0, failed: 0 };
  const payload = JSON.stringify(message);
  const options = { vapidDetails: vapid, TTL: 6 * 60 * 60, urgency: "normal" as const, topic: "til-daily" };

  // 한꺼번에 너무 많이 열지 않도록 20개씩
  for (let i = 0; i < subscriptions.length; i += 20) {
    await Promise.all(
      subscriptions.slice(i, i + 20).map(async (subscription) => {
        try {
          await webpush.sendNotification(subscription, payload, options);
          summary.sent++;
        } catch (error) {
          const status = (error as { statusCode?: number }).statusCode;
          if (status === 404 || status === 410) {
            await store.remove(subscription.endpoint);
            summary.removed++;
          } else {
            summary.failed++;
          }
        }
      }),
    );
  }
  return summary;
}
