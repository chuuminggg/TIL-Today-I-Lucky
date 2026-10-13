"use client";

import { useMemo, useState } from "react";
import type { BirthProfileInput } from "@/lib/profile/schema";
import type { CompatDetail } from "@/lib/saju/compat";
import { RELATION_TYPES, type RelationType } from "@/lib/saju/detail-text";
import { parseFavorites, saveFavorite, sameBirth, useFavoritesRaw, type Favorite } from "@/lib/saju/favorites";
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

/** 결과 위 — 상대가 즐겨찾기에 없으면 저장 버튼 */
function SavePartner({ partner, favorites }: { partner: BirthProfileInput; favorites: Favorite[] }) {
  const [error, setError] = useState<string | null>(null);
  const saved = favorites.find((f) => sameBirth(f.profile, partner));
  if (saved) return <p className="text-center text-xs text-muted">⭐ 즐겨찾기에 있는 {saved.label}님이에요.</p>;
  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={() => {
          try {
            saveFavorite(partner.name ?? "", partner);
          } catch (err) {
            setError(err instanceof Error ? err.message : "저장하지 못했어요.");
          }
        }}
        className="rounded-xl border border-dashed border-accent/60 py-2.5 text-sm text-accent"
      >
        ⭐ {partner.name || "상대"}님 사주를 즐겨찾기에 저장
      </button>
      {error && (
        <p role="alert" className="text-center text-xs text-rose-600 dark:text-rose-400">
          {error}
        </p>
      )}
    </div>
  );
}

function CompatFlow({ me }: { me: BirthProfileInput }) {
  const favRaw = useFavoritesRaw();
  const favorites = useMemo(() => parseFavorites(favRaw), [favRaw]);
  // 내 사주의 즐겨찾기에서 "나와 궁합"으로 들어오면(/compat?with=id) 그 사람으로 바로 본다.
  // ProfileGate가 클라이언트에서만 이 컴포넌트를 그리므로 초기값에서 주소를 읽어도 된다.
  const [preset] = useState(() => {
    const id = new URLSearchParams(window.location.search).get("with");
    const favorite = favorites.find((f) => f.id === id);
    return favorite ? { ...favorite.profile, name: favorite.label } : null;
  });
  const [relation, setRelation] = useState<RelationType>("lover");
  // 상대 정보는 이 화면 안에서만 기억한다 (즐겨찾기에 저장하기 전까지는 기기에 남지 않음)
  const [partner, setPartner] = useState<BirthProfileInput | null>(preset);
  const [showResult, setShowResult] = useState(preset !== null);

  const choose = (next: BirthProfileInput) => {
    setPartner(next);
    setShowResult(true);
    window.scrollTo({ top: 0 });
  };

  if (showResult && partner) {
    return (
      <div className="flex flex-col gap-4">
        <SavePartner partner={partner} favorites={favorites} />
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
      </div>
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

      {favorites.length > 0 && (
        <section className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-5">
          <h2 className="font-bold">⭐ 즐겨찾기에서 고르기</h2>
          <div className="flex flex-wrap gap-1.5">
            {favorites.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => choose({ ...f.profile, name: f.label })}
                className="rounded-full border border-border px-3 py-1.5 text-sm hover:border-accent"
              >
                {f.label}
              </button>
            ))}
          </div>
        </section>
      )}

      <OnboardingForm
        initial={partner}
        title="상대 정보"
        description="상대 정보는 저장하지 않고 궁합 계산에만 써요. 결과에서 즐겨찾기에 저장할 수 있어요."
        nameLabel="상대 이름·닉네임 (선택)"
        namePlaceholder="상대"
        submitLabel="궁합 보기"
        onSubmit={choose}
      />
    </div>
  );
}

export function CompatApp() {
  return (
    <ProfileGate
      title="궁합 1/2단계 — 내 정보"
      description="먼저 내 정보를 입력하면 다음 단계에서 상대 정보를 넣어요. 내 정보는 이 기기에만 저장돼요."
      submitLabel="다음 — 상대 정보 입력"
    >
      {(me, key) => <CompatFlow key={key} me={me} />}
    </ProfileGate>
  );
}
