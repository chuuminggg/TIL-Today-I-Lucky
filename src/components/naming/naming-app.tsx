"use client";

import { useMemo, useState } from "react";
import { COMPONENTS, GRADE_LABEL, type NameReport, type NamingReport } from "@/lib/naming/report";
import type { BirthProfileInput } from "@/lib/profile/schema";
import { parseProfile, useStoredProfileRaw } from "@/lib/profile/storage";
import { OnboardingForm } from "../onboarding-form";
import { Skeleton } from "../profile-gate";
import { usePostJson } from "../use-post-json";

interface NameForm {
  surname: string;
  surnameHanja: string;
  candidates: Array<{ givenName: string; hanjaName: string }>;
  avoid: string;
}

type Step = { name: "who" } | { name: "profile" } | { name: "names" } | { name: "result"; form: NameForm };

const EMPTY: NameForm = { surname: "", surnameHanja: "", candidates: [{ givenName: "", hanjaName: "" }, { givenName: "", hanjaName: "" }], avoid: "" };
const MAX_CANDIDATES = 5;

const GRADE_CLASS: Record<NameReport["grade"], string> = {
  excellent: "bg-accent text-white dark:text-background",
  good: "bg-accent-soft text-accent",
  fair: "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300",
  weak: "bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300",
};

const inputClass = "w-full min-w-0 rounded-xl border border-border bg-card px-3 py-2";

function toRequest(profile: BirthProfileInput, form: NameForm) {
  return {
    profile,
    surname: form.surname.trim(),
    surnameHanja: form.surnameHanja.trim() || undefined,
    candidates: form.candidates
      .filter((c) => c.givenName.trim())
      .map((c) => ({ givenName: c.givenName.trim(), hanjaName: c.hanjaName.trim() || undefined })),
    avoidSyllables: [...new Set(Array.from(form.avoid.replace(/[^가-힣]/g, "")))],
  };
}

export function NamingApp() {
  const myRaw = useStoredProfileRaw();
  const me = useMemo(() => parseProfile(myRaw), [myRaw]);
  const [step, setStep] = useState<Step>({ name: "who" });
  const [profile, setProfile] = useState<BirthProfileInput | null>(null);
  const [form, setForm] = useState<NameForm>(EMPTY);

  if (myRaw === undefined) return <Skeleton />;

  if (step.name === "who") {
    return (
      <section className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5">
        <h2 className="font-bold">누구의 이름을 볼까요?</h2>
        <p className="text-sm text-muted">이름 주인의 사주에서 부족한 기운을 이름이 얼마나 채워 주는지 봐요.</p>
        <button
          type="button"
          onClick={() => setStep({ name: "profile" })}
          className="rounded-xl bg-accent py-3 font-medium text-white dark:text-background"
        >
          👶 아기·다른 사람의 이름
        </button>
        <button
          type="button"
          disabled={!me}
          onClick={() => {
            setProfile(me);
            setStep({ name: "names" });
          }}
          className="rounded-xl border border-accent py-3 font-medium text-accent disabled:opacity-40"
        >
          🙋 내 이름 (개명 참고)
        </button>
        {!me && <p className="text-xs text-muted">홈에서 내 정보를 입력하면 내 이름도 볼 수 있어요.</p>}
      </section>
    );
  }

  if (step.name === "profile" || !profile) {
    return (
      <OnboardingForm
        initial={profile}
        title="이름 주인 정보"
        description="사주 계산에만 쓰고 저장하지 않아요. 아기라면 태어난 날과 시간을 넣어 주세요."
        nameLabel="부르는 이름 (선택)"
        namePlaceholder="예: 첫째"
        submitLabel="다음 — 이름 입력"
        onCancel={() => setStep({ name: "who" })}
        onSubmit={(next) => {
          setProfile(next);
          setStep({ name: "names" });
        }}
      />
    );
  }

  if (step.name === "result") {
    return <NamingResult profile={profile} form={step.form} onEdit={() => setStep({ name: "names" })} />;
  }

  return (
    <NamesForm
      profile={profile}
      form={form}
      onChange={setForm}
      onBack={() => setStep({ name: "who" })}
      onSubmit={() => setStep({ name: "result", form })}
    />
  );
}

function NamesForm({
  profile,
  form,
  onChange,
  onBack,
  onSubmit,
}: {
  profile: BirthProfileInput;
  form: NameForm;
  onChange: (form: NameForm) => void;
  onBack: () => void;
  onSubmit: () => void;
}) {
  const setCandidate = (i: number, patch: Partial<NameForm["candidates"][number]>) =>
    onChange({ ...form, candidates: form.candidates.map((c, j) => (j === i ? { ...c, ...patch } : c)) });
  const filled = form.candidates.some((c) => c.givenName.trim());

  return (
    <form
      className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <div className="flex items-center justify-between text-sm">
        <p className="text-muted">
          {profile.name ? `${profile.name} · ` : ""}
          {profile.birthDate}
          {profile.calendar === "lunar" ? " (음력)" : ""} {profile.birthTime ?? "시간 모름"}
        </p>
        <button type="button" onClick={onBack} className="shrink-0 text-muted underline underline-offset-2">
          바꾸기
        </button>
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 font-bold">성씨</legend>
        <div className="grid grid-cols-2 gap-2">
          <input
            required
            value={form.surname}
            onChange={(e) => onChange({ ...form, surname: e.target.value })}
            placeholder="한글 (예: 김)"
            aria-label="성씨 한글"
            maxLength={2}
            className={inputClass}
          />
          <input
            value={form.surnameHanja}
            onChange={(e) => onChange({ ...form, surnameHanja: e.target.value })}
            placeholder="한자 (예: 金)"
            aria-label="성씨 한자"
            maxLength={2}
            lang="zh-Hant"
            className={inputClass}
          />
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 font-bold">후보 이름 (최대 {MAX_CANDIDATES}개)</legend>
        {form.candidates.map((c, i) => (
          <div key={i} className="grid grid-cols-[1fr_1fr_auto] items-center gap-2">
            <input
              value={c.givenName}
              onChange={(e) => setCandidate(i, { givenName: e.target.value })}
              placeholder="한글 (예: 서아)"
              aria-label={`후보 ${i + 1} 한글`}
              maxLength={3}
              className={inputClass}
            />
            <input
              value={c.hanjaName}
              onChange={(e) => setCandidate(i, { hanjaName: e.target.value })}
              placeholder="한자 (선택)"
              aria-label={`후보 ${i + 1} 한자`}
              maxLength={3}
              lang="zh-Hant"
              className={inputClass}
            />
            <button
              type="button"
              aria-label={`후보 ${i + 1} 지우기`}
              disabled={form.candidates.length === 1}
              onClick={() => onChange({ ...form, candidates: form.candidates.filter((_, j) => j !== i) })}
              className="px-1 text-muted disabled:opacity-30"
            >
              ✕
            </button>
          </div>
        ))}
        {form.candidates.length < MAX_CANDIDATES && (
          <button
            type="button"
            onClick={() => onChange({ ...form, candidates: [...form.candidates, { givenName: "", hanjaName: "" }] })}
            className="rounded-xl border border-dashed border-border py-2 text-sm text-muted"
          >
            + 후보 추가
          </button>
        )}
        <p className="text-xs text-muted">한자를 넣으면 한자 획수로, 비워 두면 한글 획수로 채점해요(정밀도 낮음).</p>
      </fieldset>

      <label className="flex flex-col gap-1">
        <span className="font-bold">피하고 싶은 글자 (선택)</span>
        <input
          value={form.avoid}
          onChange={(e) => onChange({ ...form, avoid: e.target.value })}
          placeholder="예: 사, 망"
          maxLength={30}
          className={inputClass}
        />
      </label>

      <button type="submit" disabled={!form.surname.trim() || !filled} className="rounded-xl bg-accent py-3 font-medium text-white disabled:opacity-40 dark:text-background">
        이름 감정하기
      </button>
    </form>
  );
}

function NamingResult({ profile, form, onEdit }: { profile: BirthProfileInput; form: NameForm; onEdit: () => void }) {
  const state = usePostJson<NamingReport>("/api/naming", toRequest(profile, form), "이름을 감정하지 못했어요.");
  if (state.status === "loading") return <Skeleton heights={[30, 60, 60]} />;
  if (state.status === "error") {
    return (
      <div role="alert" className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5">
        <p>{state.message}</p>
        <button type="button" onClick={onEdit} className="rounded-xl bg-accent py-2.5 font-medium text-white dark:text-background">
          입력 고치기
        </button>
      </div>
    );
  }

  const report = state.data;
  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-2xl border border-border bg-card p-5">
        <h2 className="text-xs font-medium text-accent">이름으로 채우면 좋은 기운</h2>
        <ul className="mt-2 flex flex-wrap gap-1.5">
          {report.needed.map((e) => (
            <li key={e} className="rounded-full bg-accent-soft px-3 py-1 text-sm font-medium text-accent">
              {e}
            </li>
          ))}
        </ul>
        <p className="mt-2 text-sm leading-relaxed text-muted">{report.neededReason}</p>
        {report.warnings.map((w) => (
          <p key={w} className="mt-2 text-sm text-amber-700 dark:text-amber-400">
            ⚠️ {w}
          </p>
        ))}
      </section>

      {report.names.map((name) => (
        <NameCard key={name.fullName + (name.hanjaName ?? "")} name={name} />
      ))}

      <button type="button" onClick={onEdit} className="rounded-xl border border-accent py-2.5 font-medium text-accent">
        후보 바꿔서 다시 보기
      </button>
    </div>
  );
}

function NameCard({ name }: { name: NameReport }) {
  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-muted">{name.rank}위</p>
          <h3 className="text-xl font-bold">
            {name.fullName}
            {name.hanjaName && <span className="ml-1.5 text-base font-normal text-muted">{name.hanjaName}</span>}
          </h3>
          <p className="text-xs text-muted">{name.romanized}</p>
        </div>
        <div className="shrink-0 text-right">
          <p>
            <span className="text-3xl font-bold tabular-nums text-accent">{name.score}</span>
            <span className="text-sm text-muted">점</span>
          </p>
          <span className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${GRADE_CLASS[name.grade]}`}>
            {GRADE_LABEL[name.grade]}
          </span>
        </div>
      </div>

      <dl className="flex flex-col gap-2">
        {COMPONENTS.map((c) => {
          const value = name.components[c.key];
          return (
            <div key={c.key} className="text-sm">
              <div className="flex justify-between">
                <dt>{c.label}</dt>
                <dd className="tabular-nums text-muted">
                  {value} / {c.max}
                </dd>
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-border/60" aria-hidden>
                <div className="h-full rounded-full bg-accent" style={{ width: `${(value / c.max) * 100}%` }} />
              </div>
            </div>
          );
        })}
      </dl>

      <div className="text-sm">
        <p className="font-medium">글자별 획수 ({name.basis === "hanja" ? "한자" : "한글"} 기준)</p>
        <ul className="mt-1.5 flex flex-wrap gap-1.5">
          {name.strokes.map((s, i) => (
            <li key={i} className="rounded-lg border border-border px-2.5 py-1 text-center">
              <span className="text-base font-medium">{s.char}</span>
              <span className="ml-1 text-xs text-muted">
                {s.strokes}획 · {s.element}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-muted">
          {name.matched.length ? `채워 주는 보완 기운: ${name.matched.join("·")}` : "보완 기운과 겹치는 획수 오행이 없어요."}
          {name.clashing.length > 0 && <><br />보완 기운을 누를 수 있는 획수 오행: {name.clashing.join("·")}</>}
        </p>
      </div>

      {name.notes.length > 0 && (
        <ul className="list-disc space-y-1 pl-4 text-xs text-muted">
          {name.notes.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
      )}
    </section>
  );
}
