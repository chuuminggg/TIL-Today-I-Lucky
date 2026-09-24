import { josa } from "@/lib/josa";
import { RANK_INFO, SUITS } from "./data/minor";
import { pickCards, type DrawnCard } from "./draw";
import { spreadById, type Lens, type SpreadPosition, type Topic } from "./spreads";
import type { Element, Suit, TarotCard, YesNo } from "./types";

export interface ReadingRequest {
  topic: Topic;
  question?: string;
  spreadId: string;
  seed: string;
  picks: number[]; // 펼친 78장 중 고른 자리, 고른 순서 = 포지션 순서
  allowReversed?: boolean;
}

export interface ReadingCard {
  position: SpreadPosition;
  card: TarotCard;
  reversed: boolean;
  keywords: string[];
  text: string; // 포지션 관점 × 주제로 고른 해석
}

export type InsightKind = "major" | "suit" | "element" | "number" | "court" | "reversed" | "combo" | "flow";

export interface Insight {
  kind: InsightKind;
  text: string;
}

export interface Verdict {
  answer: YesNo;
  label: string;
  text: string;
  score: number; // -1(아니오) ~ 1(예)
}

export interface Reading {
  topic: Topic;
  question?: string;
  spread: { id: string; name: string };
  seed: string;
  picks: number[];
  allowReversed: boolean;
  cards: ReadingCard[];
  insights: Insight[];
  verdict?: Verdict;
  summary: { title: string; text: string };
  advice: string;
}

type TopicField = "meaning" | "love" | "career" | "money";

const TOPIC_FIELD: Record<Topic, TopicField> = {
  today: "meaning",
  love: "love",
  crush: "love",
  reunion: "love",
  career: "career",
  money: "money",
  study: "career",
  relationship: "meaning",
  yesno: "meaning",
  free: "meaning",
};

export const direction = (reversed: boolean) => (reversed ? "역방향" : "정방향");

function cardText(lens: Lens, topic: Topic, { card, reversed, side }: DrawnCard): string {
  const topical = side[TOPIC_FIELD[topic]];
  switch (lens) {
    case "feeling":
      return side.feeling;
    case "obstacle":
      // 정방향 카드도 장애물 자리에서는 "지나치면 문제가 되는 면"으로 읽는다
      return reversed ? topical : card.caution;
    case "advice":
    case "action":
      return side.advice;
    case "day":
      return side.meaning;
    default:
      return topical;
  }
}

const YES_NO_SCORE: Record<YesNo, number> = { yes: 1, maybe: 0, no: -1 };
const score = (d: DrawnCard) => YES_NO_SCORE[d.side.yesNo] - (d.reversed ? 0.25 : 0);

const SUIT_INSIGHT: Record<Suit, string> = {
  wands: "열정과 행동의 기운이 강해요. 망설이기보다 움직일 때예요.",
  cups: "감정과 관계가 이 문제의 중심이에요. 마음을 들여다보는 것이 답이 됩니다.",
  swords: "생각과 갈등이 많은 흐름이에요. 머릿속 걱정을 말이나 글로 정리해 보세요.",
  pentacles: "돈·일·몸 같은 현실적인 문제가 핵심이에요. 구체적인 계획이 도움이 됩니다.",
};

const ELEMENT_KO: Record<Element, string> = { fire: "🔥불", water: "💧물", air: "🌬️공기", earth: "🌱흙" };

/** 원소 상성(Elemental Dignities): 불↔물, 공기↔흙은 부딪히고 불↔공기, 물↔흙은 돕는다 */
function elementRelation(a: Element, b: Element): "support" | "conflict" | "neutral" {
  if (a === b) return "support";
  const pair = [a, b].sort().join("-");
  if (pair === "fire-water" || pair === "air-earth") return "conflict";
  if (pair === "air-fire" || pair === "earth-water") return "support";
  return "neutral";
}

function analyze(drawn: DrawnCard[], positions: SpreadPosition[], spreadId: string): Insight[] {
  const insights: Insight[] = [];
  const total = drawn.length;
  if (total < 2) return insights;

  const majors = drawn.filter((d) => d.card.arcana === "major").length;
  if (total >= 3 && majors / total >= 0.5) {
    insights.push({ kind: "major", text: `메이저 아르카나가 ${majors}장이에요. 개인의 노력을 넘어선 큰 흐름이 움직이는, 전환점이 될 수 있는 시기예요.` });
  } else if (total >= 3 && majors === 0) {
    insights.push({ kind: "major", text: "모두 마이너 아르카나예요. 일상의 선택과 노력으로 충분히 바꿀 수 있는 문제예요." });
  }

  const suitCounts = new Map<Suit, number>();
  for (const { card } of drawn) if (card.suit) suitCounts.set(card.suit, (suitCounts.get(card.suit) ?? 0) + 1);
  const [topSuit, topCount] = [...suitCounts].sort((a, b) => b[1] - a[1])[0] ?? [];
  const tied = [...suitCounts.values()].filter((n) => n === topCount).length > 1;
  if (topSuit && topCount >= 2 && topCount / total >= 0.4 && !tied) {
    insights.push({ kind: "suit", text: `${SUITS[topSuit].name} 카드가 ${topCount}장 — ${SUIT_INSIGHT[topSuit]}` });
  }

  if (total >= 3) {
    let support = 0;
    let conflict: [Element, Element] | null = null;
    let conflicts = 0;
    for (let i = 1; i < total; i++) {
      const a = drawn[i - 1].card.element;
      const b = drawn[i].card.element;
      const relation = elementRelation(a, b);
      if (relation === "support") support++;
      if (relation === "conflict") {
        conflicts++;
        conflict ??= [a, b];
      }
    }
    if (conflict && conflicts > support) {
      insights.push({ kind: "element", text: `${josa(ELEMENT_KO[conflict[0]], "과", "와")} ${ELEMENT_KO[conflict[1]]}처럼 서로 부딪히는 기운이 이어져 있어요. 마음과 상황이 엇갈리기 쉬우니 한쪽으로 치우치지 않게 조율하세요.` });
    } else if (support > conflicts && support >= total - 1) {
      insights.push({ kind: "element", text: "카드들의 기운이 서로 돕고 있어 흐름이 매끄러워요." });
    }
  }

  const numberCounts = new Map<number, number>();
  for (const { card } of drawn) if (card.arcana === "minor" && card.number <= 10) numberCounts.set(card.number, (numberCounts.get(card.number) ?? 0) + 1);
  for (const [n, count] of numberCounts) {
    if (count >= 2) insights.push({ kind: "number", text: `${n === 1 ? "에이스" : `숫자 ${n} 카드`}가 ${count}장 — '${RANK_INFO[n - 1].theme}'의 흐름이 반복되고 있어요.` });
  }

  const courts = drawn.filter((d) => d.card.person);
  if (courts.length >= 2) {
    insights.push({ kind: "court", text: `궁정 카드가 ${courts.length}장이에요. 주변 사람들의 영향이 큰 상황이에요.` });
  } else if (courts.length === 1) {
    const { card, reversed, side } = courts[0];
    const shadow = reversed ? ` 다만 역방향이라 '${side.keywords.join("·")}' 같은 모습으로 나타날 수 있어요.` : "";
    insights.push({ kind: "court", text: `${card.name} — ${josa(card.person!, "이", "가")} 이 일에 영향을 줄 수 있어요.${shadow}` });
  }

  if (total >= 3) {
    const reversed = drawn.filter((d) => d.reversed).length;
    if (reversed / total >= 0.5) {
      insights.push({ kind: "reversed", text: `역방향이 ${reversed}장이에요. 막힘이나 지연이 있거나, 문제를 내 안에서부터 살펴야 할 때예요.` });
    } else if (reversed === 0) {
      insights.push({ kind: "reversed", text: "모든 카드가 정방향이에요. 에너지가 막힘 없이 흐르고 있어요." });
    }
  }

  for (let i = 0; i < total; i++) {
    for (let j = i + 1; j < total; j++) {
      const a = drawn[i].card;
      const b = drawn[j].card;
      const has = (kind: "reinforce" | "oppose") => a.combos[kind].includes(b.id) || b.combos[kind].includes(a.id);
      if (has("reinforce")) {
        insights.push({ kind: "combo", text: `${josa(a.name, "과", "와")} ${josa(b.name, "이", "가")} 함께 나왔어요. 서로의 의미를 강하게 뒷받침해요.` });
      } else if (has("oppose")) {
        insights.push({ kind: "combo", text: `${josa(a.name, "과", "와")} ${josa(b.name, "은", "는")} 서로 반대 방향을 가리켜요. 두 힘 사이의 균형이 관건이에요.` });
      }
    }
  }

  if (spreadId === "week") {
    const scores = drawn.map(score);
    const best = scores.indexOf(Math.max(...scores));
    const worst = scores.indexOf(Math.min(...scores));
    if (best !== worst) {
      insights.push({ kind: "flow", text: `기운이 가장 좋은 날은 ${positions[best].label}, 조심할 날은 ${positions[worst].label}이에요.` });
    }
  } else {
    const start = positions.findIndex((p) => p.lens === "past" || p.lens === "present");
    const end = positions.findLastIndex((p) => p.lens === "outcome" || p.lens === "future");
    if (start !== -1 && end > start) {
      const delta = score(drawn[end]) - score(drawn[start]);
      if (delta >= 1) insights.push({ kind: "flow", text: "뒤로 갈수록 나아지는 흐름이에요. 지금의 어려움은 지나갑니다." });
      else if (delta <= -1) insights.push({ kind: "flow", text: "지금보다 뒤로 갈수록 조정이 필요한 흐름이에요. 좋을 때 미리 대비해 두세요." });
    }
  }

  return insights;
}

const VERDICT: Record<YesNo, { label: string; text: string }> = {
  yes: { label: "예", text: "긍정적인 흐름이에요. 마음먹은 대로 움직여 보세요." },
  maybe: { label: "아직 몰라요", text: "아직 정해지지 않았어요. 당신의 선택과 행동에 따라 달라질 수 있어요." },
  no: { label: "아니오", text: "지금은 쉽지 않은 흐름이에요. 시기나 방법을 바꿔 보는 것이 좋아요." },
};

function verdictOf(drawn: DrawnCard[], positions: SpreadPosition[]): Verdict {
  let sum = 0;
  let weight = 0;
  drawn.forEach((d, i) => {
    const w = positions[i].lens === "outcome" ? 2 : 1; // 결과 카드에 가중치
    sum += score(d) * w;
    weight += w;
  });
  const value = Math.max(-1, Math.min(1, sum / weight));
  const answer: YesNo = value > 0.3 ? "yes" : value < -0.3 ? "no" : "maybe";
  return { answer, score: Math.round(value * 100) / 100, ...VERDICT[answer] };
}

export function interpretReading(request: ReadingRequest): Reading {
  const spread = spreadById(request.spreadId);
  if (!spread) throw new Error("알 수 없는 스프레드입니다.");
  if (request.picks.length !== spread.positions.length) {
    throw new Error(`${josa(spread.name, "은", "는")} 카드 ${spread.positions.length}장을 골라야 합니다.`);
  }
  if (new Set(request.picks).size !== request.picks.length) throw new Error("같은 카드를 두 번 고를 수 없습니다.");

  const allowReversed = request.allowReversed ?? true;
  const drawn = pickCards(request.seed, request.picks, allowReversed);
  const { positions } = spread;

  const cards: ReadingCard[] = drawn.map((d, i) => ({
    position: positions[i],
    card: d.card,
    reversed: d.reversed,
    keywords: d.side.keywords,
    text: cardText(positions[i].lens, request.topic, d),
  }));

  // 결론 카드: 결과 → 핵심 → 마지막 카드 순. 주간 스프레드는 기운이 가장 좋은 날
  const scores = drawn.map(score);
  const keyIndex =
    spread.id === "week"
      ? scores.indexOf(Math.max(...scores))
      : [positions.findLastIndex((p) => p.lens === "outcome"), positions.findIndex((p) => p.lens === "core"), cards.length - 1].find((i) => i !== -1)!;
  const key = cards[keyIndex];
  const adviceIndex = positions.findIndex((p) => p.lens === "advice" || p.lens === "action");

  const wantsVerdict = request.topic === "yesno" || spread.id === "yes-no";

  return {
    topic: request.topic,
    question: request.question?.trim() || undefined,
    spread: { id: spread.id, name: spread.name },
    seed: request.seed,
    picks: request.picks,
    allowReversed,
    cards,
    insights: analyze(drawn, positions, spread.id),
    verdict: wantsVerdict ? verdictOf(drawn, positions) : undefined,
    summary: {
      title: `${key.position.label} · ${key.card.name} ${direction(key.reversed)}`,
      text: key.text,
    },
    advice: drawn[adviceIndex === -1 ? keyIndex : adviceIndex].side.advice,
  };
}
