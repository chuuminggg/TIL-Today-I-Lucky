import type { Element } from "saju-fortune";
import { analyze, compatibility, type BirthProfile } from "./adapter";
import {
  DAY_BRANCH_TEXT,
  DAY_MASTER_TEXT,
  PARTNER_ROLE,
  RELATION_TIPS,
  RELATION_TYPES,
  ZODIAC_TEXT,
  type RelationType,
} from "./detail-text";
import {
  BRANCHES,
  branchIndexByKo,
  branchRelations,
  controls,
  ELEMENT_KO,
  generates,
  stemByKo,
  tenGodOf,
  type BranchRelation,
  type TenGod,
} from "./ganji";

export interface CompatPerson {
  nickname: string;
  dayMaster: { ko: string; hanja: string; element: Element; image: string };
  pillars: string[]; // 연·월·일·시 한자 (시 모르면 "??")
  animal: string; // 띠
  dominant: string[];
  weak: string[];
}

export interface CompatDetail {
  relation: RelationType;
  score: number;
  headline: string;
  people: [CompatPerson, CompatPerson];
  roles: { meToPartner: { tenGod: TenGod; text: string }; partnerToMe: { tenGod: TenGod; text: string } };
  elementBond: string; // 두 일간 오행의 관계
  dayBranch: { relations: BranchRelation[]; text: string };
  zodiac: { text: string };
  complement: string[]; // 서로 부족한 오행을 채워 주는 부분
  goods: string[];
  cautions: string[];
  tips: string[];
  focusAreas: string[];
  limitations: string[];
}

function headlineOf(score: number) {
  if (score >= 85) return "서로를 크게 채워 주는 궁합이에요";
  if (score >= 70) return "잘 맞는 부분이 많은 궁합이에요";
  if (score >= 58) return "노력하면 잘 맞춰 갈 수 있는 궁합이에요";
  return "서로의 다름을 배워 가는 궁합이에요";
}

function elementBond(me: Element, partner: Element) {
  const [m, p] = [`${ELEMENT_KO[me]} 기운`, `${ELEMENT_KO[partner]} 기운`];
  if (me === partner) return `두 사람 모두 ${m}의 일간이라 기본 성향이 닮아 금방 편해져요.`;
  if (generates(me, partner)) return `내 ${m}이 상대의 ${p}을 북돋아 주는 상생 관계예요. 내가 먼저 챙겨 줄 때 관계가 잘 풀려요.`;
  if (generates(partner, me)) return `상대의 ${p}이 내 ${m}을 북돋아 주는 상생 관계예요. 상대에게서 힘을 얻기 쉬워요.`;
  if (controls(me, partner)) return `내 ${m}이 상대의 ${p}을 다스리는 상극 관계예요. 내가 주도하기 쉬우니 상대의 속도를 존중해 주세요.`;
  return `상대의 ${p}이 내 ${m}을 다스리는 상극 관계예요. 상대의 방식에 눌리지 않도록 내 생각을 분명히 말해 주세요.`;
}

const pick = (relations: BranchRelation[]): BranchRelation | "none" =>
  (["육합", "삼합", "충", "형"] as const).find((r) => relations.includes(r)) ?? "none";

export function getCompatDetail(
  me: BirthProfile & { name?: string },
  partner: BirthProfile & { name?: string },
  relation: RelationType,
): CompatDetail {
  const base = compatibility(me, partner);
  const [a, b] = [analyze(me), analyze(partner)];
  const [dmA, dmB] = [stemByKo(a.pillars.day.stem), stemByKo(b.pillars.day.stem)];

  const person = (saju: typeof a, nickname: string): CompatPerson => {
    const dm = stemByKo(saju.pillars.day.stem);
    return {
      nickname,
      dayMaster: { ko: dm.ko, hanja: dm.hanja, element: dm.element, image: DAY_MASTER_TEXT[dm.ko].image },
      pillars: [saju.pillars.year, saju.pillars.month, saju.pillars.day, saju.pillars.hour].map((p) => p?.hanja ?? "??"),
      animal: BRANCHES[branchIndexByKo(saju.pillars.year.branch)].animal,
      dominant: saju.dominantElements.map((e) => ELEMENT_KO[e]),
      weak: saju.weakElements.map((e) => ELEMENT_KO[e]),
    };
  };

  const meToPartner = tenGodOf(dmA, dmB); // 나에게 상대는
  const partnerToMe = tenGodOf(dmB, dmA); // 상대에게 나는
  const dayRelations = branchRelations(branchIndexByKo(a.pillars.day.branch), branchIndexByKo(b.pillars.day.branch));
  const yearA = branchIndexByKo(a.pillars.year.branch);
  const yearB = branchIndexByKo(b.pillars.year.branch);
  const zodiacKey = yearA === yearB ? "same" : pick(branchRelations(yearA, yearB));

  const fills = (from: typeof a, to: typeof b) => to.weakElements.filter((e) => from.dominantElements.includes(e));
  const partnerFillsMe = fills(b, a);
  const meFillsPartner = fills(a, b);
  const complement = [
    ...partnerFillsMe.map((e) => `내게 부족한 ${ELEMENT_KO[e]} 기운을 상대가 채워 줘요.`),
    ...meFillsPartner.map((e) => `상대에게 부족한 ${ELEMENT_KO[e]} 기운을 내가 채워 줘요.`),
  ];
  const shared = a.dominantElements.filter((e) => b.dominantElements.includes(e));

  const goods: string[] = [...complement];
  const cautions: string[] = [];
  if (dayRelations.includes("육합") || dayRelations.includes("삼합")) goods.push(DAY_BRANCH_TEXT[pick(dayRelations)]);
  if (dayRelations.includes("충") || dayRelations.includes("형")) cautions.push(DAY_BRANCH_TEXT[dayRelations.includes("충") ? "충" : "형"]);
  if (dmA.element === dmB.element || generates(dmA.element, dmB.element) || generates(dmB.element, dmA.element)) {
    goods.push("두 사람의 중심 기운이 서로를 북돋는 관계라 함께 있을 때 힘이 나요.");
  } else {
    cautions.push("두 사람의 중심 기운이 서로를 누르는 관계라, 한쪽이 주도권을 쥐지 않도록 균형을 맞춰 주세요.");
  }
  if (shared.length) {
    goods.push(`둘 다 ${shared.map((e) => ELEMENT_KO[e]).join("·")} 기운이 강해 공감대를 찾기 쉬워요.`);
    cautions.push("강한 기운이 같아 고집이 부딪힐 때는 한 발씩 물러나는 약속을 정해 두세요.");
  }
  if (meToPartner === "겁재" || meToPartner === "편관" || meToPartner === "상관") cautions.push(PARTNER_ROLE[meToPartner].split(" — ")[1]);
  if (goods.length === 0) goods.push("기운이 서로 달라 배울 점이 많은 관계예요.");
  if (cautions.length === 0) cautions.push("표현 방식이 달라 생기는 오해는 추측하지 말고 대화로 확인하세요.");

  const limitations = [...new Set([...a.limitations, ...b.limitations])];
  if (!me.birthTime || !partner.birthTime) limitations.push("태어난 시간을 모르는 사람이 있어 시주를 뺀 궁합이에요.");

  return {
    relation,
    score: base.score,
    headline: headlineOf(base.score),
    people: [person(a, me.name || "나"), person(b, partner.name || "상대")],
    roles: {
      meToPartner: { tenGod: meToPartner, text: PARTNER_ROLE[meToPartner] },
      partnerToMe: { tenGod: partnerToMe, text: PARTNER_ROLE[partnerToMe] },
    },
    elementBond: elementBond(dmA.element, dmB.element),
    dayBranch: { relations: dayRelations, text: DAY_BRANCH_TEXT[pick(dayRelations)] },
    zodiac: { text: ZODIAC_TEXT[zodiacKey] },
    complement,
    goods: goods.slice(0, 3),
    cautions: cautions.slice(0, 3),
    tips: RELATION_TIPS[relation],
    focusAreas: base.focusAreas,
    limitations,
  };
}

export const relationLabel = (r: RelationType) => RELATION_TYPES[r].label;
