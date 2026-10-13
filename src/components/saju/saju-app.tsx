"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { attach } from "@/lib/josa";
import type { BirthProfileInput } from "@/lib/profile/schema";
import { parseProfile, saveProfile, useStoredProfileRaw } from "@/lib/profile/storage";
import type { SajuDetail } from "@/lib/saju/detail";
import { deleteFavorite, parseFavorites, saveFavorite, sameBirth, useFavoritesRaw, type Favorite } from "@/lib/saju/favorites";
import { OnboardingForm } from "../onboarding-form";
import { Skeleton } from "../profile-gate";
import { usePostJson } from "../use-post-json";
import { SajuDetailView } from "./saju-detail-view";

/** 지금 보고 있는 사주: 내 사주 / 즐겨찾기 / 저장하지 않는 1회 보기 */
type Subject = { kind: "me" } | { kind: "fav"; id: string } | { kind: "once-form" } | { kind: "once"; profile: BirthProfileInput };

const chip = (active: boolean) =>
  `shrink-0 rounded-full border px-3 py-1.5 text-sm transition ${active ? "border-accent bg-accent text-white dark:text-background" : "border-border bg-card"}`;

function SajuLoader({ profile, name }: { profile: BirthProfileInput; name?: string }) {
  const state = usePostJson<SajuDetail>("/api/saju", profile, "사주를 불러오지 못했어요.");
  if (state.status === "loading") return <Skeleton heights={[36, 64, 44, 44]} />;
  if (state.status === "error") {
    return (
      <p role="alert" className="rounded-2xl border border-border bg-card p-5">
        {state.message}
      </p>
    );
  }
  return <SajuDetailView detail={state.data} name={name} />;
}

function SubjectBar({ favorites, subject, onSelect }: { favorites: Favorite[]; subject: Subject; onSelect: (s: Subject) => void }) {
  return (
    <nav aria-label="누구의 사주를 볼까요" className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1">
      <button type="button" aria-pressed={subject.kind === "me"} onClick={() => onSelect({ kind: "me" })} className={chip(subject.kind === "me")}>
        🙋 나
      </button>
      {favorites.map((f) => {
        const active = subject.kind === "fav" && subject.id === f.id;
        return (
          <button key={f.id} type="button" aria-pressed={active} onClick={() => onSelect({ kind: "fav", id: f.id })} className={chip(active)}>
            ⭐ {f.label}
          </button>
        );
      })}
      <button
        type="button"
        aria-pressed={subject.kind === "once-form" || subject.kind === "once"}
        onClick={() => onSelect({ kind: "once-form" })}
        className={chip(subject.kind === "once-form" || subject.kind === "once")}
      >
        ＋ 다른 사람
      </button>
    </nav>
  );
}

/** 1회 보기 결과 위 — 저장하지 않는다는 안내와 즐겨찾기 저장 */
function OnceBanner({ profile, saved, onSaved }: { profile: BirthProfileInput; saved?: Favorite; onSaved: (id: string) => void }) {
  const [label, setLabel] = useState(profile.name ?? "");
  const [error, setError] = useState<string | null>(null);

  if (saved) {
    return (
      <p className="rounded-2xl bg-accent-soft p-4 text-sm text-accent">
        이미 즐겨찾기에 ‘{saved.label}’{attach(saved.label, "으로/로").slice(saved.label.length)} 저장된 사람이에요. 위의 ⭐ {attach(saved.label, "을/를")} 누르면 언제든 다시 볼 수 있어요.
      </p>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        try {
          onSaved(saveFavorite(label, profile));
        } catch (err) {
          setError(err instanceof Error ? err.message : "저장하지 못했어요.");
        }
      }}
      className="flex flex-col gap-2 rounded-2xl border border-dashed border-accent/60 bg-card p-4"
    >
      <p className="text-sm">
        👀 <span className="font-medium">1회 보기</span> — 이 사주는 저장되지 않아요. 다시 보고 싶다면 즐겨찾기에 저장하세요.
      </p>
      <div className="flex gap-2">
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          maxLength={20}
          placeholder="저장할 이름 (예: 엄마)"
          aria-label="저장할 이름"
          className="min-w-0 flex-1 rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none focus:border-accent"
        />
        <button type="submit" className="shrink-0 rounded-xl bg-accent px-3 py-2 text-sm font-medium text-white dark:text-background">
          ⭐ 저장
        </button>
      </div>
      {error && (
        <p role="alert" className="text-xs text-rose-600 dark:text-rose-400">
          {error}
        </p>
      )}
    </form>
  );
}

/** 즐겨찾기 결과 위 — 궁합 바로가기와 삭제(한 번 더 확인) */
function FavoriteBanner({ favorite, onDeleted }: { favorite: Favorite; onDeleted: () => void }) {
  const [confirming, setConfirming] = useState(false);
  return (
    <div className="flex items-center justify-between gap-2 rounded-2xl border border-border bg-card p-4 text-sm">
      <span>
        ⭐ <span className="font-medium">{favorite.label}</span>님의 사주
      </span>
      {confirming ? (
        <span className="flex shrink-0 gap-1.5">
          <button
            type="button"
            onClick={() => {
              deleteFavorite(favorite.id);
              onDeleted();
            }}
            className="rounded-lg bg-rose-600 px-2.5 py-1 text-white"
          >
            삭제
          </button>
          <button type="button" onClick={() => setConfirming(false)} className="rounded-lg border border-border px-2.5 py-1">
            취소
          </button>
        </span>
      ) : (
        <span className="flex shrink-0 gap-1.5">
          <Link href={`/compat?with=${favorite.id}`} className="rounded-lg bg-accent-soft px-2.5 py-1 text-accent">
            💞 나와 궁합
          </Link>
          <button type="button" onClick={() => setConfirming(true)} className="rounded-lg border border-border px-2.5 py-1 text-muted">
            삭제
          </button>
        </span>
      )}
    </div>
  );
}

export function SajuApp() {
  const myRaw = useStoredProfileRaw();
  const favRaw = useFavoritesRaw();
  const me = useMemo(() => parseProfile(myRaw), [myRaw]);
  const favorites = useMemo(() => parseFavorites(favRaw), [favRaw]);
  const [subject, setSubject] = useState<Subject>({ kind: "me" });

  if (myRaw === undefined || favRaw === undefined) return <Skeleton />;

  const select = (next: Subject) => {
    setSubject(next);
    window.scrollTo({ top: 0 });
  };

  let content: React.ReactNode;
  if (subject.kind === "fav" && favorites.some((f) => f.id === subject.id)) {
    const favorite = favorites.find((f) => f.id === subject.id)!;
    content = (
      <>
        <FavoriteBanner favorite={favorite} onDeleted={() => select({ kind: "me" })} />
        <SajuLoader key={favorite.id + JSON.stringify(favorite.profile)} profile={favorite.profile} name={favorite.label} />
      </>
    );
  } else if (subject.kind === "once-form") {
    content = (
      <OnboardingForm
        title="다른 사람 사주 보기"
        description="저장하지 않고 이번 한 번만 봐요. 결과에서 즐겨찾기에 저장할 수 있어요."
        nameLabel="이름·닉네임 (선택)"
        namePlaceholder="친구"
        submitLabel="사주 보기"
        onCancel={() => select({ kind: "me" })}
        onSubmit={(profile) => select({ kind: "once", profile })}
      />
    );
  } else if (subject.kind === "once") {
    const { profile } = subject;
    content = (
      <>
        <OnceBanner profile={profile} saved={favorites.find((f) => sameBirth(f.profile, profile))} onSaved={(id) => setSubject({ kind: "fav", id })} />
        <SajuLoader key={JSON.stringify(profile)} profile={profile} name={profile.name} />
      </>
    );
  } else if (!me) {
    content = <OnboardingForm submitLabel="내 사주 보기" onSubmit={saveProfile} />;
  } else {
    // 내 정보가 바뀌면 key가 바뀌어 새로 계산한다
    content = <SajuLoader key={myRaw ?? ""} profile={me} name={me.name} />;
  }

  return (
    <div className="flex flex-col gap-4">
      <SubjectBar favorites={favorites} subject={subject} onSelect={select} />
      {content}
    </div>
  );
}
