import type { Element, Gender, SajuAnalysis } from "saju-fortune";
import type { DayPillar } from "@/lib/calendar/iljin";
import { pick, seededRandom } from "@/lib/random";
import { buildAvoidList, buildDailyStory, type DailySignals } from "./narrative";
import { BRANCHES, TEN_GOD_GROUP, isClash, isHarmony, tenGodOf, type TenGod, type TenGodGroup } from "./ganji";

export type Category = "love" | "wealth" | "career" | "health";

export interface CategoryFortune {
  category: Category;
  label: string;
  stars: number; // 1–5
  text: string;
}

export interface DailyFortune {
  score: number; // 0–100
  tenGod: TenGod;
  headline: string;
  summary: string;
  advice: string;
  caution: string;
  /** 십신·용신·합충·분야 별점을 엮은 3~4문장 — 날마다 다르게 읽힌다 */
  story: string;
  /** 오늘 피하면 좋은 것 2~3가지 */
  avoid: string[];
  categories: CategoryFortune[];
  /** 점수 근거 — 화면의 "왜 이런 점수?" 및 Phase 3 LLM 프롬프트 입력으로 사용 */
  factors: string[];
}

const TEN_GOD_TEXT: Record<TenGod, { keyword: string; summary: string; advice: string; caution: string }> = {
  비견: {
    keyword: "주체성",
    summary: "나와 같은 기운이 들어와 자신감과 추진력이 살아나는 날입니다.",
    advice: "혼자 끌고 가던 일에 속도를 내 보세요. 동료와 역할을 나누면 더 멀리 갑니다.",
    caution: "고집이 세지기 쉬우니 남의 의견을 한 번 더 들어 보세요.",
  },
  겁재: {
    keyword: "경쟁",
    summary: "경쟁심과 승부욕이 올라오는 날입니다. 에너지는 크지만 흩어지기도 쉽습니다.",
    advice: "목표를 하나로 좁혀 집중하면 경쟁이 오히려 원동력이 됩니다.",
    caution: "충동적인 지출이나 보증·돈거래는 미뤄 두세요.",
  },
  식신: {
    keyword: "여유와 표현",
    summary: "마음에 여유가 생기고 재능이 자연스럽게 드러나는 날입니다.",
    advice: "맛있는 식사, 취미, 창작처럼 나를 채우는 일에 시간을 쓰세요.",
    caution: "편안함에 젖어 해야 할 일을 미루지 않도록 하세요.",
  },
  상관: {
    keyword: "재치와 돌파",
    summary: "아이디어와 말솜씨가 빛나는 날입니다. 틀을 깨는 시도가 통합니다.",
    advice: "기획, 발표, 글쓰기처럼 표현이 필요한 일에 도전해 보세요.",
    caution: "윗사람이나 규칙과 부딪히기 쉬우니 말의 온도를 조절하세요.",
  },
  편재: {
    keyword: "기회 포착",
    summary: "활동 반경이 넓어지고 예상 밖의 기회가 들어오는 날입니다.",
    advice: "새로운 사람을 만나고 발 빠르게 움직이면 성과가 따라옵니다.",
    caution: "큰돈이 오가는 결정은 한 번 더 계산해 보세요.",
  },
  정재: {
    keyword: "안정과 성실",
    summary: "꾸준히 쌓아 온 것이 결실로 돌아오는 안정적인 날입니다.",
    advice: "가계부 정리, 계획 점검처럼 차근차근 챙기는 일이 잘 풀립니다.",
    caution: "지나친 계산으로 사람을 놓치지 않도록 하세요.",
  },
  편관: {
    keyword: "도전과 압박",
    summary: "긴장감 속에서 실력을 시험받는 날입니다. 버티면 한 단계 성장합니다.",
    advice: "미뤄 둔 어려운 일을 정면으로 마주하면 의외로 쉽게 풀립니다.",
    caution: "무리한 일정과 과로를 피하고 컨디션을 먼저 챙기세요.",
  },
  정관: {
    keyword: "신뢰와 인정",
    summary: "원칙대로 움직일 때 인정받는 날입니다. 책임감이 좋은 평가로 이어집니다.",
    advice: "약속과 마감을 정확히 지키면 신뢰가 한층 두터워집니다.",
    caution: "체면 때문에 무리한 부탁을 받아들이지 마세요.",
  },
  편인: {
    keyword: "직관과 탐구",
    summary: "직관이 예민해지고 혼자 파고드는 공부가 잘되는 날입니다.",
    advice: "관심 있던 분야를 깊이 파 보거나 조용히 생각을 정리해 보세요.",
    caution: "생각이 많아져 결정을 미루기 쉬우니 작은 것부터 실행하세요.",
  },
  정인: {
    keyword: "도움과 배움",
    summary: "주변의 도움과 좋은 조언이 들어오는 따뜻한 날입니다.",
    advice: "배우고 싶던 것을 시작하거나 멘토에게 연락해 보세요.",
    caution: "도움에 기대기만 하지 말고 스스로 결정하는 연습도 하세요.",
  },
};

const CATEGORY_LABEL: Record<Category, string> = {
  love: "연애운",
  wealth: "재물운",
  career: "직업운",
  health: "건강운",
};

// [낮음(1–2), 보통(3), 좋음(4–5)] 별 문장 후보
const CATEGORY_TEXT: Record<Category, [string[], string[], string[]]> = {
  love: [
    ["감정 표현이 엇갈리기 쉬운 날이에요. 서운함은 바로 말하기보다 한 템포 쉬고 전해 보세요.", "관계에 작은 오해가 생길 수 있어요. 상대의 입장을 먼저 물어보는 것이 좋아요."],
    ["잔잔하고 무난한 흐름이에요. 소소한 안부 한마디가 관계를 따뜻하게 해요.", "특별한 일은 없어도 편안한 대화가 이어지는 날이에요."],
    ["매력이 자연스럽게 드러나는 날이에요. 마음에 둔 사람에게 먼저 연락해 보세요.", "관계가 한 걸음 가까워질 수 있는 흐름이에요. 솔직한 표현이 통해요."],
  ],
  wealth: [
    ["지출이 새기 쉬운 날이에요. 충동구매와 돈거래는 내일로 미루세요.", "예상 밖의 지출에 대비해 오늘은 지갑을 단단히 닫아 두세요."],
    ["들어오고 나가는 돈이 균형을 이루는 날이에요. 고정 지출을 점검해 보세요.", "큰 변화는 없지만 작은 절약이 쌓이는 날이에요."],
    ["금전 흐름이 좋아요. 미뤄 둔 정산이나 협상을 진행하기에 좋은 날이에요.", "작은 수입이나 반가운 혜택이 들어올 수 있어요."],
  ],
  career: [
    ["일이 뜻대로 풀리지 않을 수 있어요. 오늘은 새 일보다 마무리에 집중하세요.", "소통에 혼선이 생기기 쉬워요. 중요한 내용은 글로 남겨 두세요."],
    ["평소 페이스를 유지하면 충분한 날이에요. 루틴을 지키는 것이 곧 성과예요.", "무난하게 흘러가는 날이에요. 다음 계획을 정리해 두기 좋아요."],
    ["능력을 보여 줄 기회가 오는 날이에요. 적극적으로 의견을 내 보세요.", "추진하던 일에 속도가 붙어요. 윗사람의 인정도 기대할 만해요."],
  ],
  health: [
    ["피로가 쌓이기 쉬운 날이에요. 무리한 운동보다 충분한 수면을 챙기세요.", "컨디션 기복이 있을 수 있어요. 따뜻한 음식과 휴식이 도움이 돼요."],
    ["큰 무리는 없는 날이에요. 가벼운 스트레칭으로 몸을 풀어 주세요.", "평소처럼 규칙적인 식사와 수면을 지키면 좋아요."],
    ["몸이 가볍고 활력이 넘치는 날이에요. 새로운 운동을 시작해 보세요.", "에너지가 좋은 날이에요. 산책이나 야외 활동으로 기운을 더해 보세요."],
  ],
};

/** 오늘 십신 묶음에 맞춘 분야별 구체적인 행동 한 줄 — 별 문장 뒤에 붙인다 */
const CATEGORY_TIP: Record<Category, Record<TenGodGroup, string>> = {
  love: {
    비겁: "오늘은 내 이야기보다 상대 이야기를 끝까지 들어 주는 쪽이 마음을 얻어요.",
    식상: "재치 있는 메시지나 사진 한 장으로 먼저 대화를 열어 보세요.",
    재성: "작은 간식이나 커피 한 잔처럼 눈에 보이는 마음 표현이 잘 통해요.",
    관성: "약속 시간을 지키고 했던 말을 지키는 모습이 가장 큰 매력이 돼요.",
    인성: "고민을 털어놓고 기대는 대화가 서로를 더 가깝게 만들어요.",
  },
  wealth: {
    비겁: "더치페이·빌려준 돈처럼 주변 사람과 얽힌 돈 관계를 분명히 해 두세요.",
    식상: "취미나 재능을 살린 부업·중고 판매 아이디어를 하나 적어 보세요.",
    재성: "장바구니에 담아 둔 물건은 하루 묵힌 뒤 결제하면 후회가 적어요.",
    관성: "카드 명세서·자동이체·보험처럼 정해진 돈의 흐름을 점검하기 좋아요.",
    인성: "재테크 공부나 믿을 만한 사람의 조언을 듣는 데 시간을 써 보세요.",
  },
  career: {
    비겁: "혼자 끌어안은 일을 목록으로 적고, 나눌 수 있는 것은 동료에게 맡겨 보세요.",
    식상: "기획안·보고서처럼 내 생각을 보여 줄 결과물을 오늘 한 장 만들어 보세요.",
    재성: "숫자와 성과로 말하면 설득이 쉬워요. 회의 전 핵심 수치를 세 개만 정리해 두세요.",
    관성: "보고는 결론부터 짧게 쓰고, 마감 하루 전에 한 번 더 점검해 두세요.",
    인성: "모르는 것은 바로 물어보고, 배운 내용을 짧게 메모해 두세요.",
  },
  health: {
    비겁: "혼자 하는 운동보다 누군가와 함께 걷거나 운동하면 꾸준히 이어 가기 쉬워요.",
    식상: "과식·야식이 쉬운 날이에요. 저녁은 평소보다 조금 가볍게 드세요.",
    재성: "일에 몰두하다 끼니를 거르기 쉬우니 물과 간식을 가까이 두세요.",
    관성: "어깨·목이 쉽게 뭉쳐요. 한 시간마다 일어나 가볍게 몸을 풀어 주세요.",
    인성: "따뜻한 차 한 잔과 넉넉한 잠이 몸을 든든하게 받쳐 줘요. 잠들기 전 휴대폰은 멀리 두세요.",
  },
};

const clamp =(n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

function groupAffinity(strength: SajuAnalysis["dayMaster"]["strength"], group: TenGodGroup): number {
  // 신강하면 기운을 빼 주는 식상·재성·관성이, 신약하면 힘을 보태는 인성·비겁이 반갑다
  if (strength === "strong") return { 식상: 10, 재성: 10, 관성: 8, 인성: -6, 비겁: -6 }[group];
  if (strength === "weak") return { 인성: 10, 비겁: 10, 식상: -3, 재성: -6, 관성: -6 }[group];
  return { 식상: 4, 재성: 4, 인성: 4, 관성: 0, 비겁: 0 }[group];
}

function toStars(score: number): number {
  if (score >= 82) return 5;
  if (score >= 70) return 4;
  if (score >= 58) return 3;
  if (score >= 45) return 2;
  return 1;
}

export function computeDailyFortune(
  saju: SajuAnalysis,
  gender: Gender,
  today: DayPillar,
  seed: string,
): DailyFortune {
  const random = seededRandom(seed);
  const dm = saju.dayMaster;
  const tenGod = tenGodOf(dm, today.stem);
  const group = TEN_GOD_GROUP[tenGod];
  const factors: string[] = [];

  let score = 60;

  const affinity = groupAffinity(dm.strength, group);
  score += affinity;
  factors.push(`오늘 천간 ${today.stem.ko}(${today.stem.hanja})은 내 일간에게 ${tenGod} (${affinity >= 0 ? "+" : ""}${affinity})`);

  const todayElements: Element[] = [today.stem.element, today.branch.element];
  let yongsinHit: DailySignals["yongsin"] = null;
  let overload = false;
  for (const element of todayElements) {
    if (element === saju.yongsin.primary) {
      yongsinHit = { label: saju.yongsin.primaryKo, kind: "용신" };
      score += 8;
      factors.push(`오늘 기운에 용신 ${saju.yongsin.primaryKo}이 있음 (+8)`);
    } else if (element === saju.yongsin.secondary) {
      yongsinHit ??= { label: saju.yongsin.secondaryKo, kind: "희신" };
      score += 4;
      factors.push(`오늘 기운에 희신 ${saju.yongsin.secondaryKo}이 있음 (+4)`);
    } else if (saju.dominantElements.includes(element)) {
      overload = true;
      score -= 4;
      factors.push(`이미 강한 오행이 더해짐 (-4)`);
    }
  }

  const natal = [
    { name: "일지", pillar: saju.pillars.day, harmony: 6, clash: -8 },
    { name: "월지", pillar: saju.pillars.month, harmony: 2, clash: -3 },
    { name: "연지", pillar: saju.pillars.year, harmony: 2, clash: -3 },
    { name: "시지", pillar: saju.pillars.hour, harmony: 2, clash: -3 },
  ];
  let dayBranchHarmony = false;
  let dayBranchClash = false;
  for (const { name, pillar, harmony, clash } of natal) {
    if (!pillar) continue;
    const todayBranch = `${today.branch.ko}(${today.branch.hanja})`;
    const natalBranch = `${BRANCHES[pillar.branchIndex].ko}(${pillar.branchHanja})`;
    if (isHarmony(today.branchIndex, pillar.branchIndex)) {
      score += harmony;
      factors.push(`오늘 지지 ${todayBranch}와 ${name} ${natalBranch}가 합 (+${harmony})`);
      if (name === "일지") dayBranchHarmony = true;
    } else if (isClash(today.branchIndex, pillar.branchIndex)) {
      score += clash;
      factors.push(`오늘 지지 ${todayBranch}와 ${name} ${natalBranch}가 충 (${clash})`);
      if (name === "일지") dayBranchClash = true;
    }
  }

  score = clamp(Math.round(score), 30, 98);

  const loveStar: TenGodGroup = gender === "male" ? "재성" : "관성";
  const mods: Record<Category, number> = {
    love:
      (group === loveStar ? 10 : 0) + (group === "식상" ? 4 : 0) - (group === "비겁" ? 4 : 0) +
      (dayBranchHarmony ? 6 : 0) - (dayBranchClash ? 8 : 0),
    wealth: (group === "재성" ? 10 : 0) + (group === "식상" ? 5 : 0) - (tenGod === "겁재" ? 8 : tenGod === "비견" ? 3 : 0),
    career: (group === "관성" ? 8 : 0) + (group === "인성" ? 5 : 0) - (tenGod === "상관" ? 6 : 0),
    health: (group === "인성" ? 6 : 0) + (group === "비겁" ? 3 : 0) - (tenGod === "편관" ? 5 : 0) - (dayBranchClash ? 6 : 0),
  };

  const categories = (Object.keys(CATEGORY_LABEL) as Category[]).map((category) => {
    const stars = toStars(score + mods[category]);
    const level = stars <= 2 ? 0 : stars === 3 ? 1 : 2;
    return { category, label: CATEGORY_LABEL[category], stars, text: `${pick(CATEGORY_TEXT[category][level], random)} ${CATEGORY_TIP[category][group]}` };
  });

  const text = TEN_GOD_TEXT[tenGod];
  const ranked = [...categories].sort((a, b) => b.stars - a.stars);
  const signals: DailySignals = {
    tenGod,
    affinity,
    strength: dm.strength,
    yongsin: yongsinHit,
    overload,
    dayBranch: dayBranchClash ? "충" : dayBranchHarmony ? "합" : null,
    best: { label: ranked[0].label, stars: ranked[0].stars },
    worst: { label: ranked.at(-1)!.label, stars: ranked.at(-1)!.stars },
  };
  const low = categories.filter((c) => c.stars <= 2).map((c) => c.label);
  return {
    score,
    tenGod,
    headline: `${today.label}일 · ${text.keyword}의 날`,
    summary: text.summary,
    advice: text.advice,
    caution: text.caution,
    story: buildDailyStory(signals, seed),
    avoid: buildAvoidList(signals, text.caution, low),
    categories,
    factors,
  };
}
