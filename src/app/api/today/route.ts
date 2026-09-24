import { todayKST } from "@/lib/calendar/lunar";
import { birthProfileSchema } from "@/lib/profile/schema";
import { getTodayReading } from "@/lib/today";

export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null);
  if (typeof body !== "object" || body === null) {
    return Response.json({ error: "요청 형식이 올바르지 않습니다." }, { status: 400 });
  }

  const parsed = birthProfileSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0]?.message ?? "입력값이 올바르지 않습니다." }, { status: 400 });
  }

  try {
    return Response.json(getTodayReading(parsed.data, todayKST()));
  } catch (error) {
    // 존재하지 않는 음력 날짜 등 계산 단계의 입력 오류
    const message = error instanceof Error ? error.message : "운세를 계산하지 못했습니다.";
    return Response.json({ error: message }, { status: 400 });
  }
}
