import type { Element } from "saju-fortune";

type YinYang = "yin" | "yang";

export interface Stem {
  ko: string;
  hanja: string;
  element: Element;
  yinYang: YinYang;
}

export interface Branch {
  ko: string;
  hanja: string;
  animal: string;
  element: Element;
}

export const STEMS: Stem[] = [
  { ko: "갑", hanja: "甲", element: "wood", yinYang: "yang" },
  { ko: "을", hanja: "乙", element: "wood", yinYang: "yin" },
  { ko: "병", hanja: "丙", element: "fire", yinYang: "yang" },
  { ko: "정", hanja: "丁", element: "fire", yinYang: "yin" },
  { ko: "무", hanja: "戊", element: "earth", yinYang: "yang" },
  { ko: "기", hanja: "己", element: "earth", yinYang: "yin" },
  { ko: "경", hanja: "庚", element: "metal", yinYang: "yang" },
  { ko: "신", hanja: "辛", element: "metal", yinYang: "yin" },
  { ko: "임", hanja: "壬", element: "water", yinYang: "yang" },
  { ko: "계", hanja: "癸", element: "water", yinYang: "yin" },
];

export const BRANCHES: Branch[] = [
  { ko: "자", hanja: "子", animal: "쥐", element: "water" },
  { ko: "축", hanja: "丑", animal: "소", element: "earth" },
  { ko: "인", hanja: "寅", animal: "호랑이", element: "wood" },
  { ko: "묘", hanja: "卯", animal: "토끼", element: "wood" },
  { ko: "진", hanja: "辰", animal: "용", element: "earth" },
  { ko: "사", hanja: "巳", animal: "뱀", element: "fire" },
  { ko: "오", hanja: "午", animal: "말", element: "fire" },
  { ko: "미", hanja: "未", animal: "양", element: "earth" },
  { ko: "신", hanja: "申", animal: "원숭이", element: "metal" },
  { ko: "유", hanja: "酉", animal: "닭", element: "metal" },
  { ko: "술", hanja: "戌", animal: "개", element: "earth" },
  { ko: "해", hanja: "亥", animal: "돼지", element: "water" },
];

export const ELEMENT_KO: Record<Element, string> = {
  wood: "목(木)",
  fire: "화(火)",
  earth: "토(土)",
  metal: "금(金)",
  water: "수(水)",
};

export const ELEMENT_HANJA: Record<Element, string> = { wood: "木", fire: "火", earth: "土", metal: "金", water: "水" };

const CYCLE: Element[] = ["wood", "fire", "earth", "metal", "water"];

/** a가 b를 생(生)하는가 — 목→화→토→금→수→목 */
export const generates = (a: Element, b: Element) => CYCLE[(CYCLE.indexOf(a) + 1) % 5] === b;
/** a가 b를 극(剋)하는가 — 목→토→수→화→금→목 */
export const controls = (a: Element, b: Element) => CYCLE[(CYCLE.indexOf(a) + 2) % 5] === b;

export type TenGod =
  | "비견" | "겁재"
  | "식신" | "상관"
  | "편재" | "정재"
  | "편관" | "정관"
  | "편인" | "정인";

export type TenGodGroup = "비겁" | "식상" | "재성" | "관성" | "인성";

/** 일간(dayMaster) 기준으로 다른 천간(target)의 십신을 판정한다. 음양이 같으면 편(偏), 다르면 정(正). */
export function tenGodOf(
  dayMaster: { element: Element; yinYang: YinYang },
  target: { element: Element; yinYang: YinYang },
): TenGod {
  const same = dayMaster.yinYang === target.yinYang;
  const dm = dayMaster.element;
  const t = target.element;
  if (dm === t) return same ? "비견" : "겁재";
  if (generates(dm, t)) return same ? "식신" : "상관";
  if (controls(dm, t)) return same ? "편재" : "정재";
  if (controls(t, dm)) return same ? "편관" : "정관";
  return same ? "편인" : "정인";
}

export const TEN_GOD_GROUP: Record<TenGod, TenGodGroup> = {
  비견: "비겁", 겁재: "비겁",
  식신: "식상", 상관: "식상",
  편재: "재성", 정재: "재성",
  편관: "관성", 정관: "관성",
  편인: "인성", 정인: "인성",
};

// 지지 육합: 자축·인해·묘술·진유·사신·오미
const SIX_HARMONY: Array<[number, number]> = [[0, 1], [2, 11], [3, 10], [4, 9], [5, 8], [6, 7]];

export const isHarmony = (a: number, b: number) =>
  SIX_HARMONY.some(([x, y]) => (x === a && y === b) || (x === b && y === a));

/** 지지 충: 정반대(6칸 차이) */
export const isClash = (a: number, b: number) => Math.abs(a - b) === 6;
