"use client";

import type { BirthProfileInput } from "@/lib/profile/schema";
import type { SajuDetail } from "@/lib/saju/detail";
import { ProfileGate, Skeleton } from "../profile-gate";
import { usePostJson } from "../use-post-json";
import { SajuDetailView } from "./saju-detail-view";

function SajuLoader({ profile }: { profile: BirthProfileInput }) {
  const state = usePostJson<SajuDetail>("/api/saju", profile, "사주를 불러오지 못했어요.");
  if (state.status === "loading") return <Skeleton heights={[36, 64, 44, 44]} />;
  if (state.status === "error") {
    return (
      <p role="alert" className="rounded-2xl border border-border bg-card p-5">
        {state.message}
      </p>
    );
  }
  return <SajuDetailView detail={state.data} name={profile.name} />;
}

export function SajuApp() {
  // 프로필이 바뀌면 key가 바뀌어 새로 계산한다
  return <ProfileGate submitLabel="내 사주 보기">{(profile, key) => <SajuLoader key={key} profile={profile} />}</ProfileGate>;
}
