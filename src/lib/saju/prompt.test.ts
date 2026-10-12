import { describe, expect, it } from "vitest";
import { aiChatUrl } from "@/lib/ai-handoff";
import { getCompatDetail } from "./compat";
import { getSajuDetail } from "./detail";
import { buildCompatPrompt, buildSajuPrompt } from "./prompt";

const me = { name: "민지", birthDate: "1990-03-15", birthTime: "10:30", gender: "female" as const, calendar: "solar" as const };
const partner = { name: "준호", birthDate: "1992-10-24", birthTime: "05:30", gender: "male" as const, calendar: "solar" as const };

describe("buildSajuPrompt", () => {
  const d = getSajuDetail(me, "2026-09-30");
  const full = buildSajuPrompt(d);
  const compact = buildSajuPrompt(d, { compact: true });

  it("명식·대운·세운과 답변 형식을 담고, 생년월일시는 넣지 않는다", () => {
    expect(full).toContain("일주(나·배우자): 기묘(己卯)");
    expect(full).toContain("← 지금");
    expect(full).toContain("2026년 병오");
    expect(full).toContain("**지금의 흐름**");
    expect(full).not.toMatch(/1990|03-15|10:30/);
  });

  it("짧은 판은 지장간·기본 풀이를 빼고 ChatGPT 주소에 실린다", () => {
    expect(compact).not.toContain("지장간");
    expect(compact).not.toContain("사이트의 기본 풀이");
    expect(aiChatUrl("chatgpt", [full, compact]).prefilled).toBe(true);
  });
});

describe("buildCompatPrompt", () => {
  const prompt = buildCompatPrompt(getCompatDetail(me, partner, "lover"));

  it("두 사람·관계·점수를 담고 생년월일시는 넣지 않는다", () => {
    expect(prompt).toContain("연인 궁합");
    expect(prompt).toContain("민지에게 준호는 편재");
    expect(prompt).toContain("준호에게 민지는 편관");
    expect(prompt).not.toMatch(/1990|1992|10:30|05:30/);
    expect(aiChatUrl("chatgpt", [prompt]).prefilled).toBe(true);
  });
});
