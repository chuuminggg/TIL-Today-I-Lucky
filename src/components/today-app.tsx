"use client";

import { useEffect, useMemo, useState } from "react";
import { parseProfile, saveProfile, useStoredProfileRaw } from "@/lib/profile/storage";
import type { BirthProfileInput } from "@/lib/profile/schema";
import type { TodayReading } from "@/lib/today";
import { FortuneCard } from "./fortune-card";
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
        setState({ status: "done", reading: data as TodayReading });
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
    </div>
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
