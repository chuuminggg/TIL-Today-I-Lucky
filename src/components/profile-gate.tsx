"use client";

import { useMemo, type ReactNode } from "react";
import type { BirthProfileInput } from "@/lib/profile/schema";
import { parseProfile, saveProfile, useStoredProfileRaw } from "@/lib/profile/storage";
import { OnboardingForm } from "./onboarding-form";

export function Skeleton({ heights = [40, 24, 56] }: { heights?: number[] }) {
  return (
    <div aria-busy className="flex flex-col gap-4">
      {heights.map((h, i) => (
        <div key={i} className="animate-pulse rounded-2xl bg-border/60" style={{ height: `${h * 4}px` }} />
      ))}
    </div>
  );
}

/** 이 기기에 저장된 내 프로필이 있으면 children을, 없으면 입력 폼을 보여 준다 */
export function ProfileGate({
  submitLabel,
  title,
  description,
  children,
}: {
  submitLabel: string;
  title?: string;
  description?: string;
  children: (profile: BirthProfileInput, key: string) => ReactNode;
}) {
  const raw = useStoredProfileRaw();
  const profile = useMemo(() => parseProfile(raw), [raw]);

  if (raw === undefined) return <Skeleton />;
  if (!profile || !raw) return <OnboardingForm title={title} description={description} submitLabel={submitLabel} onSubmit={saveProfile} />;
  return <>{children(profile, raw)}</>;
}
