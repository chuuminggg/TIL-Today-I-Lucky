import { z } from "zod";
import { birthProfileSchema } from "@/lib/profile/schema";
import { getNamingReport } from "@/lib/naming/report";

const hangul = (label: string, max: number) =>
  z.string().trim().regex(new RegExp(`^[가-힣]{1,${max}}$`), `${label}은 한글 1–${max}자로 입력해 주세요.`);
const hanjaText = z
  .string()
  .trim()
  .regex(/^[一-鿿]{0,3}$/u, "한자 칸에는 한자만 입력해 주세요.")
  .optional();

const namingSchema = z.object({
  profile: birthProfileSchema,
  surname: hangul("성씨", 2),
  surnameHanja: hanjaText,
  candidates: z
    .array(z.object({ givenName: hangul("이름", 3), hanjaName: hanjaText }))
    .min(1, "후보 이름을 하나 이상 입력해 주세요.")
    .max(5, "후보 이름은 5개까지 비교할 수 있어요."),
  avoidSyllables: z.array(z.string().trim().regex(/^[가-힣]$/)).max(10).optional(),
});

export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null);
  if (typeof body !== "object" || body === null) {
    return Response.json({ error: "요청 형식이 올바르지 않습니다." }, { status: 400 });
  }

  const parsed = namingSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0]?.message ?? "입력값이 올바르지 않습니다." }, { status: 400 });
  }

  try {
    return Response.json(await getNamingReport(parsed.data));
  } catch (error) {
    const message = error instanceof Error ? error.message : "이름을 감정하지 못했습니다.";
    return Response.json({ error: message }, { status: 400 });
  }
}
