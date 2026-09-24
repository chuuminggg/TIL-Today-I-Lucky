// saju-fortune / naming-house 는 타입을 제공하지 않으므로 실제 출력(v0.2.x)을 기준으로 필요한 부분만 선언한다.

declare module "saju-fortune" {
  export type Element = "wood" | "fire" | "earth" | "metal" | "water";
  export type Gender = "male" | "female";
  export type FortuneType = "general" | "love" | "wealth" | "career" | "health";

  export interface BirthInput {
    birthDate: string; // YYYY-MM-DD (양력)
    birthTime?: string; // HH:mm
    gender?: Gender;
    calendar?: "solar" | "lunar";
    isLeapMonth?: boolean;
    name?: string;
    birthCity?: string;
  }

  export interface Pillar {
    label: string;
    hanja: string;
    stem: string;
    stemHanja: string;
    stemElement: Element;
    stemElementKo: string;
    branch: string;
    branchHanja: string;
    branchAnimal: string;
    branchElement: Element;
    branchElementKo: string;
    yinYang: "yin" | "yang";
    stemIndex: number;
    branchIndex: number;
  }

  export interface DayMaster {
    stem: string;
    element: Element;
    elementKo: string;
    yinYang: "yin" | "yang";
    strength: "strong" | "balanced" | "weak";
  }

  export interface Yongsin {
    primary: Element;
    primaryKo: string;
    secondary: Element;
    secondaryKo: string;
    reasoning: string;
    analysis?: string;
  }

  export interface SajuAnalysis {
    input: BirthInput;
    pillars: { year: Pillar; month: Pillar; day: Pillar; hour: Pillar | null };
    timeAccuracy: "known" | "unknown";
    limitations: string[];
    dayMaster: DayMaster;
    fiveElements: Record<Element, number>;
    dominantElements: Element[];
    weakElements: Element[];
    yongsin: Yongsin;
    interview: { missingFields: string[]; optionalFields: string[]; suggestedQuestions: string[] };
    readingGuide: string[];
    sources: string[];
    fortune?: { type: string; label: string; summary: string; guidance: string[]; caveat: string };
  }

  export interface CompatibilityResult {
    people: Array<{
      dayMaster: DayMaster;
      dominantElements: Element[];
      weakElements: Element[];
      timeAccuracy: "known" | "unknown";
      pillars: { year: string; month: string; day: string; hour: string | null };
    }>;
    score: number;
    sharedElements: Element[];
    complementaryElements: Element[];
    focusAreas: string[];
    summary: string;
    sources: string[];
  }

  export function analyzeSaju(
    input: BirthInput,
    options?: { analysisType?: string; fortuneType?: FortuneType },
  ): SajuAnalysis;
  export function checkCompatibility(args: { person1: BirthInput; person2: BirthInput }): CompatibilityResult;
  export function getMissingInterviewFields(input: Partial<BirthInput>): string[];
  export function normalizeBirthInput(input: BirthInput): BirthInput;
  export function callSajuTool(name: string, args: Record<string, unknown>): unknown;
}

declare module "naming-house" {
  import type { Element, Gender, SajuAnalysis } from "saju-fortune";

  export interface NameCandidate {
    givenName: string;
    hanjaName?: string;
    tags?: string[];
  }

  export interface NamingInput {
    surname: string;
    surnameHanja?: string;
    birthDate: string;
    birthTime?: string;
    calendar?: "solar" | "lunar";
    gender?: Gender;
    candidates?: NameCandidate[];
    preferences?: {
      maxCandidates?: number;
      preferredElements?: Element[];
      avoidSyllables?: string[];
      preferredSyllables?: string[];
    };
  }

  export interface NameRecommendation {
    fullName: string;
    surname: string;
    givenName: string;
    hanjaName?: string;
    romanized: string;
    score: number;
    grade: "excellent" | "good" | "fair" | "weak";
    components: { elementBalance: number; strokeHarmony: number; soundFlow: number; preferenceFit: number };
    elementProfile: {
      neededElements: Element[];
      nameElements: Element[];
      matchedNeededElements: Element[];
      incompatibleElements: Element[];
    };
    strokeProfile: {
      source: string;
      strokes: Array<{ char: string; strokes: number; element: Element; source: string }>;
    };
  }

  export interface NamingResult {
    input: NamingInput;
    context: {
      saju: Pick<SajuAnalysis, "fiveElements" | "weakElements" | "dominantElements" | "yongsin" | "limitations" | "dayMaster">;
      neededElements: Element[];
    };
    recommendations: NameRecommendation[];
    limitations: string[];
    sources: string[];
  }

  export function recommendNames(input: NamingInput, options?: Record<string, unknown>): Promise<NamingResult>;
  export function getMissingNamingFields(input: Partial<NamingInput>): string[];
  export function callNamingHouseTool(name: string, args: Record<string, unknown>): Promise<unknown>;
}
