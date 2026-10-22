"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { CompatDetail, CompatPerson } from "@/lib/saju/compat";
import { compatShareQuery } from "@/lib/saju/compat-share";
import { RELATION_TYPES } from "@/lib/saju/detail-text";
import { buildCompatPrompt } from "@/lib/saju/prompt";
import { shareOrCopy } from "@/lib/share";
import { AskAi } from "../ask-ai";
import { ELEMENT_TEXT } from "./element-style";

const card = "flex flex-col gap-3 rounded-2xl border border-border bg-card p-5";

function PersonCard({ person }: { person: CompatPerson }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-xl bg-accent-soft/60 p-3 text-center">
      <span className="text-sm font-bold">{person.nickname}</span>
      <span className={`text-3xl font-bold ${ELEMENT_TEXT[person.dayMaster.element]}`}>{person.dayMaster.hanja}</span>
      <span className="text-xs">{person.dayMaster.image}</span>
      <span className="text-xs text-muted">{person.animal}띠</span>
      <span className="text-[0.7rem] leading-snug text-muted">
        강한 기운 {person.dominant.join("·") || "고른 편"}
        <br />
        약한 기운 {person.weak.join("·") || "고른 편"}
      </span>
    </div>
  );
}

function List({ title, items, mark }: { title: string; items: string[]; mark: string }) {
  return (
    <div>
      <h3 className="text-sm font-bold">{title}</h3>
      <ul className="mt-1.5 flex flex-col gap-1.5 text-sm leading-relaxed">
        {items.map((item) => (
          <li key={item} className="flex gap-2">
            <span aria-hidden>{mark}</span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** 공유에는 닉네임·점수·관계만 — 생년월일은 넣지 않고, 링크는 결과가 아닌 궁합 시작 화면(미리보기 이미지에 점수) */
function ShareButton({ detail }: { detail: CompatDetail }) {
  const [message, setMessage] = useState<string | null>(null);
  const [a, b] = detail.people;

  async function share() {
    const query = compatShareQuery({ a: a.nickname, b: b.nickname, score: detail.score, relation: detail.relation });
    const url = `${window.location.origin}/compat?${query}`;
    const text = `${a.nickname} 💞 ${b.nickname} ${RELATION_TYPES[detail.relation].label} 궁합 ${detail.score}점 — ${detail.headline}. 나도 궁합 보기 👉`;
    try {
      const result = await shareOrCopy({ title: "TIL 궁합", text, url });
      if (result === "copied") setMessage("공유 문구를 복사했어요. 생년월일은 들어가지 않아요.");
    } catch {
      setMessage("공유하지 못했어요.");
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <button type="button" onClick={share} className="rounded-xl border border-accent py-3 text-sm font-medium text-accent">
        🔗 결과 공유하기
      </button>
      {message && (
        <p role="status" className="text-center text-xs text-muted">
          {message}
        </p>
      )}
    </div>
  );
}

export function CompatResultView({ detail, onRetry }: { detail: CompatDetail; onRetry: () => void }) {
  const [a, b] = detail.people;
  const relation = RELATION_TYPES[detail.relation];
  const prompts = useMemo(() => [buildCompatPrompt(detail)], [detail]);

  return (
    <div className="flex flex-col gap-4">
      <section className={`${card} items-center border-2 border-gold/60 text-center`}>
        <p className="text-xs font-medium text-accent">
          {relation.emoji} {relation.label} 궁합
        </p>
        <p className="text-lg font-bold">
          {a.nickname} 💞 {b.nickname}
        </p>
        <p>
          <span className="text-5xl font-bold tabular-nums text-accent">{detail.score}</span>
          <span className="text-sm text-muted">점</span>
        </p>
        <span className="h-2 w-full overflow-hidden rounded-full bg-border/60">
          <span className="block h-full rounded-full bg-accent" style={{ width: `${detail.score}%` }} />
        </span>
        <p className="font-medium">{detail.headline}</p>
      </section>

      <section className={card}>
        <div className="grid grid-cols-2 gap-2">
          <PersonCard person={a} />
          <PersonCard person={b} />
        </div>
        <p className="text-sm leading-relaxed">{detail.elementBond}</p>
      </section>

      <section className={card}>
        <h2 className="font-bold">서로에게 어떤 사람일까</h2>
        <div>
          <p className="text-sm font-medium">
            {a.nickname}에게 {b.nickname} · <span className="text-accent">{detail.roles.meToPartner.tenGod}</span>
          </p>
          <p className="mt-0.5 text-sm leading-relaxed text-muted">{detail.roles.meToPartner.text}</p>
        </div>
        <div>
          <p className="text-sm font-medium">
            {b.nickname}에게 {a.nickname} · <span className="text-accent">{detail.roles.partnerToMe.tenGod}</span>
          </p>
          <p className="mt-0.5 text-sm leading-relaxed text-muted">{detail.roles.partnerToMe.text}</p>
        </div>
        <div className="border-t border-border pt-3 text-sm leading-relaxed">
          <p>
            <span className="font-medium">생활 궁합</span>
            {detail.dayBranch.relations.length > 0 && <span className="text-muted"> (일지 {detail.dayBranch.relations.join("·")})</span>} —{" "}
            {detail.dayBranch.text}
          </p>
          <p className="mt-1">
            <span className="font-medium">띠</span> — {detail.zodiac.text}
          </p>
        </div>
      </section>

      <section className={card}>
        <List title="잘 맞는 점" items={detail.goods} mark="💚" />
        <List title="조심할 점" items={detail.cautions} mark="⚠️" />
        <List title={`${relation.label} 관계를 위한 팁`} items={detail.tips} mark="💡" />
      </section>

      <AskAi
        prompts={prompts}
        description="두 사람의 명식과 궁합 분석을 담은 프롬프트를 만들어 두었어요. 대화법까지 이어서 물어보세요."
        notice="생년월일시는 빼고 닉네임과 계산된 간지만 선택한 AI 서비스로 전달돼요."
      />

      <ShareButton detail={detail} />

      <div className="grid grid-cols-2 gap-2">
        <button type="button" onClick={onRetry} className="rounded-xl border border-border py-3 text-sm font-medium">
          다른 사람과 보기
        </button>
        <Link href="/tarot" className="rounded-xl bg-accent py-3 text-center text-sm font-medium text-white dark:text-background">
          🔮 관계 타로 보기
        </Link>
      </div>

      <ul className="flex flex-col gap-1 text-xs leading-relaxed text-muted">
        {[...detail.focusAreas.slice(-1), ...detail.limitations].map((l) => (
          <li key={l}>· {l}</li>
        ))}
      </ul>
    </div>
  );
}
