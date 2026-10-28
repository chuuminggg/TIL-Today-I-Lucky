import { z } from "zod";

// 브라우저 PushSubscription.toJSON() 모양. 아무 주소나 저장되지 않게 알려진 푸시 서비스만 받는다.
const PUSH_HOSTS = [
  /^fcm\.googleapis\.com$/, // Chrome·Android·Edge 일부
  /^updates\.push\.services\.mozilla\.com$/, // Firefox
  /^web\.push\.apple\.com$/, // Safari·iOS 홈 화면 앱
  /\.notify\.windows\.com$/, // Edge(Windows)
];

export const isPushEndpoint = (endpoint: string) => {
  try {
    const url = new URL(endpoint);
    return url.protocol === "https:" && PUSH_HOSTS.some((host) => host.test(url.hostname));
  } catch {
    return false;
  }
};

export const subscriptionSchema = z.object({
  endpoint: z.string().max(1000).refine(isPushEndpoint, "지원하지 않는 알림 주소예요."),
  expirationTime: z.number().nullable().optional(),
  keys: z.object({ p256dh: z.string().min(1).max(200), auth: z.string().min(1).max(100) }),
});

export type StoredSubscription = z.infer<typeof subscriptionSchema>;
