import { direction, type Reading } from "./interpret";
import { TOPICS } from "./spreads";

/** 사용자가 원하는 AI에 붙여 넣어 더 자세히 물어볼 수 있는 프롬프트 */
export function buildAiPrompt(reading: Reading): string {
  const lines = [
    "타로 리더처럼 아래 타로 결과를 해석해 주세요.",
    "",
    `주제: ${TOPICS[reading.topic].label}`,
    reading.question ? `질문: ${reading.question}` : null,
    `스프레드: ${reading.spread.name}`,
    "",
    ...reading.cards.map(
      (c, i) => `${i + 1}. [${c.position.label}] ${c.card.name} (${c.card.nameEn}) ${direction(c.reversed)} — 키워드: ${c.keywords.join(", ")}`,
    ),
    "",
    "각 카드를 자리의 의미와 연결해 설명하고, 카드들 사이의 흐름을 종합한 뒤, 실천할 수 있는 조언으로 마무리해 주세요.",
    "불안을 부추기거나 단정하는 표현은 피하고, 따뜻한 말투로 답해 주세요.",
  ];
  return lines.filter((line) => line !== null).join("\n");
}
