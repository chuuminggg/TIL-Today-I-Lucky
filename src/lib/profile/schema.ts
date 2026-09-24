import { z } from "zod";

z.config(z.locales.ko());

const isRealDate = (value: string) => {
  const [y, m, d] = value.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
};

export const birthProfileSchema = z
  .object({
    name: z.string().trim().max(20).optional(),
    calendar: z.enum(["solar", "lunar"]),
    isLeapMonth: z.boolean().optional(),
    birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "생년월일을 YYYY-MM-DD로 입력해 주세요."),
    birthTime: z
      .string()
      .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "태어난 시간을 HH:mm으로 입력해 주세요.")
      .optional(),
    gender: z.enum(["male", "female"]),
  })
  .refine((p) => p.birthDate >= "1900-01-01" && p.birthDate <= "2050-12-31", {
    message: "1900–2050년 사이의 날짜만 지원합니다.",
    path: ["birthDate"],
  })
  // 음력은 30일이 있는 달이 있어 양력 기준 검사를 하지 않고, 변환 단계에서 존재 여부를 확인한다
  .refine((p) => p.calendar === "lunar" || isRealDate(p.birthDate), {
    message: "존재하지 않는 날짜입니다.",
    path: ["birthDate"],
  });

export type BirthProfileInput = z.infer<typeof birthProfileSchema>;

/** 같은 사람 + 같은 날이면 같은 운세·카드가 나오도록 하는 시드 */
export const profileSeed = (p: BirthProfileInput, date: string) =>
  [p.calendar, p.isLeapMonth ? "leap" : "", p.birthDate, p.birthTime ?? "unknown", p.gender, date].join("|");
