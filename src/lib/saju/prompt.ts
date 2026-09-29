import { attach } from "@/lib/josa";
import type { CompatDetail } from "./compat";
import type { SajuDetail } from "./detail";
import { RELATION_TYPES } from "./detail-text";

// 사주·궁합 결과를 사용자의 AI(ChatGPT·Gemini)에 넘기는 프롬프트.
// 생년월일시는 넣지 않고 계산된 간지·십신·오행만 넣는다 — 이미 계산한 명식을 AI가 다시 계산하지 않게 한다.

const RULES = [
  "## 지켜 주세요",
  "- 위 명식은 이미 계산된 결과예요. 다시 계산하거나 바꾸지 말고 그대로 해석해 주세요.",
  "- 명리 용어는 처음 나올 때 쉬운 말로 풀어 주세요.",
  "- 미래를 단정하거나 불안을 부추기지 말고, 가능성과 선택의 여지를 함께 이야기해 주세요.",
  "- 건강·법률·투자처럼 전문 판단이 필요한 내용은 전문가 상담을 권해 주세요.",
  "- 친구에게 이야기하듯 따뜻하고 솔직한 존댓말로 답해 주세요.",
];

export function buildSajuPrompt(d: SajuDetail, { compact = false } = {}): string {
  const cells = d.chart.map((c, i) =>
    c
      ? `- ${c.label}(${c.area}): ${c.stem.ko}${c.branch.ko}(${c.stem.hanja}${c.branch.hanja}) — 천간 ${c.stem.tenGod}, 지지 ${c.branch.tenGod}${compact ? "" : `, 지장간 ${c.hidden.map((h) => `${h.ko}(${h.tenGod})`).join("·")}`}`
      : `- ${["시주", "일주", "월주", "연주"][i]}: 태어난 시간을 몰라 비어 있음`,
  );
  const luck = d.luck.periods.map((p) => `${p.age}세 ${p.label}(${p.stemTenGod})${p.current ? " ← 지금" : ""}`).join(", ");

  const lines = [
    "당신은 경험 많고 따뜻한 명리 상담가입니다. 아래 사주 명식을 바탕으로 이 사람의 타고난 성향과 지금의 흐름을 한국어로 풀어 주세요.",
    "",
    "## 명식 (시·일·월·연)",
    ...cells,
    `- 일간: ${d.dayMaster.ko}(${d.dayMaster.hanja}) — ${d.dayMaster.image}`,
    `- 신강약: ${d.strength.label}`,
    `- 오행 분포: ${d.elements.map((e) => `${e.label} ${e.count}`).join(", ")}`,
    `- 용신: ${d.yongsin.primary} (희신 ${d.yongsin.secondary})`,
    `- 십신 분포: ${d.groups.map((g) => `${g.group} ${g.count}`).join(", ")}`,
    d.relations.length ? `- 원국 지지 관계: ${d.relations.map((r) => `${r.between.join("·")} ${r.kind}`).join(", ")}` : null,
    `- 대운(${d.luck.forward ? "순행" : "역행"}${d.luck.approximate ? ", 출생 시간을 몰라 잠정" : ""}): ${luck}`,
    `- 세운: ${d.years.map((y) => `${y.year}년 ${y.label}(${y.tenGod})`).join(", ")}`,
    "",
    compact ? null : "## 참고: 사이트의 기본 풀이",
    ...(compact ? [] : d.topics.map((t) => `- ${t.label}: ${t.summary}`)),
    compact ? null : "",
    "## 답변 형식 (마크다운 소제목, 1,200~1,800자)",
    "1. **타고난 성향** — 일간과 십신 분포로 본 성격과 강점",
    "2. **조심할 점** — 과한 기운·부족한 기운이 만드는 패턴과 보완법",
    "3. **지금의 흐름** — 지금 대운과 올해·내년 세운이 주는 기회와 과제",
    "4. **분야별 조언** — 연애·재물·직업·건강 각각 2~3문장",
    "5. **올해 실천할 것 3가지**",
    "6. **더 물어볼 만한 질문 2개**",
    "",
    ...RULES,
  ];
  return lines.filter((line) => line !== null).join("\n");
}

export function buildCompatPrompt(d: CompatDetail): string {
  const [a, b] = d.people;
  const person = (p: typeof a) =>
    `- ${p.nickname}: 일간 ${p.dayMaster.ko}(${p.dayMaster.hanja}, ${p.dayMaster.image}), 명식(연·월·일·시) ${p.pillars.join(" ")}, ${p.animal}띠, 강한 오행 ${p.dominant.join("·") || "없음"}, 약한 오행 ${p.weak.join("·") || "없음"}`;

  const lines = [
    `당신은 경험 많고 따뜻한 명리 상담가입니다. 아래 두 사람의 사주로 본 ${RELATION_TYPES[d.relation].label} 궁합을 한국어로 풀어 주세요.`,
    "",
    "## 두 사람",
    person(a),
    person(b),
    "",
    "## 계산된 궁합",
    `- 궁합 점수: ${d.score}점 (${d.headline})`,
    `- ${a.nickname}에게 ${attach(b.nickname, "은/는")} ${d.roles.meToPartner.tenGod}, ${b.nickname}에게 ${attach(a.nickname, "은/는")} ${d.roles.partnerToMe.tenGod}`,
    `- 일간 오행: ${d.elementBond}`,
    `- 일지 관계: ${d.dayBranch.relations.join("·") || "특별한 합·충 없음"}`,
    `- 띠: ${d.zodiac.text}`,
    ...d.complement.map((c) => `- ${c}`),
    "",
    "## 답변 형식 (마크다운 소제목, 1,000~1,500자)",
    "1. **한 줄 요약** — 두 사람 관계의 핵심",
    "2. **서로에게 어떤 사람인가** — 일간 관계로 본 역할과 끌림",
    "3. **잘 맞는 점** 3가지",
    "4. **부딪히기 쉬운 점과 대화법** 3가지 — 실제로 쓸 수 있는 말 예시 포함",
    `5. **${RELATION_TYPES[d.relation].label} 관계를 위한 조언**`,
    "6. **더 물어볼 만한 질문 2개**",
    "",
    ...RULES,
    "- 궁합은 관계를 결정하지 않아요. 만남·이별·결혼 여부를 단정하지 말고 관계를 돌아보는 대화 재료로 풀어 주세요.",
  ];
  return lines.join("\n");
}
