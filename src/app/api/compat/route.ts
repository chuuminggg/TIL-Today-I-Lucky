import { z } from "zod";
import { birthProfileSchema } from "@/lib/profile/schema";
import { getCompatDetail } from "@/lib/saju/compat";
import { RELATION_TYPES, type RelationType } from "@/lib/saju/detail-text";

const compatSchema = z.object({
  me: birthProfileSchema,
  partner: birthProfileSchema,
  relation: z.enum(Object.keys(RELATION_TYPES) as [RelationType, ...RelationType[]], "관계를 선택해 주세요."),
});

export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null);
  if (typeof body !== "object" || body === null) {
    return Response.json({ error: "요청 형식이 올바르지 않습니다." }, { status: 400 });
  }

  const parsed = compatSchema.safeParse(body);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const who = issue?.path[0] === "partner" ? "상대 정보: " : issue?.path[0] === "me" ? "내 정보: " : "";
    return Response.json({ error: `${who}${issue?.message ?? "입력값이 올바르지 않습니다."}` }, { status: 400 });
  }

  try {
    const { me, partner, relation } = parsed.data;
    return Response.json(getCompatDetail(me, partner, relation));
  } catch (error) {
    const message = error instanceof Error ? error.message : "궁합을 계산하지 못했습니다.";
    return Response.json({ error: message }, { status: 400 });
  }
}
