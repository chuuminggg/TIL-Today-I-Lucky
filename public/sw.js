// TIL 서비스 워커 — 아침 알림 받기·누르면 앱 열기만 한다 (오프라인 캐시 없음)

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { body: event.data ? event.data.text() : "" };
  }
  const title = data.title || "Today I Lucky 🍀";
  event.waitUntil(
    self.registration.showNotification(title, {
      body: data.body || "오늘의 운세와 카드를 확인해 보세요.",
      icon: "/icons/192",
      badge: "/icons/192",
      tag: data.tag || "til-daily",
      data: { url: data.url || "/" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = new URL(event.notification.data?.url || "/", self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((windows) => {
      // 이미 열린 앱 창이 있으면 그 창으로, 없으면 새로 연다
      const existing = windows.find((w) => new URL(w.url).origin === self.location.origin);
      if (existing) return existing.focus().then((w) => w && w.navigate(url));
      return self.clients.openWindow(url);
    }),
  );
});
