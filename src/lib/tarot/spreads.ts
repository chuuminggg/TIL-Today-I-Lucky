export const TOPICS = {
  today: { label: "오늘·이번 주", emoji: "🌤️", examples: ["오늘 하루는 어떨까?", "이번 주 조심할 일은?"] },
  love: { label: "연애", emoji: "💘", examples: ["새로운 인연이 생길까?", "지금 연애는 어디로 가고 있을까?"] },
  crush: { label: "속마음", emoji: "💭", examples: ["그 사람은 나를 어떻게 생각할까?", "썸 타는 사람의 진심은?"] },
  reunion: { label: "재회", emoji: "🔁", examples: ["그 사람과 다시 연락이 될까?", "재회하려면 어떻게 해야 할까?"] },
  career: { label: "직업·이직", emoji: "💼", examples: ["이직해도 괜찮을까?", "지금 프로젝트는 잘될까?"] },
  money: { label: "금전", emoji: "💰", examples: ["이번 달 금전운은?", "이 지출, 해도 될까?"] },
  study: { label: "학업·시험", emoji: "📚", examples: ["이번 시험 결과는?", "공부 방향이 맞을까?"] },
  relationship: { label: "인간관계", emoji: "🤝", examples: ["친구와의 갈등, 어떻게 풀까?", "직장 동료와의 관계는?"] },
  yesno: { label: "예 / 아니오", emoji: "❔", examples: ["연락해도 될까?", "이 선택이 맞을까?"] },
  free: { label: "자유 질문", emoji: "🔮", examples: ["지금 가장 필요한 메시지는?"] },
} as const;

export type Topic = keyof typeof TOPICS;
export const TOPIC_IDS = Object.keys(TOPICS) as Topic[];

/** 포지션이 어떤 관점으로 카드를 읽을지 */
export type Lens = "core" | "past" | "present" | "future" | "feeling" | "obstacle" | "action" | "advice" | "outcome" | "day";

export interface SpreadPosition {
  key: string;
  label: string;
  question: string;
  lens: Lens;
}

export interface Spread {
  id: string;
  name: string;
  description: string;
  topics: Topic[]; // 추천 주제 (앞쪽일수록 우선)
  positions: SpreadPosition[];
  level: "basic" | "advanced";
}

const WEEKDAYS = ["월", "화", "수", "목", "금", "토", "일"];

export const SPREADS: Spread[] = [
  {
    id: "one",
    name: "원 카드",
    description: "지금 가장 필요한 메시지 한 장",
    topics: ["today", "free", "yesno"],
    level: "basic",
    positions: [{ key: "core", label: "핵심 메시지", question: "지금 나에게 필요한 메시지는?", lens: "core" }],
  },
  {
    id: "yes-no",
    name: "예/아니오",
    description: "흐름·결과·조언 세 장으로 답을 찾아요",
    topics: ["yesno"],
    level: "basic",
    positions: [
      { key: "flow", label: "현재 흐름", question: "지금 상황은 어떤 흐름인가요?", lens: "present" },
      { key: "outcome", label: "결과", question: "이대로라면 어떻게 될까요?", lens: "outcome" },
      { key: "advice", label: "조언", question: "무엇을 하면 좋을까요?", lens: "advice" },
    ],
  },
  {
    id: "three-time",
    name: "과거·현재·미래",
    description: "흐름을 시간 순서로 읽는 기본 스프레드",
    topics: ["today", "love", "reunion", "study", "relationship", "free"],
    level: "basic",
    positions: [
      { key: "past", label: "과거", question: "지금 상황을 만든 원인은?", lens: "past" },
      { key: "present", label: "현재", question: "지금은 어떤 상태인가요?", lens: "present" },
      { key: "future", label: "미래", question: "앞으로 어떻게 흘러갈까요?", lens: "future" },
    ],
  },
  {
    id: "three-action",
    name: "상황·행동·결과",
    description: "무엇을 하면 어떻게 될지 알아봐요",
    topics: ["career", "money", "study", "free"],
    level: "basic",
    positions: [
      { key: "situation", label: "현재 상황", question: "지금 어떤 상황인가요?", lens: "present" },
      { key: "action", label: "해야 할 행동", question: "무엇을 하면 좋을까요?", lens: "action" },
      { key: "outcome", label: "예상 결과", question: "그렇게 하면 어떻게 될까요?", lens: "outcome" },
    ],
  },
  {
    id: "relationship",
    name: "관계 스프레드",
    description: "나와 상대의 마음, 관계의 흐름",
    topics: ["crush", "love", "relationship"],
    level: "basic",
    positions: [
      { key: "me", label: "나의 마음", question: "나는 이 관계를 어떻게 느끼나요?", lens: "present" },
      { key: "them", label: "상대의 마음", question: "상대는 나를 어떻게 생각하나요?", lens: "feeling" },
      { key: "now", label: "현재 관계", question: "지금 두 사람의 관계는?", lens: "present" },
      { key: "obstacle", label: "장애물", question: "관계를 막고 있는 것은?", lens: "obstacle" },
      { key: "future", label: "앞으로의 전망", question: "관계는 어떻게 흘러갈까요?", lens: "outcome" },
    ],
  },
  {
    id: "reunion",
    name: "재회 스프레드",
    description: "헤어진 이유부터 재회 가능성까지",
    topics: ["reunion"],
    level: "basic",
    positions: [
      { key: "reason", label: "헤어진 이유", question: "무엇이 두 사람을 멀어지게 했나요?", lens: "past" },
      { key: "them", label: "상대의 현재 마음", question: "상대는 지금 나를 어떻게 생각하나요?", lens: "feeling" },
      { key: "me", label: "나의 현재 마음", question: "나는 지금 어떤 마음인가요?", lens: "present" },
      { key: "chance", label: "재회 가능성", question: "다시 이어질 수 있을까요?", lens: "outcome" },
      { key: "advice", label: "조언", question: "무엇을 하면 좋을까요?", lens: "advice" },
    ],
  },
  {
    id: "choice",
    name: "양자택일",
    description: "두 선택지의 흐름과 결과를 비교해요",
    topics: ["career", "love", "money", "free"],
    level: "basic",
    positions: [
      { key: "now", label: "현재 상황", question: "지금 나는 어떤 상황인가요?", lens: "present" },
      { key: "a", label: "A를 택하면", question: "A를 선택하면 어떤 흐름일까요?", lens: "future" },
      { key: "a-result", label: "A의 결과", question: "A의 끝은 어떨까요?", lens: "outcome" },
      { key: "b", label: "B를 택하면", question: "B를 선택하면 어떤 흐름일까요?", lens: "future" },
      { key: "b-result", label: "B의 결과", question: "B의 끝은 어떨까요?", lens: "outcome" },
    ],
  },
  {
    id: "week",
    name: "이번 주 운세",
    description: "월요일부터 일요일까지 하루 한 장",
    topics: ["today"],
    level: "basic",
    positions: WEEKDAYS.map((d, i) => ({ key: `day-${i}`, label: `${d}요일`, question: `${d}요일은 어떤 하루일까요?`, lens: "day" })),
  },
  {
    id: "celtic-cross",
    name: "켈틱 크로스",
    description: "상황을 깊고 넓게 보는 10장 스프레드",
    topics: ["free", "career", "love"],
    level: "advanced",
    positions: [
      { key: "present", label: "현재", question: "지금 상황의 핵심은?", lens: "present" },
      { key: "challenge", label: "장애물", question: "무엇이 가로막고 있나요?", lens: "obstacle" },
      { key: "conscious", label: "목표(의식)", question: "내가 바라는 것은?", lens: "future" },
      { key: "root", label: "근원(무의식)", question: "이 상황의 뿌리는?", lens: "past" },
      { key: "past", label: "과거", question: "지나온 영향은?", lens: "past" },
      { key: "near", label: "가까운 미래", question: "곧 일어날 일은?", lens: "future" },
      { key: "self", label: "나의 태도", question: "나는 어떻게 대하고 있나요?", lens: "present" },
      { key: "env", label: "주변 환경", question: "주변은 어떻게 작용하나요?", lens: "present" },
      { key: "hope", label: "희망과 두려움", question: "내가 바라면서도 두려워하는 것은?", lens: "feeling" },
      { key: "outcome", label: "최종 결과", question: "이대로라면 어떻게 될까요?", lens: "outcome" },
    ],
  },
];

const BY_ID = new Map(SPREADS.map((s) => [s.id, s]));
export const spreadById = (id: string) => BY_ID.get(id);

/** 주제에 맞는 스프레드 — 해당 주제를 앞쪽에 둔 스프레드가 먼저 */
export function spreadsForTopic(topic: Topic): Spread[] {
  return SPREADS.filter((s) => s.topics.includes(topic)).sort((a, b) => a.topics.indexOf(topic) - b.topics.indexOf(topic));
}
