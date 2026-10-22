import { describe, expect, it } from "vitest";
import { aiChatUrl } from "@/lib/ai-handoff";
import { getTodayReading } from "@/lib/today";
import { buildTodayPrompt } from "./today-prompt";

describe("오늘의 운세 AI 프롬프트", () => {
  const profile = { calendar: "solar" as const, birthDate: "1990-03-15", birthTime: "10:30", gender: "male" as const };
  const reading = getTodayReading(profile, "2026-10-21");

  it("생년월일시는 넣지 않고 계산된 간지와 오늘 정보를 담는다", () => {
    const prompt = buildTodayPrompt(reading);
    expect(prompt).not.toContain("1990");
    expect(prompt).not.toContain("10:30");
    expect(prompt).toContain(reading.me.pillars.join(" "));
    expect(prompt).toContain(`${reading.iljin.label}(${reading.iljin.hanja})일`);
    expect(prompt).toContain(reading.fortune.story);
  });

  it("ChatGPT 입력창을 미리 채울 수 있는 길이", () => {
    const prompts = [buildTodayPrompt(reading), buildTodayPrompt(reading, { compact: true })];
    expect(aiChatUrl("chatgpt", prompts).prefilled).toBe(true);
  });
});
