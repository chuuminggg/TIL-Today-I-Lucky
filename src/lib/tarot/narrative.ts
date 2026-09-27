import { attach } from "@/lib/josa";
import { hashString } from "@/lib/random";
import { PHRASES } from "./data/phrases";
import { cardScore } from "./scoring";
import type { Lens, SpreadPosition } from "./spreads";
import type { TarotCard } from "./types";

export interface StoryCard {
  position: SpreadPosition;
  card: TarotCard;
  reversed: boolean;
}

// 문장 틀 — {c} 카드 이름("태양 카드"), {p} 카드 구절, {a} 카드 조언 문장.
// {c:이/가}처럼 쓰면 받침에 맞는 조사를 붙인다. 틀이 여러 개면 seed로 하나를 고른다.
// 맨 앞의 ^는 "앞에 연결어를 붙이지 않음" — 조건절("이대로라면")이나 좋고 나쁨이 섞인 문장이 "다행히"로 시작하지 않게.
// 방향(upright/reversed)이나 카드 기운(positive/negative)에 따라 다른 틀을 쓸 수 있다.
export type Templates = string[] | { upright: string[]; reversed: string[] } | { positive: string[]; negative: string[] };

export const BY_LENS: Record<Exclude<Lens, "day">, Templates> = {
  core: [
    "지금 당신에게 가장 필요한 메시지는 {c:이/가} 전하는 {p:이에요/예요}.",
    "{c:은/는} 지금 당신에게 {p:을/를} 이야기하고 있어요.",
    "이번 질문의 한가운데에는 {c}의 {p:이/가} 놓여 있어요.",
    "이 질문에서 {c:이/가} 가장 먼저 짚는 것은 {p:이에요/예요}.",
    "카드가 건네는 첫 번째 열쇠는 {c}의 {p:이에요/예요}.",
  ],
  past: [
    "지난 시간에는 {c:이/가} 보여 주는 {p:이/가} 있었어요.",
    "이 흐름은 {c}의 {p}에서 시작됐어요.",
    "돌아보면 {c}의 {p:이/가} 지금 상황의 바탕이 되었어요.",
    "{c:은/는} 지나온 길에 {p:이/가} 있었다고 말해요.",
    "지금에 이르기까지 {c}의 {p:이/가} 적지 않은 흔적을 남겼어요.",
  ],
  present: [
    "지금은 {c:이/가} 말하듯 {p}의 한가운데에 있어요.",
    "현재 당신은 {c}의 {p:을/를} 지나고 있어요.",
    "요즘 당신의 하루에는 {c}의 {p:이/가} 짙게 묻어 있어요.",
    "{c:은/는} 지금 당신 곁에 {p:이/가} 있다고 알려 줘요.",
    "지금 이 순간을 한마디로 하면 {c}의 {p:이에요/예요}.",
  ],
  future: [
    "앞으로는 {c:이/가} 보여 주듯 {p:이/가} 찾아올 수 있어요.",
    "머지않아 {c}의 {p:이/가} 다가오고 있어요.",
    "곧 {c}의 {p:을/를} 마주하게 될 가능성이 커요.",
    "다음 흐름에서는 {c:이/가} 가리키는 {p:이/가} 모습을 드러낼 거예요.",
    "{c:은/는} 가까운 앞날에 {p:이/가} 기다리고 있다고 말해요.",
  ],
  outcome: [
    "^이대로라면 {c:이/가} 가리키는 {p:으로/로} 이어질 수 있어요.",
    "흐름의 끝에는 {c}의 {p:이/가} 기다리고 있어요.",
    "^지금 방향을 유지하면 결국 {c}의 {p:을/를} 만나게 될 거예요.",
    "{c:은/는} 이 일이 {p:으로/로} 마무리될 수 있다고 알려 줘요.",
    "마지막 장면에는 {c}의 {p:이/가} 그려져 있어요.",
  ],
  feeling: [
    "그 사람의 마음에는 {c:이/가} 보여 주는 {p:이/가} 자리하고 있을 수 있어요.",
    "상대의 마음은 지금 {c}의 {p}에 머물러 있을지도 몰라요.",
    "상대는 당신을 떠올릴 때 {c}의 {p:을/를} 느끼고 있을 가능성이 있어요.",
    "^겉으로 다 드러내지는 않아도, 상대의 속에는 {c}의 {p:이/가} 있을 수 있어요.",
    "{c:은/는} 그 사람의 마음속에 {p:이/가} 흐르고 있을지 모른다고 말해요.",
  ],
  obstacle: {
    // 정방향 카드도 장애물 자리에서는 "지나치면 문제가 되는 면"으로 읽는다
    upright: [
      "{c}의 {p:이/가} 지나치면 오히려 걸림돌이 될 수 있어요.",
      "{c:이/가} 보여 주는 {p:도/도} 과하면 발목을 잡을 수 있어요.",
      "{c}의 {p:도/도} 정도를 넘으면 부담이 될 수 있어요.",
      "좋은 기운이라도 {c}의 {p:이/가} 넘치면 균형이 깨질 수 있어요.",
      "{c:이/가} 말하는 {p:이/가} 지나치게 커지지 않도록 살펴보세요.",
    ],
    reversed: [
      "{c}의 {p:이/가} 앞길을 가로막고 있어요.",
      "걸림돌은 {c:이/가} 보여 주는 {p:이에요/예요}.",
      "지금 발목을 잡는 것은 {c}의 {p:이에요/예요}.",
      "{c:은/는} {p:이/가} 흐름을 막고 있다고 알려 줘요.",
      "{c}의 {p:을/를} 풀어야 다음으로 나아갈 수 있어요.",
    ],
  },
  advice: [
    "{c:이/가} 건네는 조언은 이래요. {a}",
    "{c}의 조언을 따라 보세요. {a}",
    "{c:이/가} 권하는 방법은 이거예요. {a}",
    "지금 할 수 있는 한 가지를 {c:이/가} 알려 줘요. {a}",
    "{c}의 목소리에 귀 기울여 보세요. {a}",
  ],
  action: [
    "지금 해야 할 일은 {c:이/가} 알려 줘요. {a}",
    "{c}의 조언처럼 움직여 보세요. {a}",
    "첫걸음은 {c:이/가} 보여 줘요. {a}",
    "{c:이/가} 권하는 행동은 이래요. {a}",
    "망설여진다면 {c}의 방향을 따라가 보세요. {a}",
  ],
};

const MY_HEART: Templates = [
  "당신의 마음은 {c}의 {p}에 가까워요.",
  "당신은 지금 {c:이/가} 보여 주는 {p:을/를} 품고 있어요.",
  "당신 쪽에서는 {c}의 {p:이/가} 가장 크게 느껴져요.",
  "{c:은/는} 당신이 {p:을/를} 안고 이 관계를 바라보고 있다고 말해요.",
  "스스로도 알고 있겠지만, 당신 안에는 {c}의 {p:이/가} 있어요.",
];

/** 같은 관점이라도 스프레드마다 더 어울리는 문장 — "스프레드id:포지션key" */
export const BY_POSITION: Record<string, Templates> = {
  "relationship:me": MY_HEART,
  "reunion:me": MY_HEART,
  "relationship:now": [
    "두 사람 사이에는 지금 {c}의 {p:이/가} 흐르고 있어요.",
    "지금 둘의 관계에는 {c:이/가} 보여 주는 {p:이/가} 있어요.",
    "요즘 두 사람의 온도는 {c}의 {p}에 가까워요.",
    "{c:은/는} 지금 관계의 중심에 {p:이/가} 있다고 알려 줘요.",
    "둘이 함께 있을 때의 분위기는 {c}의 {p:으로/로} 채워져 있어요.",
  ],
  "reunion:reason": {
    // 좋은 카드가 "헤어진 이유"에 나오면 "그것만으로는 부족했다"로 읽는다
    positive: [
      "두 사람 사이에는 {c}의 {p:이/가} 있었지만, 그것만으로는 관계를 지키기 어려웠어요.",
      "{c:이/가} 보여 주는 {p:이/가} 있었는데도 두 사람은 멀어졌어요.",
      "{c}의 {p:이/가} 분명 있었지만, 서로의 속도가 달랐어요.",
      "관계에는 {c}의 {p:이/가} 있었지만, 그것을 지켜 갈 여유가 부족했어요.",
      "{c}의 {p:이/가} 있었는데도 마음을 전하는 방식이 엇갈렸어요.",
    ],
    negative: [
      "두 사람이 멀어진 데는 {c}의 {p:이/가} 컸어요.",
      "{c:이/가} 보여 주듯 {p:이/가} 두 사람 사이를 멀어지게 했어요.",
      "{c}의 {p:이/가} 두 사람 사이에 조금씩 거리를 만들었어요.",
      "헤어짐의 가장 큰 이유는 {c}의 {p:이었어요/였어요}.",
      "{c:은/는} {p:이/가} 관계를 지치게 했다고 말해요.",
    ],
  },
  "reunion:chance": [
    "다시 이어질 가능성에는 {c}의 {p:이/가} 비치고 있어요.",
    "재회의 흐름 위에는 {c:이/가} 보여 주는 {p:이/가} 놓여 있어요.",
    "다시 만날 길목에는 {c}의 {p:이/가} 서 있어요.",
    "{c:은/는} 두 사람의 다음 장면에 {p:이/가} 있다고 말해요.",
    "^재회를 생각한다면 {c}의 {p:을/를} 먼저 떠올려 보세요.",
  ],
  "celtic-cross:root": [
    "이 모든 일의 뿌리에는 {c}의 {p:이/가} 있어요.",
    "겉으로는 잘 보이지 않지만, 바탕에는 {c}의 {p:이/가} 깔려 있어요.",
    "깊은 곳을 들여다보면 {c}의 {p:이/가} 자리하고 있어요.",
    "{c:은/는} 이 일의 출발점이 {p:이었다고/였다고} 말해요.",
    "마음 깊은 곳에서 {c}의 {p:이/가} 이 상황을 움직이고 있어요.",
  ],
  "celtic-cross:hope": [
    "^마음 한편에서는 {c}의 {p:을/를} 바라면서도 두려워하고 있어요.",
    "^{c}의 {p:은/는} 당신이 바라는 것이자 동시에 두려워하는 것이에요.",
    "^당신은 {c}의 {p:을/를} 기대하면서도 한편으로는 겁내고 있어요.",
    "^{c:은/는} {p:을/를} 향한 기대와 걱정이 함께 있다고 말해요.",
    "^바라는 마음과 두려운 마음 사이에 {c}의 {p:이/가} 있어요.",
  ],
};

/** 켈틱 크로스는 10문장이면 너무 길어 핵심 자리만 이야기로 엮는다 */
const SKIP = new Set(["celtic-cross:conscious", "celtic-cross:past", "celtic-cross:self", "celtic-cross:env"]);

export const CONNECTORS = {
  advice: ["그러니", "그래서", "그렇다면"],
  contrast: ["다만", "하지만", "그렇지만"],
  up: ["다행히", "그래도", "반갑게도"],
  down: ["그런데", "한편", "아쉽게도"],
  flat: ["그리고", "이어서", "또"],
} as const;

/** "19. 태양" → "태양 카드" */
const cardLabel = (card: TarotCard) => `${card.name.replace(/^\d+\.\s*/, "")} 카드`;
const phraseOf = ({ card, reversed }: Pick<StoryCard, "card" | "reversed">) => PHRASES[card.id]?.[reversed ? 1 : 0] ?? card[reversed ? "reversed" : "upright"].keywords[0];
const scoreOf = (sc: StoryCard) => cardScore(sc.card, sc.reversed);

export function render(template: string, sc: StoryCard): string {
  if (template.startsWith("^")) template = template.slice(1);
  const values = { c: cardLabel(sc.card), p: phraseOf(sc), a: (sc.reversed ? sc.card.reversed : sc.card.upright).advice };
  return template.replace(/\{([cpa])(?::([^}]+))?\}/g, (_, key: "c" | "p" | "a", pair?: string) =>
    pair ? attach(values[key], pair) : values[key],
  );
}

function pick<T>(items: readonly T[], seed: string): T {
  return items[hashString(seed) % items.length];
}

function connectorFor(prev: StoryCard, current: StoryCard, used: Set<string>, seed: string): string | null {
  const { lens } = current.position;
  const delta = scoreOf(current) - scoreOf(prev);
  const kind =
    lens === "advice" || lens === "action" ? "advice" : lens === "obstacle" ? "contrast" : delta >= 0.75 ? "up" : delta <= -0.75 ? "down" : "flat";
  const free = CONNECTORS[kind].filter((c) => !used.has(c));
  const connector = free.length ? pick(free, seed) : null;
  if (connector) used.add(connector);
  return connector;
}

function sequenceStory(spreadId: string, cards: StoryCard[], seed: string): string {
  const sentences: string[] = [];
  const used = new Set<string>();
  let prev: StoryCard | null = null;
  for (const sc of cards) {
    const id = `${spreadId}:${sc.position.key}`;
    if (SKIP.has(id) || sc.position.lens === "day") continue;
    const templates = BY_POSITION[id] ?? BY_LENS[sc.position.lens];
    const variants = Array.isArray(templates)
      ? templates
      : "upright" in templates
        ? templates[sc.reversed ? "reversed" : "upright"]
        : templates[scoreOf(sc) > 0 ? "positive" : "negative"];
    const template = pick(variants, `${seed}:${id}`);
    const sentence = render(template, sc);
    const connector = prev && !template.startsWith("^") ? connectorFor(prev, sc, used, `${seed}:${id}:link`) : null;
    sentences.push(connector ? `${connector} ${sentence}` : sentence);
    prev = sc;
  }
  return sentences.join(" ");
}

export const CHOICE = {
  paths: [
    "A를 택하면 {A} 이어지고, B를 택하면 {B} 이어져요.",
    "A 쪽 길은 {A} 흘러가고, B 쪽 길은 {B} 흘러가요.",
    "A를 고르면 {A} 나아가고, B를 고르면 {B} 나아가요.",
  ],
  a: ["카드만 보면 A 쪽 흐름이 더 밝아요.", "두 길 중에서는 A 쪽에 조금 더 밝은 빛이 비쳐요.", "카드는 A 쪽 길을 조금 더 응원하고 있어요."],
  b: ["카드만 보면 B 쪽 흐름이 더 밝아요.", "두 길 중에서는 B 쪽에 조금 더 밝은 빛이 비쳐요.", "카드는 B 쪽 길을 조금 더 응원하고 있어요."],
  even: [
    "두 길의 무게가 비슷해요. 마음이 더 끌리는 쪽을 믿어 보세요.",
    "어느 쪽도 크게 기울지 않아요. 결정의 열쇠는 카드보다 당신의 마음에 있어요.",
    "두 길 모두 비슷한 무게예요. 무엇을 더 지키고 싶은지 먼저 떠올려 보세요.",
  ],
};

/** 양자택일: 현재 → A의 흐름 → B의 흐름 → 어느 쪽이 밝은지 */
function choiceStory([now, a, aResult, b, bResult]: StoryCard[], seed: string): string {
  const path = (x: StoryCard, result: StoryCard) =>
    `${cardLabel(x.card)}의 ${attach(phraseOf(x), "을/를")} 지나 ${cardLabel(result.card)}의 ${attach(phraseOf(result), "으로/로")}`;
  const diff = scoreOf(a) + 2 * scoreOf(aResult) - (scoreOf(b) + 2 * scoreOf(bResult));
  const verdict = diff >= 1 ? CHOICE.a : diff <= -1 ? CHOICE.b : CHOICE.even;
  return [
    render(pick(BY_LENS.present as string[], `${seed}:choice:now`), now),
    pick(CHOICE.paths, `${seed}:choice:paths`).replace("{A}", path(a, aResult)).replace("{B}", path(b, bResult)),
    pick(verdict, `${seed}:choice:verdict`),
  ].join(" ");
}

export const WEEK = {
  best: [
    "이번 주 기운이 가장 좋은 날은 {d:이에요/예요}. {c}의 {p:이/가} 함께해요.",
    "{d:이/가} 이번 주에서 가장 빛나는 날이에요. {c}의 {p:이/가} 힘을 보태 줘요.",
    "중요한 일은 {d}에 해 보세요. {c}의 {p:이/가} 곁에 있어요.",
  ],
  caution: [
    "{d}에는 {c}의 {p:을/를} 조심하세요.",
    "{d}에는 {c}의 {p:이/가} 고개를 들 수 있으니 한 박자 쉬어 가세요.",
    "{d:은/는} {c}의 {p:이/가} 비치는 날이라 무리한 약속은 피하는 게 좋아요.",
  ],
  calm: [
    "{d:은/는} 상대적으로 잔잔하니 무리하지 말고 쉬어 가세요.",
    "{d:은/는} 흐름이 조용한 날이라 밀린 정리를 하기 좋아요.",
  ],
  overall: {
    bright: ["전체적으로 밝은 한 주예요.", "한 주 내내 기분 좋은 기운이 이어져요."],
    mixed: ["좋은 날과 쉬어 갈 날이 섞인 무난한 한 주예요.", "오르내림이 있지만 균형 잡힌 한 주예요."],
    dim: ["조금 조심스럽게 보내면 좋은 한 주예요.", "속도를 줄이고 나를 챙기면 좋은 한 주예요."],
  },
};

const DAYS = ["하루", "이틀", "사흘", "나흘", "닷새", "엿새", "이레"];

/** 이번 주: 가장 좋은 날 → 조심할(또는 쉬어 갈) 날 → 한 주 전체 */
function weekStory(cards: StoryCard[], seed: string): string {
  const scores = cards.map(scoreOf);
  const best = scores.indexOf(Math.max(...scores));
  const worst = scores.indexOf(Math.min(...scores));
  const bright = scores.filter((s) => s > 0).length;
  const overall = pick(WEEK.overall[bright >= 5 ? "bright" : bright >= 3 ? "mixed" : "dim"], `${seed}:week:overall`);

  if (best === worst) return `이번 주는 큰 기복 없이 고르게 흘러가요. ${overall}`;
  const fill = (template: string, i: number) =>
    template.replace(/\{([dcp])(?::([^}]+))?\}/g, (_, key: "d" | "c" | "p", pair?: string) => {
      const value = key === "d" ? cards[i].position.label : key === "c" ? cardLabel(cards[i].card) : phraseOf(cards[i]);
      return pair ? attach(value, pair) : value;
    });
  const bestText = fill(pick(WEEK.best, `${seed}:week:best`), best);
  const worstText = fill(pick(scores[worst] < 0 ? WEEK.caution : WEEK.calm, `${seed}:week:worst`), worst);
  const brightDays = bright === 0 ? "밝은 날은 없지만" : `${attach(DAYS[bright - 1], "이/가")} 밝은 흐름이라,`;
  return `${bestText} ${worstText} 일곱 날 중 ${brightDays} ${overall}`;
}

/** 카드들을 리더가 말하듯 이어지는 한 문단으로 엮는다. 같은 입력이면 항상 같은 문단. */
export function buildStory(spreadId: string, cards: StoryCard[], seed: string): string {
  if (spreadId === "week") return weekStory(cards, seed);
  if (spreadId === "choice") return choiceStory(cards, seed);
  return sequenceStory(spreadId, cards, seed);
}
