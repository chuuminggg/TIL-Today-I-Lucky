"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { backupFileName } from "@/lib/journal/backup";
import {
  badgesOf,
  daysInMonth,
  HIT_LABEL,
  MEMO_MAX,
  monthGrid,
  scoreLevel,
  statsOf,
  streakOf,
  type Hit,
  type Journal,
  type JournalDay,
} from "@/lib/journal/journal";
import { exportBackup, importBackup, recordRetro, useJournal } from "@/lib/journal/storage";
import { parseProfile, useStoredProfileRaw } from "@/lib/profile/storage";
import { PushToggle } from "./push-toggle";
import type { TodayReading } from "@/lib/today";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];
const LEVEL_CLASS = ["", "bg-accent/10", "bg-accent/20", "bg-accent/35", "bg-accent/55 text-white", "bg-accent/80 text-white"];
const HIT_EMOJI: Record<Hit, string> = { yes: "👍", half: "🤏", no: "👎" };

const parseYM = (date: string) => date.split("-").map(Number) as [number, number, number];
const label = (date: string) => {
  const [, m, d] = parseYM(date);
  return `${m}월 ${d}일`;
};

export function CalendarApp({ today }: { today: string }) {
  const journal = useJournal();
  const [ty, tm] = parseYM(today);
  const [{ year, month }, setMonth] = useState({ year: ty, month: tm });
  const [selected, setSelected] = useState(today);

  if (!journal) return <div aria-busy className="h-96 animate-pulse rounded-2xl bg-border/60" />;

  const isCurrentMonth = year === ty && month === tm;
  const move = (delta: number) => {
    const d = new Date(Date.UTC(year, month - 1 + delta, 1));
    setMonth({ year: d.getUTCFullYear(), month: d.getUTCMonth() + 1 });
  };

  return (
    <div className="flex flex-col gap-4">
      <StreakSummary journal={journal} today={today} />

      <section className="rounded-2xl border border-border bg-card p-4">
        <div className="flex items-center justify-between">
          <button type="button" onClick={() => move(-1)} aria-label="이전 달" className="rounded-lg px-3 py-1 text-lg">
            ‹
          </button>
          <h2 className="font-bold">
            {year}년 {month}월
          </h2>
          <button
            type="button"
            onClick={() => move(1)}
            disabled={isCurrentMonth}
            aria-label="다음 달"
            className="rounded-lg px-3 py-1 text-lg disabled:opacity-30"
          >
            ›
          </button>
        </div>

        <div className="mt-3 grid grid-cols-7 gap-1 text-center text-xs text-muted">
          {WEEKDAYS.map((w) => (
            <span key={w}>{w}</span>
          ))}
        </div>
        <div className="mt-1 grid grid-cols-7 gap-1">
          {monthGrid(year, month).map((date, i) =>
            date ? (
              <DayCell key={date} date={date} day={journal[date]} today={today} selected={selected === date} onSelect={setSelected} />
            ) : (
              <span key={`blank-${i}`} />
            ),
          )}
        </div>

        <div className="mt-3 flex items-center justify-end gap-1 text-[11px] text-muted">
          점수 낮음
          {[1, 2, 3, 4, 5].map((level) => (
            <span key={level} className={`size-3 rounded ${LEVEL_CLASS[level]}`} />
          ))}
          높음
        </div>
      </section>

      <DayDetail key={selected} date={selected} day={journal[selected]} today={today} />
      <MonthStats days={daysInMonth(journal, year, month)} month={month} />
      <Badges journal={journal} today={today} />
      <PushToggle />
      <BackupPanel today={today} />
    </div>
  );
}

function StreakSummary({ journal, today }: { journal: Journal; today: string }) {
  const { current, best, visitedToday } = streakOf(journal, today);
  return (
    <section className="grid grid-cols-2 gap-2 text-center">
      <div className="rounded-2xl border border-border bg-card p-4">
        <p className="text-xs text-muted">연속 방문</p>
        <p className="mt-1 text-2xl font-bold">🔥 {current}일</p>
        {!visitedToday && current > 0 && <p className="mt-1 text-xs text-muted">오늘 운세를 보면 이어져요</p>}
      </div>
      <div className="rounded-2xl border border-border bg-card p-4">
        <p className="text-xs text-muted">최고 기록</p>
        <p className="mt-1 text-2xl font-bold">🏅 {best}일</p>
      </div>
    </section>
  );
}

function DayCell({
  date,
  day,
  today,
  selected,
  onSelect,
}: {
  date: string;
  day?: JournalDay;
  today: string;
  selected: boolean;
  onSelect: (date: string) => void;
}) {
  const future = date > today;
  const level = day?.fortune ? scoreLevel(day.fortune.score) : 0;
  const n = parseYM(date)[2];
  return (
    <button
      type="button"
      disabled={future}
      onClick={() => onSelect(date)}
      aria-pressed={selected}
      aria-label={`${label(date)}${day?.fortune ? ` ${day.fortune.score}점` : ""}${day?.hit ? ` ${HIT_LABEL[day.hit]}` : ""}${future ? " (잠김)" : ""}`}
      className={`relative flex aspect-[4/5] flex-col items-center rounded-lg pt-1 text-xs disabled:opacity-30 ${LEVEL_CLASS[level]} ${
        selected ? "ring-2 ring-accent" : ""
      } ${date === today ? "font-bold underline underline-offset-2" : ""}`}
    >
      {n}
      {day?.tarot?.slug && (
        <span className="relative mt-0.5 block h-[55%] w-[45%] overflow-hidden rounded-sm shadow-sm">
          <Image
            src={`/tarot/rws/${day.tarot.slug}.webp`}
            alt=""
            fill
            sizes="20px"
            className={`object-cover ${day.tarot.reversed ? "rotate-180" : ""}`}
          />
        </span>
      )}
      {day?.hit && <span className="absolute -top-1 -right-1 text-[10px]">{HIT_EMOJI[day.hit]}</span>}
    </button>
  );
}

function DayDetail({ date, day, today }: { date: string; day?: JournalDay; today: string }) {
  const isToday = date === today;
  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5">
      <h2 className="text-xs font-medium text-accent">
        {label(date)}
        {isToday && " · 오늘"}
      </h2>

      {day?.fortune ? (
        <div>
          <p className="font-bold">{day.fortune.headline}</p>
          <p className="mt-0.5 text-sm text-muted">
            총운 {day.fortune.score}점{day.tarot?.name && ` · 오늘의 타로 ${day.tarot.name}${day.tarot.reversed ? " 역방향" : ""}`}
          </p>
        </div>
      ) : isToday ? (
        <Link href="/" className="rounded-xl border border-accent py-2.5 text-center text-sm font-medium text-accent">
          오늘의 운세 보러 가기 →
        </Link>
      ) : (
        <PastFortune date={date} />
      )}

      {day && day.readings.length > 0 && (
        <div className="border-t border-border pt-3">
          <h3 className="text-sm font-medium">그날 본 타로</h3>
          <ul className="mt-1.5 flex flex-col gap-1 text-sm">
            {day.readings.map((r) => (
              <li key={r.query}>
                <Link href={`/tarot/r?${r.query}`} className="text-accent underline underline-offset-2">
                  {r.title}
                </Link>
                <span className="text-muted"> — {r.summary}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {day?.fortune && <RetroEditor date={date} day={day} />}
    </section>
  );
}

/** 방문하지 않은 지난 날 — 프로필과 날짜로 그날의 운세를 다시 계산한다 */
function PastFortune({ date }: { date: string }) {
  const profile = parseProfile(useStoredProfileRaw());
  const [state, setState] = useState<{ status: "idle" | "loading" } | { status: "error"; message: string } | { status: "done"; reading: TodayReading }>({
    status: "idle",
  });

  if (!profile) return <p className="text-sm text-muted">기록이 없는 날이에요.</p>;

  if (state.status === "done") {
    const { fortune, tarot } = state.reading;
    return (
      <div className="flex flex-col gap-1.5">
        <p className="font-bold">{fortune.headline}</p>
        <p className="text-sm text-muted">
          총운 {fortune.score}점 · 그날의 타로 {tarot.card.name}
          {tarot.reversed ? " 역방향" : ""}
        </p>
        <p className="text-sm leading-relaxed">{fortune.story}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm text-muted">이날은 운세를 보지 않았어요.</p>
      <button
        type="button"
        disabled={state.status === "loading"}
        onClick={async () => {
          setState({ status: "loading" });
          try {
            const res = await fetch("/api/today", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ ...profile, date }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data.error ?? "운세를 불러오지 못했어요.");
            setState({ status: "done", reading: data as TodayReading });
          } catch (e) {
            setState({ status: "error", message: e instanceof Error ? e.message : "인터넷 연결을 확인해 주세요." });
          }
        }}
        className="rounded-xl border border-accent py-2.5 text-sm font-medium text-accent disabled:opacity-50"
      >
        {state.status === "loading" ? "불러오는 중…" : "그날의 운세 다시 보기"}
      </button>
      {state.status === "error" && (
        <p role="alert" className="text-sm text-rose-600">
          {state.message}
        </p>
      )}
    </div>
  );
}

function RetroEditor({ date, day }: { date: string; day: JournalDay }) {
  const [hit, setHit] = useState<Hit | undefined>(day.hit);
  const [memo, setMemo] = useState(day.memo ?? "");
  const dirty = hit !== day.hit || memo.trim() !== (day.memo ?? "");
  return (
    <form
      className="flex flex-col gap-2 border-t border-border pt-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (hit) recordRetro(date, hit, memo);
      }}
    >
      <h3 className="text-sm font-medium">운세가 맞았나요?</h3>
      <div role="radiogroup" aria-label="운세가 맞았나요?" className="grid grid-cols-3 gap-2">
        {(Object.keys(HIT_LABEL) as Hit[]).map((value) => (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={hit === value}
            onClick={() => setHit(value)}
            className="rounded-xl border border-border py-2 text-sm font-medium aria-checked:border-accent aria-checked:bg-accent aria-checked:text-white dark:aria-checked:text-background"
          >
            {HIT_EMOJI[value]} {HIT_LABEL[value]}
          </button>
        ))}
      </div>
      <input
        value={memo}
        onChange={(e) => setMemo(e.target.value)}
        maxLength={MEMO_MAX}
        aria-label="한 줄 메모"
        placeholder="한 줄 메모 (선택)"
        className="rounded-xl border border-border bg-background px-3 py-2 text-sm"
      />
      <button
        type="submit"
        disabled={!hit || !dirty}
        className="rounded-xl bg-accent py-2 text-sm font-medium text-white disabled:opacity-40 dark:text-background"
      >
        {dirty || !day.hit ? "저장" : "저장됨"}
      </button>
    </form>
  );
}

function MonthStats({ days, month }: { days: JournalDay[]; month: number }) {
  const stats = useMemo(() => statsOf(days), [days]);
  const topName = stats.topCard && days.find((d) => d.tarot?.cardId === stats.topCard!.cardId)?.tarot?.name;
  const items = [
    { label: "방문", value: `${stats.visits}일` },
    { label: "평균 점수", value: stats.averageScore === null ? "–" : `${stats.averageScore}점` },
    { label: "적중률", value: stats.hitRate === null ? "–" : `${stats.hitRate}%`, note: stats.answered ? `회고 ${stats.answered}번` : undefined },
  ];
  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <h2 className="text-xs font-medium text-accent">{month}월 요약</h2>
      <dl className="mt-3 grid grid-cols-3 gap-2 text-center">
        {items.map((item) => (
          <div key={item.label}>
            <dt className="text-xs text-muted">{item.label}</dt>
            <dd className="mt-0.5 text-lg font-bold">{item.value}</dd>
            {item.note && <dd className="text-[11px] text-muted">{item.note}</dd>}
          </div>
        ))}
      </dl>
      {topName && (
        <p className="mt-3 text-center text-sm text-muted">
          이번 달 가장 자주 만난 카드는 <span className="font-medium text-foreground">{topName}</span> ({stats.topCard!.count}번)
        </p>
      )}
      {stats.visits === 0 && <p className="mt-3 text-center text-sm text-muted">이 달에는 아직 기록이 없어요.</p>}
    </section>
  );
}

function Badges({ journal, today }: { journal: Journal; today: string }) {
  const badges = badgesOf(journal, today);
  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <h2 className="text-xs font-medium text-accent">배지</h2>
      <ul className="mt-3 grid grid-cols-4 gap-2 text-center">
        {badges.map((b) => (
          <li key={b.id} title={b.description} className={b.earned ? "" : "opacity-40 grayscale"}>
            <span aria-hidden className="text-2xl">
              {b.emoji}
            </span>
            <p className="mt-0.5 text-xs font-medium">{b.label}</p>
            <p className="text-[11px] text-muted">{b.earned ? "획득" : b.progress ?? "아직"}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

function BackupPanel({ today }: { today: string }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  function download() {
    const blob = new Blob([JSON.stringify(exportBackup(), null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = backupFileName(today);
    a.click();
    URL.revokeObjectURL(url);
    setMessage({ ok: true, text: "백업 파일을 내려받았어요. 생년월일이 들어 있으니 안전한 곳에 보관하세요." });
  }

  async function upload(file: File) {
    try {
      const { days } = importBackup(await file.text());
      setMessage({ ok: true, text: `백업에서 ${days}일치 기록을 합쳤어요.` });
    } catch (e) {
      setMessage({ ok: false, text: e instanceof Error ? e.message : "백업 파일을 읽지 못했어요." });
    }
  }

  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 text-sm">
      <div>
        <h2 className="text-xs font-medium text-accent">기록 백업</h2>
        <p className="mt-1 leading-relaxed text-muted">
          기록은 이 기기의 브라우저에만 저장돼요. 브라우저 데이터를 지우면 사라지니, 기기를 바꾸기 전에 파일로 내보내 두세요.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button type="button" onClick={download} className="rounded-xl border border-border py-2.5 font-medium">
          내보내기
        </button>
        <button type="button" onClick={() => fileRef.current?.click()} className="rounded-xl border border-border py-2.5 font-medium">
          가져오기
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void upload(file);
            e.target.value = "";
          }}
        />
      </div>
      <p className="text-xs text-muted">가져오면 기기의 기록과 합쳐져요. 같은 날 기록은 기기에 있던 것을 남기고, 기기에 프로필이 없을 때만 백업의 프로필을 써요.</p>
      {message && (
        <p role="status" className={message.ok ? "text-accent" : "text-rose-600"}>
          {message.text}
        </p>
      )}
    </section>
  );
}
