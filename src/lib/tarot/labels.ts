import type { Element, YesNo } from "./types";

export const ELEMENT_LABEL: Record<Element, { name: string; emoji: string }> = {
  fire: { name: "불", emoji: "🔥" },
  water: { name: "물", emoji: "💧" },
  air: { name: "공기", emoji: "🌬️" },
  earth: { name: "흙", emoji: "🌱" },
};

export const YES_NO_LABEL: Record<YesNo, string> = { yes: "예", maybe: "애매", no: "아니오" };
