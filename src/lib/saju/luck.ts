import type { Element } from "saju-fortune";
import { pick, seededRandom } from "@/lib/random";
import { ELEMENT_KO } from "./ganji";

export interface LuckyItems {
  element: Element;
  elementKo: string;
  color: string;
  colorHex: string;
  numbers: number[];
  direction: string;
  time: string;
  item: string;
}

const LUCK_TABLE: Record<
  Element,
  { colors: Array<[string, string]>; numbers: [number, number]; direction: string; time: string; items: string[] }
> = {
  wood: {
    colors: [["초록", "#3f9b5a"], ["민트", "#5cc8a8"], ["청록", "#1f8a8a"]],
    numbers: [3, 8],
    direction: "동쪽",
    time: "아침 (06–09시)",
    items: ["작은 화분", "나무 소재 소품", "녹차 한 잔", "종이책"],
  },
  fire: {
    colors: [["빨강", "#d9463b"], ["코랄", "#f07a5f"], ["보라", "#8a5cc8"]],
    numbers: [2, 7],
    direction: "남쪽",
    time: "한낮 (11–14시)",
    items: ["향초", "붉은색 소품", "따뜻한 음료", "선글라스"],
  },
  earth: {
    colors: [["노랑", "#e0b43a"], ["베이지", "#c9ad85"], ["브라운", "#8a6445"]],
    numbers: [5, 10],
    direction: "중앙",
    time: "오후 (14–17시)",
    items: ["도자기 머그", "가죽 소품", "곡물 간식", "손수건"],
  },
  metal: {
    colors: [["흰색", "#e9e9e4"], ["실버", "#a9b0b8"], ["골드", "#c8a24a"]],
    numbers: [4, 9],
    direction: "서쪽",
    time: "저녁 (17–20시)",
    items: ["금속 액세서리", "손목시계", "흰 셔츠", "동전 지갑"],
  },
  water: {
    colors: [["네이비", "#2c3e6b"], ["검정", "#222222"], ["하늘색", "#6fa8dc"]],
    numbers: [1, 6],
    direction: "북쪽",
    time: "밤 (21–24시)",
    items: ["물 한 병", "검은 펜", "우산", "향수"],
  },
};

/** 용신 오행에 맞춘 행운 요소. 색·아이템은 날짜 시드로 돌려 매일 조금씩 달라지게 한다. */
export function luckyItems(element: Element, seed: string): LuckyItems {
  const random = seededRandom(`${seed}:luck`);
  const entry = LUCK_TABLE[element];
  const [color, colorHex] = pick(entry.colors, random);
  return {
    element,
    elementKo: ELEMENT_KO[element],
    color,
    colorHex,
    numbers: entry.numbers,
    direction: entry.direction,
    time: entry.time,
    item: pick(entry.items, random),
  };
}
