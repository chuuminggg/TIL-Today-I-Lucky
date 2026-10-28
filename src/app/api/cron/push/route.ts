import { todayKST } from "@/lib/calendar/kst";
import { dailyMessage } from "@/lib/push/message";
import { sendToAll, vapidConfig } from "@/lib/push/send";
import { pushStore } from "@/lib/push/store";

// Vercel Cron이 매일 08:00 KST(23:00 UTC)에 부른다 — vercel.json.
// Vercel은 CRON_SECRET을 Authorization: Bearer 로 붙여 보내므로 그 값이 맞을 때만 보낸다.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const store = pushStore();
  const vapid = vapidConfig();
  if (!store || !vapid) return Response.json({ error: "알림 설정(저장소·VAPID 키)이 없어요." }, { status: 503 });

  const date = todayKST();
  const summary = await sendToAll(store, dailyMessage(date), vapid);
  return Response.json({ date, ...summary });
}
