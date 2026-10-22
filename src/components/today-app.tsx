"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { streakOf } from "@/lib/journal/journal";
import { recordFortune, useJournal } from "@/lib/journal/storage";
import { parseProfile, saveProfile, useStoredProfileRaw } from "@/lib/profile/storage";
import type { BirthProfileInput } from "@/lib/profile/schema";
import { buildTodayPrompt } from "@/lib/saju/today-prompt";
import type { TodayReading } from "@/lib/today";
import { AskAi } from "./ask-ai";
import { FortuneCard } from "./fortune-card";
import { InstallHint } from "./journal/install-hint";
import { RetroCard } from "./journal/retro-card";
import { LuckyItems } from "./lucky-items";
import { OnboardingForm } from "./onboarding-form";
import { TarotCard } from "./tarot-card";

type State = { status: "loading" } | { status: "error"; message: string } | { status: "done"; reading: TodayReading };

function Skeleton() {
  return (
    <div aria-busy className="flex flex-col gap-4">
      {[40, 24, 56].map((h) => (
        <div key={h} className="animate-pulse rounded-2xl bg-border/60" style={{ height: `${h * 4}px` }} />
      ))}
    </div>
  );
}

function TodayView({ profile, onEdit }: { profile: BirthProfileInput; onEdit: () => void }) {
  const [state, setState] = useState<State>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/today", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profile),
      signal: controller.signal,
    })
      .catch(() => {
        throw new Error("인터넷 연결을 확인하고 다시 시도해 주세요.");
      })
      .then(async (res) => {
        // 서버 오류로 HTML이 오는 경우에도 안내 문구를 보여 주도록 JSON 파싱 실패는 빈 객체로
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error ?? "운세를 불러오지 못했어요.");
        const reading = data as TodayReading;
        // 방문 기록 — 달력 표시용 요약과 오늘의 타로만 남긴다 (결과는 날짜로 다시 계산된다)
        const { card, reversed } = reading.tarot;
        recordFortune(
          reading.date,
          { score: reading.fortune.score, headline: reading.fortune.headline },
          { cardId: card.id, name: card.name, slug: card.slug, reversed },
        );
        setState({ status: "done", reading });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setState({ status: "error", message: error instanceof Error ? error.message : "운세를 불러오지 못했어요." });
      });
    return () => controller.abort();
  }, [profile, attempt]);

  if (state.status === "loading") return <Skeleton />;

  if (state.status === "error") {
    return (
      <div role="alert" className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5">
        <p>{state.message}</p>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => {
              setState({ status: "loading" });
              setAttempt((n) => n + 1);
            }}
            className="rounded-xl bg-accent py-2.5 font-medium text-white dark:text-background"
          >
            다시 시도
          </button>
          <button type="button" onClick={onEdit} className="rounded-xl border border-border py-2.5 font-medium">
            정보 수정하기
          </button>
        </div>
      </div>
    );
  }

  const { reading } = state;
  return (
    <div className="flex flex-col gap-4">
      <JournalBar today={reading.date} />
      <div className="flex items-center justify-between text-sm">
        <p>
          <span className="font-bold">{profile.name ? `${profile.name}님` : "오늘의 나"}</span>
          <span className="text-muted"> · 오늘은 {reading.iljin.label}({reading.iljin.hanja})일, {reading.iljin.animal}의 날</span>
        </p>
        <button type="button" onClick={onEdit} className="shrink-0 text-muted underline underline-offset-2">
          정보 수정
        </button>
      </div>
      <FortuneCard reading={reading} />
      <LuckyItems lucky={reading.lucky} />
      <TarotCard drawn={reading.tarot} date={reading.date} />
      <AskAi
        prompts={[buildTodayPrompt(reading), buildTodayPrompt(reading, { compact: true })]}
        description="오늘의 일진과 내 명식, 점수 근거를 담은 상담 프롬프트를 만들어 두었어요. 사용 중인 AI에서 오늘 하루를 더 자세히 물어보세요."
        notice="생년월일시는 빼고 계산된 간지·점수만 선택한 AI 서비스로 전달돼요."
      />
    </div>
  );
}

/** 연속 방문 · 캘린더 바로가기 · 회고 · 홈 화면 추가 안내 */
function JournalBar({ today }: { today: string }) {
  const journal = useJournal();
  if (!journal) return null;
  const streak = streakOf(journal, today);
  const visits = Object.values(journal).filter((d) => d.fortune).length;
  return (
    <>
      <Link
        href="/calendar"
        className="flex items-center justify-between rounded-2xl border border-border bg-card px-4 py-3 text-sm"
      >
        <span>
          <span className="font-bold">🔥 {streak.current}일째</span>
          <span className="text-muted"> 이어서 보는 중{streak.best > streak.current && ` · 최고 ${streak.best}일`}</span>
        </span>
        <span className="font-medium text-accent">📅 TIL 캘린더 →</span>
      </Link>
      <RetroCard journal={journal} today={today} />
      <InstallHint visits={visits} />
    </>
  );
}

export function TodayApp() {
  const raw = useStoredProfileRaw();
  const profile = useMemo(() => parseProfile(raw), [raw]);
  const [editing, setEditing] = useState(false);

  if (raw === undefined) return <Skeleton />;

  if (!profile || editing) {
    return (
      <OnboardingForm
        initial={profile}
        onCancel={profile ? () => setEditing(false) : undefined}
        onSubmit={(next) => {
          saveProfile(next);
          setEditing(false);
        }}
      />
    );
  }

  // 프로필이 바뀌면 key가 바뀌어 새로 불러온다
  return <TodayView key={raw} profile={profile} onEdit={() => setEditing(true)} />;
}
