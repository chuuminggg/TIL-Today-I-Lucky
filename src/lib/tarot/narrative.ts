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
// 방향(upright/reversed)이나 카드 기운(positive/negative)에 따라 다른 틀을 쓸 수 있다.
type Templates = string[] | { upright: string[]; reversed: string[] } | { positive: string[]; negative: string[] };

const BY_LENS: Record<Exclude<Lens, "day">, Templates> = {
  core: ["지금 당신에게 가장 필요한 메시지는 {c:이/가} 전하는 {p:이에요/예요}.", "{c:은/는} 지금 당신에게 {p:을/를} 이야기하고 있어요."],
  past: ["지난 시간에는 {c:이/가} 보여 주는 {p:이/가} 있었어요.", "이 흐름은 {c}의 {p}에서 시작됐어요."],
  present: ["지금은 {c:이/가} 말하듯 {p}의 한가운데에 있어요.", "현재 당신은 {c}의 {p:을/를} 지나고 있어요."],
  future: ["앞으로는 {c:이/가} 보여 주듯 {p:이/가} 찾아올 수 있어요.", "머지않아 {c}의 {p:이/가} 다가오고 있어요."],
  outcome: ["이대로라면 {c:이/가} 가리키는 {p:으로/로} 이어질 수 있어요.", "흐름의 끝에는 {c}의 {p:이/가} 기다리고 있어요."],
  feeling: ["그 사람의 마음에는 {c:이/가} 보여 주는 {p:이/가} 자리하고 있을 수 있어요.", "상대의 마음은 지금 {c}의 {p}에 머물러 있을지도 몰라요."],
  obstacle: {
    // 정방향 카드도 장애물 자리에서는 "지나치면 문제가 되는 면"으로 읽는다
    upright: ["{c}의 {p:이/가} 지나치면 오히려 걸림돌이 될 수 있어요.", "{c:이/가} 보여 주는 {p:도/도} 과하면 발목을 잡을 수 있어요."],
    reversed: ["{c}의 {p:이/가} 앞길을 가로막고 있어요.", "걸림돌은 {c:이/가} 보여 주는 {p:이에요/예요}."],
  },
  advice: ["{c:이/가} 건네는 조언은 이래요. {a}", "{c}의 조언을 따라 보세요. {a}"],
  action: ["지금 해야 할 일은 {c:이/가} 알려 줘요. {a}", "{c}의 조언처럼 움직여 보세요. {a}"],
};

/** 같은 관점이라도 스프레드마다 더 어울리는 문장 — "스프레드id:포지션key" */
const BY_POSITION: Record<string, Templates> = {
  "relationship:me": ["당신의 마음은 {c}의 {p}에 가까워요.", "당신은 지금 {c:이/가} 보여 주는 {p:을/를} 품고 있어요."],
  "reunion:me": ["당신의 마음은 {c}의 {p}에 가까워요.", "당신은 지금 {c:이/가} 보여 주는 {p:을/를} 품고 있어요."],
  "relationship:now": ["두 사람 사이에는 지금 {c}의 {p:이/가} 흐르고 있어요.", "지금 둘의 관계에는 {c:이/가} 보여 주는 {p:이/가} 있어요."],
  "reunion:reason": {
    // 좋은 카드가 "헤어진 이유"에 나오면 "그것만으로는 부족했다"로 읽는다
    positive: ["두 사람 사이에는 {c}의 {p:이/가} 있었지만, 그것만으로는 관계를 지키기 어려웠어요.", "{c:이/가} 보여 주는 {p:이/가} 있었는데도 두 사람은 멀어졌어요."],
    negative: ["두 사람이 멀어진 데는 {c}의 {p:이/가} 컸어요.", "{c:이/가} 보여 주듯 {p:이/가} 두 사람 사이를 멀어지게 했어요."],
  },
  "reunion:chance": ["다시 이어질 가능성에는 {c}의 {p:이/가} 비치고 있어요.", "재회의 흐름 위에는 {c:이/가} 보여 주는 {p:이/가} 놓여 있어요."],
  "celtic-cross:root": ["이 모든 일의 뿌리에는 {c}의 {p:이/가} 있어요."],
  "celtic-cross:hope": ["마음 한편에서는 {c}의 {p:을/를} 바라면서도 두려워하고 있어요."],
};

/** 켈틱 크로스는 10문장이면 너무 길어 핵심 자리만 이야기로 엮는다 */
const SKIP = new Set(["celtic-cross:conscious", "celtic-cross:past", "celtic-cross:self", "celtic-cross:env"]);

const CONNECTORS = {
  advice: ["그러니", "그래서"],
  contrast: ["다만", "하지만"],
  up: ["다행히", "그래도"],
  down: ["그런데", "한편"],
  flat: ["그리고", "이어서"],
} as const;

/** "19. 태양" → "태양 카드" */
const cardLabel = (card: TarotCard) => `${card.name.replace(/^\d+\.\s*/, "")} 카드`;
const phraseOf = ({ card, reversed }: Pick<StoryCard, "card" | "reversed">) => PHRASES[card.id]?.[reversed ? 1 : 0] ?? card[reversed ? "reversed" : "upright"].keywords[0];
const scoreOf = (sc: StoryCard) => cardScore(sc.card, sc.reversed);

function render(template: string, sc: StoryCard): string {
  const values = { c: cardLabel(sc.card), p: phraseOf(sc), a: (sc.reversed ? sc.card.reversed : sc.card.upright).advice };
  return template.replace(/\{([cpa])(?::([^}]+))?\}/g, (_, key: "c" | "p" | "a", pair?: string) =>
    pair ? attach(values[key], pair) : values[key],
  );
}

function pick<T>(items: readonly T[], seed: string): T {
  return items[hashString(seed) % items.length];
}

function connectorFor(prev: StoryCard, current: StoryCard, used: Set<string>): string | null {
  const { lens } = current.position;
  const delta = scoreOf(current) - scoreOf(prev);
  const kind =
    lens === "advice" || lens === "action" ? "advice" : lens === "obstacle" ? "contrast" : delta >= 0.75 ? "up" : delta <= -0.75 ? "down" : "flat";
  const connector = CONNECTORS[kind].find((c) => !used.has(c)) ?? null;
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
    const sentence = render(pick(variants, `${seed}:${id}`), sc);
    const connector = prev ? connectorFor(prev, sc, used) : null;
    sentences.push(connector ? `${connector} ${sentence}` : sentence);
    prev = sc;
  }
  return sentences.join(" ");
}

/** 양자택일: 현재 → A의 흐름 → B의 흐름 → 어느 쪽이 밝은지 */
function choiceStory([now, a, aResult, b, bResult]: StoryCard[], seed: string): string {
  const path = (x: StoryCard, result: StoryCard) =>
    `${cardLabel(x.card)}의 ${attach(phraseOf(x), "을/를")} 지나 ${cardLabel(result.card)}의 ${attach(phraseOf(result), "으로/로")}`;
  const diff = scoreOf(a) + 2 * scoreOf(aResult) - (scoreOf(b) + 2 * scoreOf(bResult));
  const verdict =
    diff >= 1
      ? "카드만 보면 A 쪽 흐름이 더 밝아요."
      : diff <= -1
        ? "카드만 보면 B 쪽 흐름이 더 밝아요."
        : "두 길의 무게가 비슷해요. 마음이 더 끌리는 쪽을 믿어 보세요.";
  return [
    render(pick(BY_LENS.present as string[], `${seed}:choice:now`), now),
    `A를 택하면 ${path(a, aResult)} 이어지고, B를 택하면 ${path(b, bResult)} 이어져요.`,
    verdict,
  ].join(" ");
}

/** 이번 주: 가장 좋은 날 → 조심할(또는 쉬어 갈) 날 → 한 주 전체 */
function weekStory(cards: StoryCard[]): string {
  const scores = cards.map(scoreOf);
  const best = scores.indexOf(Math.max(...scores));
  const worst = scores.indexOf(Math.min(...scores));
  const bright = scores.filter((s) => s > 0).length;
  const overall = bright >= 5 ? "전체적으로 밝은 한 주예요." : bright >= 3 ? "좋은 날과 쉬어 갈 날이 섞인 무난한 한 주예요." : "조금 조심스럽게 보내면 좋은 한 주예요.";

  if (best === worst) return `이번 주는 큰 기복 없이 고르게 흘러가요. ${overall}`;
  const day = (i: number) => cards[i].position.label;
  const bestText = `이번 주 기운이 가장 좋은 날은 ${attach(day(best), "이에요/예요")}. ${cardLabel(cards[best].card)}의 ${attach(phraseOf(cards[best]), "이/가")} 함께해요.`;
  const worstText =
    scores[worst] < 0
      ? `${day(worst)}에는 ${cardLabel(cards[worst].card)}의 ${attach(phraseOf(cards[worst]), "을/를")} 조심하세요.`
      : `${attach(day(worst), "은/는")} 상대적으로 잔잔하니 무리하지 말고 쉬어 가세요.`;
  return `${bestText} ${worstText} 일곱 날 중 ${bright}일이 밝은 흐름이라, ${overall}`;
}

/** 카드들을 리더가 말하듯 이어지는 한 문단으로 엮는다. 같은 입력이면 항상 같은 문단. */
export function buildStory(spreadId: string, cards: StoryCard[], seed: string): string {
  if (spreadId === "week") return weekStory(cards);
  if (spreadId === "choice") return choiceStory(cards, seed);
  return sequenceStory(spreadId, cards, seed);
}
