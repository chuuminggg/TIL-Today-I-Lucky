"use client";

import { useState } from "react";
import type { BirthProfileInput } from "@/lib/profile/schema";
import type { CompatDetail } from "@/lib/saju/compat";
import { RELATION_TYPES, type RelationType } from "@/lib/saju/detail-text";
import { OnboardingForm } from "../onboarding-form";
import { ProfileGate, Skeleton } from "../profile-gate";
import { usePostJson } from "../use-post-json";
import { CompatResultView } from "./compat-result-view";

const RELATIONS = Object.keys(RELATION_TYPES) as RelationType[];

function CompatLoader({
  me,
  partner,
  relation,
  onRetry,
}: {
  me: BirthProfileInput;
  partner: BirthProfileInput;
  relation: RelationType;
  onRetry: () => void;
}) {
  const state = usePostJson<CompatDetail>("/api/compat", { me, partner, relation }, "궁합을 계산하지 못했어요.");
  if (state.status === "loading") return <Skeleton heights={[44, 36, 56]} />;
  if (state.status === "error") {
    return (
      <div role="alert" className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5">
        <p>{state.message}</p>
        <button type="button" onClick={onRetry} className="rounded-xl bg-accent py-2.5 font-medium text-white dark:text-background">
          입력 다시 하기
        </button>
      </div>
    );
  }
  return <CompatResultView detail={state.data} onRetry={onRetry} />;
}

function CompatFlow({ me }: { me: BirthProfileInput }) {
  const [relation, setRelation] = useState<RelationType>("lover");
  // 상대 정보는 이 화면 안에서만 기억한다 (기기에 저장하지 않음)
  const [partner, setPartner] = useState<BirthProfileInput | null>(null);
  const [showResult, setShowResult] = useState(false);

  if (showResult && partner) {
    return (
      <CompatLoader
        key={JSON.stringify([relation, partner])}
        me={me}
        partner={partner}
        relation={relation}
        onRetry={() => {
          setShowResult(false);
          window.scrollTo({ top: 0 });
        }}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <section className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-5">
        <h2 className="font-bold">어떤 관계인가요?</h2>
        <div role="radiogroup" aria-label="관계" className="grid grid-cols-5 gap-1.5">
          {RELATIONS.map((r) => (
            <button
              key={r}
              type="button"
              role="radio"
              aria-checked={relation === r}
              onClick={() => setRelation(r)}
              className={`flex flex-col items-center gap-0.5 rounded-xl border py-2 text-xs transition ${
                relation === r ? "border-accent bg-accent-soft text-accent" : "border-border"
              }`}
            >
              <span aria-hidden className="text-lg">
                {RELATION_TYPES[r].emoji}
              </span>
              {RELATION_TYPES[r].label}
            </button>
          ))}
        </div>
        <p className="text-xs text-muted">
          나({me.name || "저장된 내 정보"})의 사주로 궁합을 봐요. 내 정보는 홈의 &lsquo;정보 수정&rsquo;에서 바꿀 수 있어요.
        </p>
      </section>

      <OnboardingForm
        initial={partner}
        title="상대 정보"
        description="상대 정보는 저장하지 않고 궁합 계산에만 써요."
        nameLabel="상대 이름·닉네임 (선택)"
        namePlaceholder="상대"
        submitLabel="궁합 보기"
        onSubmit={(next) => {
          setPartner(next);
          setShowResult(true);
          window.scrollTo({ top: 0 });
        }}
      />
    </div>
  );
}

export function CompatApp() {
  return <ProfileGate submitLabel="다음 — 상대 정보 입력">{(me, key) => <CompatFlow key={key} me={me} />}</ProfileGate>;
}
