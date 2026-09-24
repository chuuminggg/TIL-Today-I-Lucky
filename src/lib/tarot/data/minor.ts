import type { CardSide, Element, Suit } from "../types";

export const SUITS: Record<Suit, { name: string; nameEn: string; element: Element }> = {
  wands: { name: "완드", nameEn: "Wands", element: "fire" },
  cups: { name: "컵", nameEn: "Cups", element: "water" },
  swords: { name: "소드", nameEn: "Swords", element: "air" },
  pentacles: { name: "펜타클", nameEn: "Pentacles", element: "earth" },
};

export const RANKS = ["에이스", "2", "3", "4", "5", "6", "7", "8", "9", "10", "시종", "기사", "여왕", "왕"];
export const RANKS_EN = ["Ace", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Page", "Knight", "Queen", "King"];

/** 숫자(1–10)·궁정 카드(11–14)가 수트를 가리지 않고 공유하는 의미 — 스프레드 전체 분석에 쓴다 */
export const RANK_INFO: Array<{ theme: string }> = [
  { theme: "시작" },
  { theme: "균형과 선택" },
  { theme: "성장과 협력" },
  { theme: "안정" },
  { theme: "갈등과 변화" },
  { theme: "조화와 회복" },
  { theme: "도전과 성찰" },
  { theme: "움직임과 숙련" },
  { theme: "성숙과 절정" },
  { theme: "완성과 전환" },
  { theme: "배움과 소식" },
  { theme: "행동과 추진" },
  { theme: "포용과 성숙한 감정" },
  { theme: "통솔과 권위" },
];

/** 마이너 카드 한 장의 해석 — 수트 파일(wands.ts 등)에 에이스부터 왕까지 14개씩 */
export interface MinorSpec {
  person?: string; // 궁정 카드가 나타내는 인물
  caution: string;
  upright: CardSide;
  reversed: CardSide;
  combos?: { reinforce?: string[]; oppose?: string[] };
}
