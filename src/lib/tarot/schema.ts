import { z } from "zod";
import { TAROT_DECK } from "./cards";
import { TOPIC_IDS, type Topic } from "./spreads";

z.config(z.locales.ko());

export const readingRequestSchema = z.object({
  topic: z.enum(TOPIC_IDS as [Topic, ...Topic[]], "주제를 선택해 주세요."),
  question: z.string().trim().max(200, "질문은 200자 이내로 입력해 주세요.").optional(),
  spreadId: z.string().min(1),
  seed: z.string().min(8).max(64),
  picks: z
    .array(z.number().int().min(0).max(TAROT_DECK.length - 1))
    .min(1)
    .max(10),
  allowReversed: z.boolean().optional(),
});
