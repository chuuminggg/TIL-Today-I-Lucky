import { attach } from "@/lib/josa";
import { hashString } from "@/lib/random";
import type { TenGod } from "./ganji";

// 오늘의 운세 이야기 문단 — 십신 × 신강약 궁합 × 용신 × 일지 합충 × 분야 별점을 엮어 3~4문장으로 (토큰 0)

export interface DailySignals {
  tenGod: TenGod;
  affinity: number; // 신강약 기준 오늘 십신이 반가운 정도 (+ 반가움, − 버거움)
  strength: "strong" | "balanced" | "weak";
  yongsin: { label: string; kind: "용신" | "희신" } | null; // 오늘 기운에 섞인 용신·희신
  overload: boolean; // 이미 강한 오행이 더해짐
  dayBranch: "합" | "충" | null; // 오늘 지지와 일지
  best: { label: string; stars: number };
  worst: { label: string; stars: number };
}

const pick = <T,>(items: readonly T[], seed: string): T => items[hashString(seed) % items.length];

/** 십신별 오늘 기운을 부르는 명사구 */
const ENERGY: Record<TenGod, string[]> = {
  비견: ["나와 닮은 단단한 기운", "스스로 서는 주체성의 기운"],
  겁재: ["승부욕을 깨우는 기운", "경쟁 속에서 힘이 붙는 기운"],
  식신: ["여유와 즐거움의 기운", "재능이 자연스럽게 흘러나오는 기운"],
  상관: ["재치와 표현의 기운", "틀을 깨는 돌파의 기운"],
  편재: ["기회를 낚아채는 기운", "활동 반경을 넓히는 기운"],
  정재: ["차곡차곡 쌓이는 안정의 기운", "성실함이 결실로 돌아오는 기운"],
  편관: ["실력을 시험하는 긴장의 기운", "압박 속에서 단련되는 기운"],
  정관: ["원칙과 신뢰의 기운", "책임감이 인정받는 기운"],
  편인: ["직관이 예민해지는 기운", "혼자 깊이 파고드는 탐구의 기운"],
  정인: ["도움과 배움의 기운", "따뜻하게 받쳐 주는 기운"],
};

const OPENING = [
  "오늘은 {e:이/가} 들어오는 날이에요.",
  "오늘 하루에는 {e:이/가} 흐르고 있어요.",
  "오늘의 일진은 당신에게 {e:을/를} 건네요.",
  "{e:이/가} 오늘 당신 곁에 머물러요.",
];

const FIT = {
  good: [
    "지금 당신의 사주에 꼭 필요한 기운이라 움직인 만큼 보람이 따라와요.",
    "당신에게 반가운 기운이라 평소보다 일이 매끄럽게 풀릴 수 있어요.",
    "당신의 기운과 잘 맞물려서 마음먹은 일을 밀고 나가기 좋아요.",
  ],
  neutral: [
    "당신에게는 무난한 기운이라 평소 리듬을 지키는 것이 가장 좋아요.",
    "크게 치우치지 않는 하루라 하던 일을 차분히 이어 가면 충분해요.",
  ],
  bad: [
    "다만 지금 당신에게는 조금 버거운 기운이라 속도를 한 단계 낮추는 게 좋아요.",
    "다만 당신의 기운과 살짝 엇갈려서 무리하면 쉽게 지칠 수 있어요.",
    "다만 오늘은 힘을 빼는 쪽이 오히려 득이 되는 날이에요.",
  ],
};

const YONGSIN = [
  "게다가 오늘 기운에 당신을 돕는 {y}{k}이 섞여 있어 뜻밖의 도움을 기대해도 좋아요.",
  "반갑게도 당신의 {k}인 {y} 기운이 함께해 흐름에 힘을 실어 줘요.",
];
const OVERLOAD = [
  "이미 넉넉한 기운이 더해지는 날이라 욕심을 조금 덜어 내면 균형이 맞아요.",
  "가진 기운이 넘치기 쉬운 날이라 한 가지에 집중하는 편이 좋아요.",
];
const BRANCH = {
  합: ["가까운 사람과 마음이 잘 통하는 날이라 함께하는 일에서 힘을 얻어요.", "곁에 있는 사람과 호흡이 잘 맞아 관계에서 작은 기쁨이 생겨요."],
  충: ["생활 리듬이 흔들리기 쉬우니 일정은 여유 있게 잡아 두세요.", "가까운 사이에서 부딪힘이 생기기 쉬우니 말 한마디를 부드럽게 골라 보세요."],
};

const CLOSING = [
  "특히 {b}이 좋은 날이니 그쪽에 힘을 실어 보고, {w}은 한 박자 쉬어 가세요.",
  "{b} 흐름이 가장 밝으니 놓치지 말고, {w}은 무리하지 않는 게 좋아요.",
  "오늘은 {b}에서 좋은 소식을 기대해 볼 만해요. {w}은 조금 조심스럽게 다뤄 주세요.",
];
const CLOSING_EVEN = ["분야별로 고르게 무난한 하루라 하나씩 차근차근 챙기면 돼요.", "어느 한쪽으로 기울지 않는 하루예요. 오늘 할 일을 하나씩 끝내 보세요."];

function fill(template: string, values: Record<string, string>): string {
  return template.replace(/\{(\w)(?::([^}]+))?\}/g, (_, key: string, pair?: string) => (pair ? attach(values[key], pair) : values[key]));
}

/** 같은 사람·같은 날이면 항상 같은 문단 */
export function buildDailyStory(s: DailySignals, seed: string): string {
  const energy = pick(ENERGY[s.tenGod], `${seed}:energy`);
  const sentences = [fill(pick(OPENING, `${seed}:open`), { e: energy })];

  const fit = s.affinity >= 4 ? FIT.good : s.affinity <= -4 ? FIT.bad : FIT.neutral;
  sentences.push(pick(fit, `${seed}:fit`));

  // 가장 두드러진 신호 하나만 — 일지 합충 > 용신 > 과다 순
  if (s.dayBranch) sentences.push(pick(BRANCH[s.dayBranch], `${seed}:branch`));
  else if (s.yongsin) sentences.push(fill(pick(YONGSIN, `${seed}:yongsin`), { y: s.yongsin.label, k: s.yongsin.kind }));
  else if (s.overload) sentences.push(pick(OVERLOAD, `${seed}:over`));

  sentences.push(
    s.best.stars - s.worst.stars >= 2
      ? fill(pick(CLOSING, `${seed}:close`), { b: s.best.label, w: s.worst.label })
      : pick(CLOSING_EVEN, `${seed}:close`),
  );
  return sentences.join(" ");
}

const AVOID_BY_CATEGORY: Record<string, string> = {
  연애운: "감정이 앞선 말이나 섣부른 고백",
  재물운: "충동구매와 돈거래·보증",
  직업운: "확인 없이 넘기는 중요한 결정",
  건강운: "밤샘과 무리한 일정",
};

/** 오늘 피하면 좋은 것 2~3가지 — 십신 주의점 + 일지 충 + 별점이 낮은 분야 */
export function buildAvoidList(s: DailySignals, tenGodCaution: string, lowCategories: string[]): string[] {
  const items = [tenGodCaution];
  if (s.dayBranch === "충") items.push("이사·계약처럼 큰 결정은 오늘 확정하지 않기");
  for (const label of lowCategories) {
    if (items.length >= 3) break;
    if (AVOID_BY_CATEGORY[label]) items.push(`${AVOID_BY_CATEGORY[label]}는 미뤄 두기`);
  }
  if (s.overload && items.length < 3) items.push("한꺼번에 여러 일을 벌이기");
  return items;
}
