import { z } from "zod";
import { pushStore } from "@/lib/push/store";

const bodySchema = z.object({ endpoint: z.string().max(1000) });

export async function POST(request: Request) {
  const store = pushStore();
  if (!store) return Response.json({ ok: true });

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "요청 형식이 올바르지 않아요." }, { status: 400 });

  try {
    await store.remove(parsed.data.endpoint);
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "알림을 끄지 못했어요. 잠시 후 다시 시도해 주세요." }, { status: 502 });
  }
}
