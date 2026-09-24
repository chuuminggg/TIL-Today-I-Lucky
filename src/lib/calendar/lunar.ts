import KoreanLunarCalendar from "korean-lunar-calendar";

export interface DateParts {
  year: number;
  month: number;
  day: number;
}

const pad = (n: number) => String(n).padStart(2, "0");

export const formatDate = ({ year, month, day }: DateParts) => `${year}-${pad(month)}-${pad(day)}`;

export function parseDate(value: string): DateParts {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) throw new Error(`날짜 형식이 올바르지 않습니다 (YYYY-MM-DD): ${value}`);
  return { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) };
}

/** 음력(윤달 포함) 날짜를 양력 YYYY-MM-DD로 변환한다. saju-fortune / naming-house는 음력을 변환하지 않는다. */
export function lunarToSolar(lunar: DateParts, isLeapMonth = false): string {
  const calendar = new KoreanLunarCalendar();
  if (!calendar.setLunarDate(lunar.year, lunar.month, lunar.day, isLeapMonth)) {
    throw new Error(`존재하지 않는 음력 날짜입니다: ${formatDate(lunar)}${isLeapMonth ? " (윤달)" : ""}`);
  }
  return formatDate(calendar.getSolarCalendar());
}

/** 한국 표준시(KST) 기준 오늘 날짜 YYYY-MM-DD */
export function todayKST(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(now);
}
