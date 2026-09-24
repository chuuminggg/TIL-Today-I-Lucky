export type Suit = "wands" | "cups" | "swords" | "pentacles";
export type Element = "fire" | "water" | "air" | "earth";
export type YesNo = "yes" | "maybe" | "no";

/** 정방향 또는 역방향 한쪽의 해석 */
export interface CardSide {
  keywords: string[];
  meaning: string; // 일반 의미 (오늘의 타로·기본 해석)
  love: string; // 연애운
  feeling: string; // 상대의 속마음 포지션
  career: string; // 직업·학업운
  money: string; // 금전운
  advice: string;
  yesNo: YesNo;
}

export interface TarotCard {
  id: string; // "major-0", "wands-1" …
  slug: string; // "the-fool", "ace-of-wands" — 카드 사전·이미지 파일명
  name: string; // 한국어 이름
  nameEn: string;
  arcana: "major" | "minor";
  suit?: Suit;
  number: number; // 메이저 0–21, 마이너 1–14 (11 시종, 12 기사, 13 여왕, 14 왕)
  element: Element; // 메이저는 대응 점성술, 마이너는 수트 기준
  person?: string; // 궁정 카드(시종·기사·여왕·왕)가 나타내는 인물
  caution: string; // 장애물 포지션에서 정방향이어도 쓰는 "주의할 점"
  upright: CardSide;
  reversed: CardSide;
  combos: { reinforce: string[]; oppose: string[] }; // 함께 나오면 의미가 강해지는/부딪히는 카드 id
}
