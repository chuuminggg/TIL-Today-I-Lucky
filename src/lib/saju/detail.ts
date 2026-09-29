import { calculateFourPillars, type Pillar as MPillar } from "manseryeok";
import type { Element, FortuneType, Pillar, SajuAnalysis } from "saju-fortune";
import { parseDate } from "@/lib/calendar/lunar";
import { attach } from "@/lib/josa";
import { analyze, toSolarInput, type BirthProfile } from "./adapter";
import {
  CHART_RELATION_TEXT,
  DAY_MASTER_TEXT,
  GROUP_TEXT,
  PILLAR_AREA,
  STRENGTH_TEXT,
} from "./detail-text";
import {
  BRANCHES,
  branchIndexByKo,
  branchRelations,
  ELEMENT_KO,
  HIDDEN_STEMS,
  stemByKo,
  TEN_GOD_GROUP,
  tenGodOf,
  type BranchRelation,
  type TenGod,
  type TenGodGroup,
} from "./ganji";

export type PillarKey = "hour" | "day" | "month" | "year";

export interface ChartCell {
  key: PillarKey;
  label: string; // "시주"
  area: string; // 이 기둥이 상징하는 영역
  stem: { ko: string; hanja: string; element: Element; tenGod: TenGod | "일간" };
  branch: { ko: string; hanja: string; element: Element; animal: string; tenGod: TenGod };
  hidden: Array<{ ko: string; hanja: string; element: Element; tenGod: TenGod }>;
}

export interface LuckPeriod {
  age: number; // 시작 나이 (만)
  label: string; // "경진"
  hanja: string;
  stemTenGod: TenGod;
  branchTenGod: TenGod;
  group: TenGodGroup;
  text: string;
  current: boolean;
  yongsin: boolean; // 대운 천간이 용신 오행인가
}

export interface YearFortune {
  year: number;
  label: string;
  hanja: string;
  tenGod: TenGod;
  text: string;
}

export interface SajuDetail {
  dayMaster: { ko: string; hanja: string; element: Element; image: string; text: string };
  strength: { key: SajuAnalysis["dayMaster"]["strength"]; label: string; text: string };
  chart: Array<ChartCell | null>; // 시·일·월·연 순서, 시간을 모르면 시주 null
  elements: Array<{ element: Element; label: string; count: number; state: "dominant" | "weak" | "normal" }>;
  yongsin: { primary: string; secondary: string; reasoning: string };
  groups: Array<{ group: TenGodGroup; count: number; meaning: string }>;
  groupSummary: string;
  relations: Array<{ kind: BranchRelation; between: [PillarKey, PillarKey]; text: string }>;
  topics: Array<{ type: FortuneType; label: string; summary: string; guidance: string[]; caveat: string }>;
  luck: { forward: boolean; startAge: number; periods: LuckPeriod[]; approximate: boolean };
  years: YearFortune[];
  limitations: string[];
}

const PILLAR_LABEL: Record<PillarKey, string> = { hour: "시주", day: "일주", month: "월주", year: "연주" };
const TOPIC_TYPES: FortuneType[] = ["general", "love", "wealth", "career", "health"];
const GROUP_ORDER: TenGodGroup[] = ["비겁", "식상", "재성", "관성", "인성"];

type DayMaster = ReturnType<typeof stemByKo>;

function chartCell(key: PillarKey, pillar: Pillar, dm: DayMaster): ChartCell {
  const stem = stemByKo(pillar.stem);
  const branch = BRANCHES[branchIndexByKo(pillar.branch)];
  const hidden = HIDDEN_STEMS[pillar.branch].map((ko) => {
    const s = stemByKo(ko);
    return { ko, hanja: s.hanja, element: s.element, tenGod: tenGodOf(dm, s) };
  });
  return {
    key,
    label: PILLAR_LABEL[key],
    area: PILLAR_AREA[key],
    stem: { ko: stem.ko, hanja: stem.hanja, element: stem.element, tenGod: key === "day" ? "일간" : tenGodOf(dm, stem) },
    branch: { ko: branch.ko, hanja: branch.hanja, element: branch.element, animal: branch.animal, tenGod: hidden.at(-1)!.tenGod },
    hidden,
  };
}

/** 원국의 천간(일간 제외)과 지지 본기의 십신을 묶음별로 센다 */
function countGroups(cells: ChartCell[]) {
  const counts = new Map<TenGodGroup, number>(GROUP_ORDER.map((g) => [g, 0]));
  for (const cell of cells) {
    if (cell.stem.tenGod !== "일간") counts.set(TEN_GOD_GROUP[cell.stem.tenGod], counts.get(TEN_GOD_GROUP[cell.stem.tenGod])! + 1);
    counts.set(TEN_GOD_GROUP[cell.branch.tenGod], counts.get(TEN_GOD_GROUP[cell.branch.tenGod])! + 1);
  }
  const groups = GROUP_ORDER.map((group) => ({ group, count: counts.get(group)!, meaning: GROUP_TEXT[group].meaning }));
  const max = Math.max(...groups.map((g) => g.count));
  const top = groups.filter((g) => g.count === max);
  const missing = groups.filter((g) => g.count === 0);
  const summary = [
    top.length === 1
      ? `${top[0].group} 기운이 ${max}개로 가장 많아요 (${top[0].meaning}).`
      : `${top.map((g) => g.group).join("·")} 기운이 ${max}개씩으로 가장 많아요.`,
    ...missing.slice(0, 2).map((g) => `${attach(g.group, "이/가")} 없어요. ${GROUP_TEXT[g.group].missing}`),
  ].join(" ");
  return { groups, summary };
}

function chartRelations(cells: ChartCell[]): SajuDetail["relations"] {
  const result: SajuDetail["relations"] = [];
  for (let i = 0; i < cells.length; i++) {
    for (let j = i + 1; j < cells.length; j++) {
      const [a, b] = [cells[i], cells[j]];
      for (const kind of branchRelations(branchIndexByKo(a.branch.ko), branchIndexByKo(b.branch.ko))) {
        result.push({
          kind,
          between: [a.key, b.key],
          text: `${a.label}(${a.area})와 ${b.label}(${b.area})의 ${a.branch.ko}·${b.branch.ko} ${kind} — ${CHART_RELATION_TEXT[kind]}`,
        });
      }
    }
  }
  return result;
}

const toLabel = (p: MPillar) => `${p.heavenlyStem}${p.earthlyBranch}`;
const hanjaOf = (label: string) => `${stemByKo(label[0]).hanja}${BRANCHES[branchIndexByKo(label[1])].hanja}`;

/** 대운 — manseryeok(한국천문연구원 절입 시각)으로 순행·역행과 대운수를 구한다 */
function luckPeriods(profile: BirthProfile, dm: DayMaster, yongsin: Element, today: string): SajuDetail["luck"] {
  const { birthDate } = toSolarInput(profile);
  const { year, month, day } = parseDate(birthDate);
  const [hour, minute] = (profile.birthTime ?? "12:00").split(":").map(Number);
  const info = calculateFourPillars({ year, month, day, hour, minute, gender: profile.gender }).luckPillars!;

  const t = parseDate(today);
  const elapsed = (Date.UTC(t.year, t.month - 1, t.day) - Date.UTC(year, month - 1, day)) / (365.2425 * 86_400_000);
  const currentIndex = info.pillars.findLastIndex((p) => p.age <= elapsed);

  return {
    forward: info.forward,
    startAge: info.startAge,
    approximate: !profile.birthTime,
    periods: info.pillars.slice(0, 9).map((p, i) => {
      const stem = stemByKo(p.pillar.heavenlyStem);
      const main = stemByKo(HIDDEN_STEMS[p.pillar.earthlyBranch].at(-1)!);
      const stemTenGod = tenGodOf(dm, stem);
      const group = TEN_GOD_GROUP[stemTenGod];
      return {
        age: p.age,
        label: p.korean,
        hanja: hanjaOf(p.korean),
        stemTenGod,
        branchTenGod: tenGodOf(dm, main),
        group,
        text: GROUP_TEXT[group].luck,
        current: i === currentIndex,
        yongsin: stem.element === yongsin,
      };
    }),
  };
}

/** 세운 — 그해 연주(입춘 이후 기준)의 천간 십신과, 연지가 내 일지와 만드는 관계 */
function yearFortune(year: number, dm: DayMaster, dayBranch: string, yongsin: Element): YearFortune {
  const label = toLabel(calculateFourPillars({ year, month: 7, day: 1, hour: 12, minute: 0 }).year);
  const stem = stemByKo(label[0]);
  const tenGod = tenGodOf(dm, stem);
  const relations = branchRelations(branchIndexByKo(label[1]), branchIndexByKo(dayBranch));
  const parts = [GROUP_TEXT[TEN_GOD_GROUP[tenGod]].year];
  if (stem.element === yongsin) parts.push("나에게 필요한 기운(용신)이 들어오는 해라 흐름을 타기 좋아요.");
  if (relations.includes("충")) parts.push(`올해의 ${attach(label[1], "이/가")} 일지 ${attach(dayBranch, "과/와")} 충해 가까운 관계나 생활에 변화가 생기기 쉬워요.`);
  else if (relations.includes("육합") || relations.includes("삼합")) parts.push("올해의 기운이 일지와 어울려 가까운 사람과의 관계가 부드러워요.");
  return { year, label, hanja: hanjaOf(label), tenGod, text: parts.join(" ") };
}

export function getSajuDetail(profile: BirthProfile, today: string): SajuDetail {
  const saju = analyze(profile);
  const { pillars, dayMaster } = saju;
  const dm = stemByKo(pillars.day.stem);

  const cells: Array<ChartCell | null> = (["hour", "day", "month", "year"] as const).map((key) =>
    pillars[key] ? chartCell(key, pillars[key]!, dm) : null,
  );
  const present = cells.filter((c): c is ChartCell => c !== null);
  const { groups, summary } = countGroups(present);
  const thisYear = parseDate(today).year;

  return {
    dayMaster: { ko: dm.ko, hanja: dm.hanja, element: dm.element, ...DAY_MASTER_TEXT[dm.ko] },
    strength: { key: dayMaster.strength, ...STRENGTH_TEXT[dayMaster.strength] },
    chart: cells,
    elements: (["wood", "fire", "earth", "metal", "water"] as const).map((element) => ({
      element,
      label: ELEMENT_KO[element],
      count: saju.fiveElements[element],
      state: saju.dominantElements.includes(element) ? "dominant" : saju.weakElements.includes(element) ? "weak" : "normal",
    })),
    yongsin: { primary: ELEMENT_KO[saju.yongsin.primary], secondary: ELEMENT_KO[saju.yongsin.secondary], reasoning: saju.yongsin.reasoning },
    groups,
    groupSummary: summary,
    relations: chartRelations(present),
    topics: TOPIC_TYPES.map((type) => {
      const fortune = analyze(profile, type).fortune!;
      return { type, label: fortune.label, summary: fortune.summary, guidance: fortune.guidance, caveat: fortune.caveat };
    }),
    luck: luckPeriods(profile, dm, saju.yongsin.primary, today),
    years: [thisYear, thisYear + 1].map((y) => yearFortune(y, dm, pillars.day.branch, saju.yongsin.primary)),
    limitations: saju.limitations,
  };
}
