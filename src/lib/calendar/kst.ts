// 한국 표준시(KST) 기준 날짜·시각 — 음력 변환 라이브러리 없이 클라이언트에서도 쓸 수 있게 따로 둔다

/** 한국 표준시(KST) 기준 오늘 날짜 YYYY-MM-DD */
export function todayKST(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(now);
}

/** 한국 표준시(KST) 기준 지금 몇 시인지 (0–23) */
export function hourKST(now: Date = new Date()): number {
  return Number(new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Seoul", hour: "numeric", hourCycle: "h23" }).format(now));
}
