import { dayPillar } from "@/lib/calendar/iljin";
import { profileSeed, type BirthProfileInput } from "@/lib/profile/schema";
import { analyze } from "@/lib/saju/adapter";
import { computeDailyFortune, type DailyFortune } from "@/lib/saju/daily";
import { ELEMENT_HANJA } from "@/lib/saju/ganji";
import { luckyItems, type LuckyItems } from "@/lib/saju/luck";
import { drawCards, type DrawnCard } from "@/lib/tarot/draw";

export interface TodayReading {
  date: string;
  iljin: { label: string; hanja: string; animal: string };
  me: {
    dayMaster: string; // 예: "기토(己土)"
    strength: "strong" | "balanced" | "weak";
    pillars: string[]; // 연·월·일·시 한자
    timeKnown: boolean;
  };
  fortune: DailyFortune;
  lucky: LuckyItems;
  tarot: DrawnCard;
  limitations: string[];
}

export function getTodayReading(profile: BirthProfileInput, date: string): TodayReading {
  const saju = analyze(profile);
  const today = dayPillar(date);
  const seed = profileSeed(profile, date);
  const { pillars, dayMaster } = saju;

  return {
    date,
    iljin: { label: today.label, hanja: today.hanja, animal: today.branch.animal },
    me: {
      dayMaster: `${dayMaster.stem}${dayMaster.elementKo}(${pillars.day.stemHanja}${ELEMENT_HANJA[dayMaster.element]})`,
      strength: dayMaster.strength,
      pillars: [pillars.year, pillars.month, pillars.day, pillars.hour].map((p) => p?.hanja ?? "??"),
      timeKnown: saju.timeAccuracy === "known",
    },
    fortune: computeDailyFortune(saju, profile.gender, today, seed),
    lucky: luckyItems(saju.yongsin.primary, seed),
    tarot: drawCards(seed)[0],
    limitations: saju.limitations,
  };
}
