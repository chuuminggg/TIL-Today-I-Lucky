"use client";

// 브라우저 쪽 알림 구독 — 서비스 워커 등록, 권한 요청, 구독 정보를 서버에 저장

export type PushState =
  | "unavailable" // 서버에 알림 설정이 없음 → 화면에서 숨김
  | "needs-install" // iPhone·iPad Safari: 홈 화면에 추가한 앱에서만 받을 수 있음
  | "unsupported" // 이 브라우저는 웹 푸시를 지원하지 않음
  | "denied" // 알림 권한을 거절함 (브라우저 설정에서 풀어야 함)
  | "off"
  | "on";

const PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
const isStandalone = () => window.matchMedia("(display-mode: standalone)").matches || (navigator as { standalone?: boolean }).standalone === true;

/** base64url 공개 키 → applicationServerKey */
export function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padded = (base64 + "=".repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(padded);
  const bytes = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  return bytes;
}

async function registration() {
  return navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" });
}

export async function currentPushState(): Promise<PushState> {
  if (!PUBLIC_KEY) return "unavailable";
  const supported = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
  if (!supported) return isIOS() && !isStandalone() ? "needs-install" : "unsupported";
  if (Notification.permission === "denied") return "denied";
  const subscription = await (await registration()).pushManager.getSubscription();
  return subscription ? "on" : "off";
}

async function post(url: string, body: unknown) {
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? "알림 설정을 바꾸지 못했어요.");
  }
}

/** 권한을 묻고 구독한다 — 반드시 버튼 클릭 안에서 불러야 iOS가 권한 창을 띄운다 */
export async function enablePush(): Promise<PushState> {
  if (!PUBLIC_KEY) return "unavailable";
  const permission = await Notification.requestPermission();
  if (permission !== "granted") return permission === "denied" ? "denied" : "off";
  const reg = await registration();
  const subscription =
    (await reg.pushManager.getSubscription()) ??
    (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(PUBLIC_KEY) }));
  try {
    await post("/api/push/subscribe", subscription.toJSON());
  } catch (error) {
    await subscription.unsubscribe(); // 서버에 못 남겼으면 기기 구독도 되돌려 상태를 맞춘다
    throw error;
  }
  return "on";
}

export async function disablePush(): Promise<PushState> {
  const subscription = await (await registration()).pushManager.getSubscription();
  if (subscription) {
    await post("/api/push/unsubscribe", { endpoint: subscription.endpoint }).catch(() => undefined);
    await subscription.unsubscribe();
  }
  return "off";
}
