import { describe, expect, it } from "vitest";
import { interpretReading, type ReadingRequest } from "./interpret";
import { aiChatUrl, buildAiPrompt, MAX_PREFILL_URL_LENGTH } from "./prompt";

const reading = (req: Partial<ReadingRequest> = {}) =>
  interpretReading({ topic: "reunion", question: "그 사람과 다시 연락이 될까요?", spreadId: "reunion", seed: "prompt-seed-1", picks: [0, 10, 20, 30, 40], ...req });

describe("buildAiPrompt", () => {
  it("질문·스프레드·모든 카드와 자리 의미를 담는다", () => {
    const r = reading();
    const prompt = buildAiPrompt(r);
    expect(prompt).toContain("질문: 그 사람과 다시 연락이 될까요?");
    expect(prompt).toContain("스프레드: 재회 스프레드 (5장)");
    for (const c of r.cards) {
      expect(prompt).toContain(`[${c.position.label}] ${c.card.name} (${c.card.nameEn})`);
      expect(prompt).toContain(c.position.question);
      expect(prompt).toContain(c.text);
    }
  });

  it("주제별 해석 방향과 안전 규칙, 답변 형식을 담는다", () => {
    const prompt = buildAiPrompt(reading());
    expect(prompt).toContain("연락 강요·집착을 부추기는 조언은 하지 마세요");
    expect(prompt).toContain("전문가 상담을 권해 주세요");
    expect(prompt).toContain("**실천 조언**");
  });

  it("예/아니오 판정과 질문 없음을 반영한다", () => {
    const r = reading({ topic: "yesno", question: undefined, spreadId: "yes-no", picks: [1, 2, 3] });
    const prompt = buildAiPrompt(r);
    expect(prompt).toContain("질문 없음");
    expect(prompt).toContain(`예/아니오 판정 — ${r.verdict!.label}`);
    expect(prompt).toContain("'예 / 아니오 / 조건부' 중 하나로");
  });
});

describe("buildAiPrompt compact", () => {
  it("짧은 판은 카드별 기본 해석과 전체 특징을 빼고 형식·규칙은 유지한다", () => {
    const r = reading();
    const compact = buildAiPrompt(r, { compact: true });
    expect(compact).not.toContain("기본 해석:");
    expect(compact).not.toContain("카드 전체에서 보이는 특징");
    expect(compact).toContain(r.cards[0].position.question);
    expect(compact).toContain("**실천 조언**");
    expect(compact.length).toBeLessThan(buildAiPrompt(r).length);
  });
});

describe("aiChatUrl", () => {
  it("짧은 스프레드는 전체 프롬프트를 ?q=로 싣는다", () => {
    const r = reading({ spreadId: "one", picks: [5] });
    expect(aiChatUrl("chatgpt", r)).toEqual({ url: `https://chatgpt.com/?q=${encodeURIComponent(buildAiPrompt(r))}`, prefilled: true });
  });

  it.each([
    ["three-time", 3],
    ["reunion", 5],
    ["week", 7],
    ["celtic-cross", 10],
  ] as const)("%s(%i장)은 카드가 무엇이든 주소 길이 제한 안에서 미리 채운다", (spreadId, n) => {
    for (let s = 0; s < 100; s++) {
      const picks = Array.from({ length: n }, (_, i) => (s * 13 + i * 11) % 78);
      const { url, prefilled } = aiChatUrl("chatgpt", reading({ spreadId, seed: `seed-${s}-xyz`, picks }));
      expect(prefilled).toBe(true);
      expect(url.length).toBeLessThanOrEqual(MAX_PREFILL_URL_LENGTH);
    }
  });

  it("Gemini는 주소 미리 채우기를 지원하지 않아 빈 대화를 연다", () => {
    expect(aiChatUrl("gemini", reading())).toEqual({ url: "https://gemini.google.com/app", prefilled: false });
  });
});
