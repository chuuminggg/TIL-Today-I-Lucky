import { direction, type Reading } from "./interpret";
import { ELEMENT_LABEL } from "./labels";
import { TOPICS, type Topic } from "./spreads";

/** 주제별로 AI가 중점을 둘 부분과 피해야 할 조언 */
const TOPIC_GUIDE: Record<Topic, string> = {
  today: "오늘(또는 이번 주)의 전반적인 흐름과, 일·관계·컨디션에서 실제로 신경 쓸 점을 짚어 주세요.",
  love: "관계의 흐름과 두 사람의 감정 교류를 중심으로, 관계를 건강하게 가꾸는 방법을 알려 주세요.",
  crush: "상대의 속마음은 단정하지 말고 '카드가 보여 주는 가능성'으로 표현하고, 직접 확인할 수 있는 대화 방법을 제안해 주세요.",
  reunion: "헤어진 원인과 재회 가능성을 함께 보되, 재회만이 답이 아닐 수 있다는 관점도 알려 주세요. 연락 강요·집착을 부추기는 조언은 하지 마세요.",
  career: "현실적인 행동 계획(준비 순서, 점검할 것)을 중심으로 조언하고, 이직·퇴사 여부를 단정하지 마세요.",
  money: "지출·저축 습관과 재정 관리 태도를 중심으로 조언하고, 특정 투자 상품·종목·시점은 추천하지 마세요.",
  study: "공부 방향, 집중력, 컨디션 관리처럼 실천할 수 있는 부분을 중심으로 조언해 주세요.",
  relationship: "소통 방식과 서로의 경계를 중심으로, 관계를 풀어 갈 구체적인 말과 행동을 제안해 주세요.",
  yesno: "답을 '예 / 아니오 / 조건부' 중 하나로 먼저 말하고, 그렇게 본 근거 카드와 결과를 바꿀 수 있는 조건을 설명해 주세요.",
  free: "질문의 의도를 먼저 짚고, 그에 맞춰 카드를 해석해 주세요.",
};

/**
 * 사용자가 쓰는 AI(ChatGPT·Gemini 등)에 붙여 넣어 더 깊은 해석을 받는 프롬프트.
 * compact는 주소(?q=)에 싣기 위해 카드별 기본 해석과 전체 특징을 뺀 짧은 판이다.
 */
export function buildAiPrompt(reading: Reading, { compact = false } = {}): string {
  const { cards, insights, verdict } = reading;
  const topic = TOPICS[reading.topic];

  const cardLines = cards.flatMap((c, i) => [
    `${i + 1}. [${c.position.label}] ${c.card.name} (${c.card.nameEn}) — ${direction(c.reversed)}`,
    `   - 자리의 의미: ${c.position.question}`,
    `   - 키워드: ${c.keywords.join(", ")} / 원소: ${ELEMENT_LABEL[c.card.element].name}`,
    compact ? null : `   - 기본 해석: ${c.text}`,
  ]);
  const notes = compact ? [] : insights;

  const sections = [
    "당신은 20년 경력의 따뜻하고 통찰력 있는 타로 리더입니다. 라이더-웨이트-스미스 덱의 상징을 바탕으로 아래 타로 결과를 한국어로 깊이 있게 해석해 주세요.",
    "",
    "## 상담 정보",
    `- 주제: ${topic.label}`,
    `- 질문: ${reading.question ?? "(질문 없음 — 지금 나에게 필요한 메시지)"}`,
    `- 스프레드: ${reading.spread.name} (${cards.length}장)`,
    reading.allowReversed ? "- 역방향 카드 포함" : "- 역방향 없이 정방향으로만 뽑음",
    "",
    "## 뽑은 카드 (뽑은 순서 = 자리 순서)",
    ...cardLines,
    "",
    notes.length > 0 ? "## 참고: 카드 전체에서 보이는 특징" : null,
    ...notes.map((insight) => `- ${insight.text}`),
    notes.length > 0 ? "" : null,
    compact ? null : "## 참고: 사이트가 엮은 카드 이야기",
    compact ? null : reading.story,
    compact ? null : "",
    verdict ? `## 참고: 카드 점수로 본 예/아니오 판정 — ${verdict.label}` : null,
    verdict ? "" : null,
    "## 해석 방향",
    `- ${TOPIC_GUIDE[reading.topic]}`,
    compact
      ? "- 카드의 그림 속 상징(인물, 색, 배경, 소품)과 자리의 의미를 연결해 깊게 풀어 주세요."
      : "- 위의 '기본 해석'과 '참고'는 출발점일 뿐이에요. 카드의 그림 속 상징(인물, 색, 배경, 소품)과 자리의 의미를 연결해 더 깊게 풀어 주세요.",
    "- 카드 한 장씩 따로 읽지 말고, 카드들이 이어서 들려주는 하나의 이야기로 엮어 주세요.",
    "",
    "## 답변 형식 (마크다운 소제목 사용, 전체 1,000~1,500자)",
    "1. **한 줄 요약** — 질문에 대한 핵심 메시지 한 문장",
    "2. **카드별 해석** — 카드마다 '자리의 의미 → 카드 상징 → 이 질문에서의 의미' 순서로 2~3문장",
    "3. **전체 흐름** — 카드들의 연결, 반복되는 수트·숫자, 정·역방향의 균형이 말해 주는 것",
    "4. **질문에 대한 답** — 질문에 대한 솔직한 답과 그 근거",
    "5. **실천 조언** — 오늘 할 수 있는 일 1가지, 이번 주에 할 일 1가지, 피해야 할 것 1가지",
    "6. **더 물어볼 만한 질문** — 이 결과를 바탕으로 이어서 물어보면 좋을 질문 2개",
    "",
    "## 지켜 주세요",
    "- 불안이나 공포를 부추기거나, 미래를 단정하는 표현은 쓰지 마세요.",
    "- 다른 사람의 속마음과 행동은 '가능성'으로만 이야기해 주세요.",
    "- 건강·법률·투자처럼 전문 판단이 필요한 내용은 전문가 상담을 권해 주세요.",
    "- 친구에게 이야기하듯 따뜻하고 솔직한 존댓말로 답해 주세요.",
  ];
  return sections.filter((line) => line !== null).join("\n");
}

export type AiTarget = "chatgpt" | "gemini";

export const AI_TARGETS: Record<AiTarget, string> = { chatgpt: "ChatGPT", gemini: "Gemini" };

// 한글은 인코딩하면 약 6배로 길어진다 (3장 ≈ 9천 자, 켈틱 크로스 10장 ≈ 1만 5천 자).
// CDN·프록시의 URL 길이 제한(보통 8–16KB)을 넘지 않게 제한한다. 짧은 판 기준으로 켈틱 크로스(10장)까지 실린다.
export const MAX_PREFILL_URL_LENGTH = 12_000;

const chatGptUrl = (prompt: string) => `https://chatgpt.com/?q=${encodeURIComponent(prompt)}`;

/**
 * AI 서비스 새 대화 주소.
 * ChatGPT는 ?q= 로 입력창을 미리 채운다 — 전체 프롬프트가 길면 짧은 판으로, 그래도 길면 빈 대화.
 * Gemini는 주소로 미리 채우기를 지원하지 않아 빈 대화를 연다. 어느 경우든 화면에서 전체 프롬프트를 클립보드에 복사해 둔다.
 */
export function aiChatUrl(target: AiTarget, reading: Reading): { url: string; prefilled: boolean } {
  if (target === "gemini") return { url: "https://gemini.google.com/app", prefilled: false };
  for (const compact of [false, true]) {
    const url = chatGptUrl(buildAiPrompt(reading, { compact }));
    if (url.length <= MAX_PREFILL_URL_LENGTH) return { url, prefilled: true };
  }
  return { url: "https://chatgpt.com/", prefilled: false };
}
