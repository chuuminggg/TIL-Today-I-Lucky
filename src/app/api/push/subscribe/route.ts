import { pushStore } from "@/lib/push/store";
import { subscriptionSchema } from "@/lib/push/subscription";

/** 아침 알림 구독 저장 — 구독 주소와 암호화 키만 받는다 */
export async function POST(request: Request) {
  const store = pushStore();
  if (!store) return Response.json({ error: "알림 기능이 아직 준비되지 않았어요." }, { status: 503 });

  const body: unknown = await request.json().catch(() => null);
  const parsed = subscriptionSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0]?.message ?? "알림 구독 정보가 올바르지 않아요." }, { status: 400 });
  }

  try {
    await store.save(parsed.data);
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "알림을 켜지 못했어요. 잠시 후 다시 시도해 주세요." }, { status: 502 });
  }
}
