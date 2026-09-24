import type { TarotCard, YesNo } from "./types";

const YES_NO_SCORE: Record<YesNo, number> = { yes: 1, maybe: 0, no: -1 };

/** 카드 한 장의 기운 점수 (-1.25 ~ 1). 흐름 비교·예/아니오 판정·이야기 연결어에 쓴다 */
export const cardScore = (card: TarotCard, reversed: boolean) =>
  YES_NO_SCORE[(reversed ? card.reversed : card.upright).yesNo] - (reversed ? 0.25 : 0);
