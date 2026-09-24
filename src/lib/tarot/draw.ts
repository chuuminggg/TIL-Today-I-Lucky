import { seededRandom } from "@/lib/random";
import { TAROT_DECK, type TarotCard } from "./cards";

export interface DrawnCard {
  card: TarotCard;
  reversed: boolean;
  keywords: string[];
  meaning: string;
}

const REVERSED_RATE = 0.3;

/** 시드(사람+날짜)로 카드를 뽑는다. 같은 날 다시 뽑아도 같은 카드가 나온다. */
export function drawCards(seed: string, count = 1): DrawnCard[] {
  const random = seededRandom(`${seed}:tarot`);
  const deck = [...TAROT_DECK];
  const drawn: DrawnCard[] = [];
  for (let i = 0; i < count; i++) {
    const [card] = deck.splice(Math.floor(random() * deck.length), 1);
    const reversed = random() < REVERSED_RATE;
    const side = reversed ? card.reversed : card.upright;
    drawn.push({ card, reversed, keywords: side.keywords, meaning: side.meaning });
  }
  return drawn;
}
