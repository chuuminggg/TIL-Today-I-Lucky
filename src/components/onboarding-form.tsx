"use client";

import { useState, type FormEvent } from "react";
import { birthProfileSchema, type BirthProfileInput } from "@/lib/profile/schema";

interface Props {
  initial?: BirthProfileInput | null;
  onSubmit: (profile: BirthProfileInput) => void;
  onCancel?: () => void;
}

const pad = (value: string) => value.padStart(2, "0");

function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: Array<[T, string]>;
  onChange: (value: T) => void;
  label: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="grid grid-cols-2 gap-1 rounded-xl bg-accent-soft p-1">
      {options.map(([key, text]) => (
        <button
          key={key}
          type="button"
          role="radio"
          aria-checked={value === key}
          onClick={() => onChange(key)}
          className={`rounded-lg py-2 text-sm font-medium transition ${
            value === key ? "bg-card text-accent shadow-sm" : "text-muted"
          }`}
        >
          {text}
        </button>
      ))}
    </div>
  );
}

const inputClass =
  "w-full rounded-xl border border-border bg-card px-3 py-2.5 text-base outline-none focus:border-accent";

export function OnboardingForm({ initial, onSubmit, onCancel }: Props) {
  const [initYear, initMonth, initDay] = initial?.birthDate.split("-") ?? ["", "", ""];
  const [name, setName] = useState(initial?.name ?? "");
  const [calendar, setCalendar] = useState<"solar" | "lunar">(initial?.calendar ?? "solar");
  const [isLeapMonth, setIsLeapMonth] = useState(initial?.isLeapMonth ?? false);
  const [year, setYear] = useState(initYear);
  const [month, setMonth] = useState(initMonth ? String(Number(initMonth)) : "");
  const [day, setDay] = useState(initDay ? String(Number(initDay)) : "");
  const [birthTime, setBirthTime] = useState(initial?.birthTime ?? "");
  const [timeUnknown, setTimeUnknown] = useState(initial ? !initial.birthTime : false);
  const [gender, setGender] = useState<"male" | "female">(initial?.gender ?? "female");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!timeUnknown && !birthTime) {
      setError("태어난 시간을 입력하거나 '시간을 몰라요'를 선택해 주세요.");
      return;
    }
    const parsed = birthProfileSchema.safeParse({
      name: name.trim() || undefined,
      calendar,
      isLeapMonth: calendar === "lunar" ? isLeapMonth : undefined,
      birthDate: `${year}-${pad(month)}-${pad(day)}`,
      birthTime: timeUnknown ? undefined : birthTime,
      gender,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "입력값을 확인해 주세요.");
      return;
    }
    setError(null);
    onSubmit(parsed.data);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-5">
      <div>
        <h2 className="text-lg font-bold">내 정보 입력</h2>
        <p className="mt-1 text-sm text-muted">정보는 이 기기에만 저장되고, 운세 계산에만 사용해요.</p>
      </div>

      <label className="flex flex-col gap-1.5 text-sm font-medium">
        이름 (선택)
        <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} maxLength={20} placeholder="행운이" />
      </label>

      <div className="flex flex-col gap-1.5 text-sm font-medium">
        생년월일
        <Segmented
          label="양력/음력"
          value={calendar}
          onChange={setCalendar}
          options={[["solar", "양력"], ["lunar", "음력"]]}
        />
        <div className="grid grid-cols-[1.4fr_1fr_1fr] gap-2">
          <input className={inputClass} inputMode="numeric" placeholder="1990" aria-label="년" value={year} onChange={(e) => setYear(e.target.value.replace(/\D/g, "").slice(0, 4))} />
          <input className={inputClass} inputMode="numeric" placeholder="월" aria-label="월" value={month} onChange={(e) => setMonth(e.target.value.replace(/\D/g, "").slice(0, 2))} />
          <input className={inputClass} inputMode="numeric" placeholder="일" aria-label="일" value={day} onChange={(e) => setDay(e.target.value.replace(/\D/g, "").slice(0, 2))} />
        </div>
        {calendar === "lunar" && (
          <label className="flex items-center gap-2 font-normal text-muted">
            <input type="checkbox" checked={isLeapMonth} onChange={(e) => setIsLeapMonth(e.target.checked)} />
            윤달이에요
          </label>
        )}
      </div>

      <div className="flex flex-col gap-1.5 text-sm font-medium">
        태어난 시간
        <input
          type="time"
          className={`${inputClass} disabled:opacity-40`}
          aria-label="태어난 시간"
          value={birthTime}
          disabled={timeUnknown}
          onChange={(e) => setBirthTime(e.target.value)}
        />
        <label className="flex items-center gap-2 font-normal text-muted">
          <input type="checkbox" checked={timeUnknown} onChange={(e) => setTimeUnknown(e.target.checked)} />
          시간을 몰라요 (시주 없이 풀이해요)
        </label>
      </div>

      <div className="flex flex-col gap-1.5 text-sm font-medium">
        성별
        <Segmented label="성별" value={gender} onChange={setGender} options={[["female", "여성"], ["male", "남성"]]} />
      </div>

      {error && (
        <p role="alert" className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}

      <div className="flex gap-2">
        {onCancel && (
          <button type="button" onClick={onCancel} className="flex-1 rounded-xl border border-border py-3 font-medium">
            취소
          </button>
        )}
        <button type="submit" className="flex-[2] rounded-xl bg-accent py-3 font-bold text-white dark:text-background">
          오늘의 운세 보기
        </button>
      </div>
    </form>
  );
}
