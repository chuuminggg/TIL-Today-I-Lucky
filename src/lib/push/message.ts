import { dayPillar } from "@/lib/calendar/iljin";
import { hashString } from "@/lib/random";

// 아침 알림 문구 — 서버에 생년월일이 없으므로 그날의 일진으로 모두에게 같은 문구를 보낸다.
// 날마다 문구가 바뀌도록 날짜로 고른다.

export interface PushMessage {
  title: string;
  body: string;
  url: string;
  tag: string;
}

const TITLES = ["오늘의 카드가 도착했어요 🃏", "좋은 아침이에요 🍀", "오늘 하루, 미리 살펴볼까요? 🌤️", "오늘의 운세가 준비됐어요 ✨"];
const BODIES = [
  "오늘은 {d}일, {a}의 날이에요. 내 운세와 오늘의 카드를 확인해 보세요.",
  "{a}의 기운이 흐르는 {d}일이에요. 오늘 해 보면 좋은 것을 알려 드릴게요.",
  "{d}일 아침이에요. 카드 한 장 뒤집고 하루를 시작해 볼까요?",
];

export function dailyMessage(date: string): PushMessage {
  const day = dayPillar(date);
  const seed = hashString(`push:${date}`);
  const body = BODIES[seed % BODIES.length].replace("{d}", `${day.label}(${day.hanja})`).replace("{a}", day.branch.animal);
  return { title: TITLES[(seed >>> 3) % TITLES.length], body, url: "/?from=push", tag: `til-daily-${date}` };
}
