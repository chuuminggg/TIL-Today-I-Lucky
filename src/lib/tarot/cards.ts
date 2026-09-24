import { CUPS } from "./data/cups";
import { MAJORS } from "./data/major";
import { RANKS, RANKS_EN, SUITS, type MinorSpec } from "./data/minor";
import { PENTACLES } from "./data/pentacles";
import { SWORDS } from "./data/swords";
import { WANDS } from "./data/wands";
import type { Suit, TarotCard } from "./types";

export type { CardSide, Element, Suit, TarotCard, YesNo } from "./types";

function buildMajors(): TarotCard[] {
  return MAJORS.map((spec, index) => ({
    id: `major-${index}`,
    slug: spec.slug,
    name: `${index}. ${spec.name}`,
    nameEn: spec.nameEn,
    arcana: "major",
    number: index,
    element: spec.element,
    caution: spec.caution,
    upright: spec.upright,
    reversed: spec.reversed,
    combos: spec.combos,
  }));
}

const MINORS: Record<Suit, MinorSpec[]> = { wands: WANDS, cups: CUPS, swords: SWORDS, pentacles: PENTACLES };

function buildMinors(): TarotCard[] {
  return (Object.keys(SUITS) as Suit[]).flatMap((suit) => {
    const info = SUITS[suit];
    return MINORS[suit].map((spec, index): TarotCard => ({
      id: `${suit}-${index + 1}`,
      slug: `${RANKS_EN[index].toLowerCase()}-of-${suit}`,
      name: `${info.name} ${RANKS[index]}`,
      nameEn: `${RANKS_EN[index]} of ${info.nameEn}`,
      arcana: "minor",
      suit,
      number: index + 1,
      element: info.element,
      person: spec.person,
      caution: spec.caution,
      upright: spec.upright,
      reversed: spec.reversed,
      combos: { reinforce: spec.combos?.reinforce ?? [], oppose: spec.combos?.oppose ?? [] },
    }));
  });
}

/** 순서를 바꾸면 오늘의 타로(시드 뽑기) 결과가 바뀌므로 메이저 → 완드 → 컵 → 소드 → 펜타클 순서를 유지한다 */
export const TAROT_DECK: TarotCard[] = [...buildMajors(), ...buildMinors()];

const BY_ID = new Map(TAROT_DECK.map((card) => [card.id, card]));
export const cardById = (id: string) => BY_ID.get(id);
