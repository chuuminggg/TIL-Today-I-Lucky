// 결과를 사용자의 ChatGPT·Gemini로 넘겨 이어서 물어보기 — 우리 쪽 AI 비용 없음 (docs/TAROT_AI_PLAN.md 2장)

export type AiTarget = "chatgpt" | "gemini";

export const AI_TARGETS: Record<AiTarget, string> = { chatgpt: "ChatGPT", gemini: "Gemini" };

// 한글은 인코딩하면 약 6배로 길어진다 (타로 3장 ≈ 9천 자, 켈틱 크로스 10장 ≈ 1만 5천 자).
// CDN·프록시의 URL 길이 제한(보통 8–16KB)을 넘지 않게 제한한다.
export const MAX_PREFILL_URL_LENGTH = 12_000;

const chatGptUrl = (prompt: string) => `https://chatgpt.com/?q=${encodeURIComponent(prompt)}`;

/**
 * AI 서비스 새 대화 주소. prompts는 긴 것부터 — 주소에 실을 수 있는 첫 프롬프트로 ChatGPT 입력창을 미리 채운다.
 * Gemini는 주소로 미리 채우기를 지원하지 않아 빈 대화를 연다. 어느 경우든 화면에서 전체 프롬프트를 클립보드에 복사해 둔다.
 */
export function aiChatUrl(target: AiTarget, prompts: string[]): { url: string; prefilled: boolean } {
  if (target === "gemini") return { url: "https://gemini.google.com/app", prefilled: false };
  for (const prompt of prompts) {
    const url = chatGptUrl(prompt);
    if (url.length <= MAX_PREFILL_URL_LENGTH) return { url, prefilled: true };
  }
  return { url: "https://chatgpt.com/", prefilled: false };
}
