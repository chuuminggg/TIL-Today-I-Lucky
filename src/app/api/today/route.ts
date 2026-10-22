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

  // 달력에서 지난 날을 다시 볼 때만 date를 보낸다. 미래 날짜는 잠금 — 내일 운세는 내일 와서
  const today = todayKST();
  const date = (body as { date?: unknown }).date ?? today;
  if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date) || date > today || date < "2000-01-01") {
    return Response.json({ error: "볼 수 없는 날짜예요." }, { status: 400 });
  }

  try {
    return Response.json(getTodayReading(parsed.data, date));
  } catch (error) {
    // 존재하지 않는 음력 날짜 등 계산 단계의 입력 오류
    const message = error instanceof Error ? error.message : "운세를 계산하지 못했습니다.";
    return Response.json({ error: message }, { status: 400 });
  }
}
