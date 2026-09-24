import { interpretReading } from "@/lib/tarot/interpret";
import { readingRequestSchema } from "@/lib/tarot/schema";

export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null);
  if (typeof body !== "object" || body === null) {
    return Response.json({ error: "요청 형식이 올바르지 않습니다." }, { status: 400 });
  }

  const parsed = readingRequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0]?.message ?? "입력값이 올바르지 않습니다." }, { status: 400 });
  }

  try {
    return Response.json(interpretReading(parsed.data));
  } catch (error) {
    // 스프레드와 카드 장수 불일치 등 요청 내용 오류
    const message = error instanceof Error ? error.message : "타로를 해석하지 못했습니다.";
    return Response.json({ error: message }, { status: 400 });
  }
}
