import { MAJORS } from "./data/major";
import { MINOR_KEYWORDS, MINOR_YES_NO_OVERRIDES, RANK_INFO, RANKS, RANKS_EN, SUITS } from "./data/minor";
import type { CardSide, Suit, TarotCard, YesNo } from "./types";

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
    symbol: spec.symbol,
    caution: spec.caution,
    upright: spec.upright,
    reversed: spec.reversed,
    combos: spec.combos,
    detailed: true,
  }));
}

// 역방향은 정방향의 판정을 한 단계 낮춘다 (단, 부정적 카드의 역방향은 회복의 의미라 "애매"로)
const REVERSED_YES_NO: Record<YesNo, YesNo> = { yes: "no", maybe: "no", no: "maybe" };

const quoted = (keywords: string[]) => `'${keywords.join("·")}'`;

/** 마이너 카드는 수트(영역) × 숫자·궁정(단계) × 키워드를 조합해 해석한다 */
function buildMinors(): TarotCard[] {
  return (Object.keys(SUITS) as Suit[]).flatMap((suit) => {
    const info = SUITS[suit];
    return MINOR_KEYWORDS[suit].map(([upKeywords, revKeywords], index): TarotCard => {
      const number = index + 1;
      const id = `${suit}-${number}`;
      const rank = RANK_INFO[index];
      const uprightYesNo = MINOR_YES_NO_OVERRIDES[id] ?? rank.yesNo;
      const persona = rank.person ? `상대는 ${rank.person}의 모습으로 다가오고 있어요. ` : "";

      const side = (keywords: string[], dir: "upright" | "reversed", yesNo: YesNo): CardSide => {
        const lines = rank[dir];
        const mood = `${quoted(keywords)}의 기운 속에서`;
        return {
          keywords,
          meaning: `${info.theme}의 영역에서 ${quoted(keywords)}의 기운이 흐릅니다. ${lines.general}`,
          love: `${mood} ${lines.love}`,
          feeling: `${persona}마음속에는 ${info.feeling}과 함께 ${quoted(keywords)}의 감정이 자리하고 있어요.`,
          career: `${mood} ${lines.career}`,
          money: `${mood} ${lines.money}`,
          advice: info.advice[dir],
          yesNo,
        };
      };

      return {
        id,
        slug: `${RANKS_EN[index].toLowerCase()}-of-${suit}`,
        name: `${info.name} ${RANKS[index]}`,
        nameEn: `${RANKS_EN[index]} of ${info.nameEn}`,
        arcana: "minor",
        suit,
        number,
        element: info.element,
        symbol: info.symbol,
        caution: `${quoted(revKeywords)} 쪽으로 기울지 않도록 주의하세요.`,
        upright: side(upKeywords, "upright", uprightYesNo),
        reversed: side(revKeywords, "reversed", REVERSED_YES_NO[uprightYesNo]),
        combos: { reinforce: [], oppose: [] },
        detailed: false,
      };
    });
  });
}

/** 순서를 바꾸면 오늘의 타로(시드 뽑기) 결과가 바뀌므로 메이저 → 완드 → 컵 → 소드 → 펜타클 순서를 유지한다 */
export const TAROT_DECK: TarotCard[] = [...buildMajors(), ...buildMinors()];

const BY_ID = new Map(TAROT_DECK.map((card) => [card.id, card]));
export const cardById = (id: string) => BY_ID.get(id);
