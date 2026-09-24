import { seededRandom } from "@/lib/random";
import { TAROT_DECK, type CardSide, type TarotCard } from "./cards";

export interface DrawnCard {
  card: TarotCard;
  reversed: boolean;
  side: CardSide; // reversed에 맞는 쪽 해석
}

const REVERSED_RATE = 0.3;

const drawn = (card: TarotCard, reversed: boolean): DrawnCard => ({
  card,
  reversed,
  side: reversed ? card.reversed : card.upright,
});

/** 시드(사람+날짜)로 카드를 뽑는다. 같은 날 다시 뽑아도 같은 카드가 나온다. */
export function drawCards(seed: string, count = 1): DrawnCard[] {
  const random = seededRandom(`${seed}:tarot`);
  const deck = [...TAROT_DECK];
  const result: DrawnCard[] = [];
  for (let i = 0; i < count; i++) {
    const [card] = deck.splice(Math.floor(random() * deck.length), 1);
    result.push(drawn(card, random() < REVERSED_RATE));
  }
  return result;
}

/** 셔플된 78장. 사용자는 펼쳐진 자리(slot)를 고르고, 자리에 놓인 카드는 시드로 결정된다. */
export function shuffleDeck(seed: string, allowReversed = true): DrawnCard[] {
  const random = seededRandom(`${seed}:shuffle`);
  const deck = [...TAROT_DECK];
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  // 방향은 셔플 후 한 번에 정해 allowReversed와 무관하게 카드 배치가 같도록 한다
  return deck.map((card) => drawn(card, random() < REVERSED_RATE && allowReversed));
}

/** 같은 시드 + 같은 선택이면 항상 같은 카드 — 결과 재현·공유용 */
export function pickCards(seed: string, slots: number[], allowReversed = true): DrawnCard[] {
  const deck = shuffleDeck(seed, allowReversed);
  return slots.map((slot) => {
    const card = deck[slot];
    if (!card) throw new RangeError(`잘못된 카드 위치입니다: ${slot}`);
    return card;
  });
}
