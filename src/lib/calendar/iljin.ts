import { BRANCHES, STEMS, type Branch, type Stem } from "@/lib/saju/ganji";
import { parseDate } from "./lunar";

export interface DayPillar {
  label: string; // 예: "갑자"
  hanja: string; // 예: "甲子"
  stemIndex: number;
  branchIndex: number;
  stem: Stem;
  branch: Branch;
}

// 기준일: 2000-01-01 = 무오(戊午)일 — 60갑자 순번 54
const REFERENCE_UTC = Date.UTC(2000, 0, 1);
const REFERENCE_CYCLE = 54;
const DAY_MS = 86_400_000;

/** 양력 날짜(YYYY-MM-DD)의 일진(日辰). 일진은 날짜만으로 60일 주기로 돌아간다. */
export function dayPillar(date: string): DayPillar {
  const { year, month, day } = parseDate(date);
  const days = Math.round((Date.UTC(year, month - 1, day) - REFERENCE_UTC) / DAY_MS);
  const cycle = (((REFERENCE_CYCLE + days) % 60) + 60) % 60;
  const stemIndex = cycle % 10;
  const branchIndex = cycle % 12;
  const stem = STEMS[stemIndex];
  const branch = BRANCHES[branchIndex];
  return {
    label: stem.ko + branch.ko,
    hanja: stem.hanja + branch.hanja,
    stemIndex,
    branchIndex,
    stem,
    branch,
  };
}
