import {
  analyzeSaju,
  checkCompatibility,
  type BirthInput,
  type CompatibilityResult,
  type FortuneType,
  type Gender,
  type SajuAnalysis,
} from "saju-fortune";
import { lunarToSolar, parseDate } from "@/lib/calendar/lunar";

/** 사용자 입력 형태. 음력이면 어댑터에서 양력으로 변환한 뒤 패키지에 넘긴다. */
export interface BirthProfile {
  birthDate: string; // YYYY-MM-DD (calendar 기준)
  birthTime?: string; // HH:mm, 모르면 생략
  gender: Gender;
  calendar: "solar" | "lunar";
  isLeapMonth?: boolean;
}

export function toSolarInput(profile: BirthProfile): BirthInput {
  const birthDate =
    profile.calendar === "lunar"
      ? lunarToSolar(parseDate(profile.birthDate), profile.isLeapMonth)
      : profile.birthDate;
  return { birthDate, birthTime: profile.birthTime, gender: profile.gender, calendar: "solar" };
}

export function analyze(profile: BirthProfile, fortuneType?: FortuneType): SajuAnalysis {
  const input = toSolarInput(profile);
  return fortuneType ? analyzeSaju(input, { analysisType: "fortune", fortuneType }) : analyzeSaju(input);
}

export function compatibility(a: BirthProfile, b: BirthProfile): CompatibilityResult {
  return checkCompatibility({ person1: toSolarInput(a), person2: toSolarInput(b) });
}
