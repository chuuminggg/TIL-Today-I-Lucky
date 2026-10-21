import type { TodayReading } from "@/lib/today";

// 오늘의 운세를 사용자의 AI(ChatGPT·Gemini)에 넘기는 프롬프트.
// 생년월일시는 넣지 않고 계산된 간지·십신·점수 근거만 넣는다.
const STRENGTH_KO = { strong: "신강", balanced: "중화", weak: "신약" } as const;

export function buildTodayPrompt(r: TodayReading, { compact = false } = {}): string {
  const { fortune, me } = r;
  const lines = [
    "당신은 경험 많고 따뜻한 명리 상담가입니다. 아래는 이미 계산된 사주 명식과 오늘의 일진이에요. 이 사람의 오늘 하루를 한국어로 풀어 주세요.",
    "",
    "## 명식과 오늘",
    `- 명식(연·월·일·시): ${me.pillars.join(" ")}${me.timeKnown ? "" : " (태어난 시간을 몰라 시주는 비어 있음)"}`,
    `- 일간: ${me.dayMaster}, ${STRENGTH_KO[me.strength]}`,
    `- 오늘(${r.date}) 일진: ${r.iljin.label}(${r.iljin.hanja})일 — 내 일간에게 ${fortune.tenGod}`,
    `- 오늘 점수: ${fortune.score}점`,
    `- 분야별: ${fortune.categories.map((c) => `${c.label} ${c.stars}/5`).join(", ")}`,
    ...(compact ? [] : ["", "## 점수 근거", ...fortune.factors.map((f) => `- ${f}`), "", "## 참고: 사이트의 풀이", `- ${fortune.story}`]),
    "",
    "## 답변 형식 (마크다운 소제목, 700~1,000자)",
    "1. **오늘의 한 줄** — 오늘 하루의 핵심",
    "2. **오늘의 흐름** — 십신과 일진이 내 사주와 만나 생기는 기회와 조심할 점",
    "3. **분야별 조언** — 연애·재물·직업·건강 각각 1~2문장",
    "4. **오늘 해 볼 것 2가지, 피할 것 2가지**",
    "5. **더 물어볼 만한 질문 2개**",
    "",
    "## 지켜 주세요",
    "- 위 명식과 일진은 이미 계산된 결과예요. 다시 계산하거나 바꾸지 말고 그대로 해석해 주세요.",
    "- 명리 용어는 처음 나올 때 쉬운 말로 풀어 주세요.",
    "- 하루의 운을 단정하거나 불안을 부추기지 말고, 선택의 여지를 함께 이야기해 주세요.",
    "- 건강·법률·투자처럼 전문 판단이 필요한 내용은 전문가 상담을 권해 주세요.",
    "- 친구에게 이야기하듯 따뜻하고 솔직한 존댓말로 답해 주세요.",
  ];
  return lines.join("\n");
}
