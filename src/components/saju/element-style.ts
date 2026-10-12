import type { Element } from "saju-fortune";

/** 오행별 색 — 명식 표 글자와 오행 막대에 쓴다 */
export const ELEMENT_TEXT: Record<Element, string> = {
  wood: "text-emerald-700 dark:text-emerald-400",
  fire: "text-rose-600 dark:text-rose-400",
  earth: "text-amber-700 dark:text-amber-400",
  metal: "text-slate-600 dark:text-slate-300",
  water: "text-sky-700 dark:text-sky-400",
};

export const ELEMENT_BAR: Record<Element, string> = {
  wood: "bg-emerald-500",
  fire: "bg-rose-500",
  earth: "bg-amber-500",
  metal: "bg-slate-400",
  water: "bg-sky-500",
};
