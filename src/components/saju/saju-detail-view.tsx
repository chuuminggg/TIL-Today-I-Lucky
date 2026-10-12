"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { ChartCell, SajuDetail } from "@/lib/saju/detail";
import { buildSajuPrompt } from "@/lib/saju/prompt";
import { AskAi } from "../ask-ai";
import { ELEMENT_BAR, ELEMENT_TEXT } from "./element-style";

const card = "flex flex-col gap-3 rounded-2xl border border-border bg-card p-5";
const COLUMNS = ["시주", "일주", "월주", "연주"];

function Section({ title, children, note }: { title: string; children: React.ReactNode; note?: string }) {
  return (
    <section className={card}>
      <div>
        <h2 className="font-bold">{title}</h2>
        {note && <p className="mt-0.5 text-xs text-muted">{note}</p>}
      </div>
      {children}
    </section>
  );
}

function ChartTable({ chart }: { chart: SajuDetail["chart"] }) {
  const rows: Array<{ label: string; render: (c: ChartCell) => React.ReactNode }> = [
    { label: "십신", render: (c) => <span className="text-xs text-muted">{c.stem.tenGod}</span> },
    {
      label: "천간",
      render: (c) => (
        <span className={`flex flex-col items-center leading-none ${ELEMENT_TEXT[c.stem.element]}`}>
          <span className="text-3xl font-bold">{c.stem.hanja}</span>
          <span className="mt-1 text-xs">{c.stem.ko}</span>
        </span>
      ),
    },
    {
      label: "지지",
      render: (c) => (
        <span className={`flex flex-col items-center leading-none ${ELEMENT_TEXT[c.branch.element]}`}>
          <span className="text-3xl font-bold">{c.branch.hanja}</span>
          <span className="mt-1 text-xs">
            {c.branch.ko}·{c.branch.animal}
          </span>
        </span>
      ),
    },
    { label: "십신", render: (c) => <span className="text-xs text-muted">{c.branch.tenGod}</span> },
    {
      label: "지장간",
      render: (c) => (
        <span className="flex justify-center gap-0.5 text-xs">
          {c.hidden.map((h) => (
            <span key={h.ko} className={ELEMENT_TEXT[h.element]} title={h.tenGod}>
              {h.hanja}
            </span>
          ))}
        </span>
      ),
    },
  ];

  return (
    <table className="w-full table-fixed border-collapse text-center">
      <caption className="sr-only">사주팔자 명식 표 (시주·일주·월주·연주)</caption>
      <thead>
        <tr>
          <th className="w-12" />
          {COLUMNS.map((c, i) => (
            <th key={c} scope="col" className={`pb-1 text-xs font-medium ${i === 1 ? "text-accent" : "text-muted"}`}>
              {c}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, r) => (
          <tr key={r} className={r === 1 || r === 2 ? "" : "border-y border-border/60"}>
            <th scope="row" className="py-2 text-left text-xs font-normal text-muted">
              {row.label}
            </th>
            {chart.map((cell, i) => (
              <td key={i} className={`py-2 ${i === 1 && (r === 1 || r === 2) ? "bg-accent-soft/60" : ""}`}>
                {cell ? row.render(cell) : <span className="text-muted">?</span>}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Elements({ detail }: { detail: SajuDetail }) {
  const max = Math.max(...detail.elements.map((e) => e.count), 1);
  return (
    <ul className="flex flex-col gap-2">
      {detail.elements.map((e) => (
        <li key={e.element} className="grid grid-cols-[4.5rem_1fr_3.5rem] items-center gap-2 text-sm">
          <span className={ELEMENT_TEXT[e.element]}>{e.label}</span>
          <span className="h-2.5 overflow-hidden rounded-full bg-border/60">
            <span className={`block h-full rounded-full ${ELEMENT_BAR[e.element]}`} style={{ width: `${(e.count / max) * 100}%` }} />
          </span>
          <span className="text-right text-xs text-muted">
            {e.count}
            {e.state === "dominant" ? " · 많음" : e.state === "weak" ? " · 부족" : ""}
          </span>
        </li>
      ))}
    </ul>
  );
}

function Topics({ topics }: { topics: SajuDetail["topics"] }) {
  const [active, setActive] = useState(0);
  const topic = topics[active];
  return (
    <>
      <div role="tablist" aria-label="주제" className="flex gap-1 overflow-x-auto">
        {topics.map((t, i) => (
          <button
            key={t.type}
            type="button"
            role="tab"
            aria-selected={i === active}
            onClick={() => setActive(i)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-sm ${i === active ? "bg-accent text-white dark:text-background" : "bg-accent-soft text-accent"}`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div role="tabpanel" className="flex flex-col gap-2">
        <p className="leading-relaxed">{topic.summary}</p>
        <ul className="flex flex-col gap-1.5 text-sm leading-relaxed">
          {topic.guidance.map((g) => (
            <li key={g} className="flex gap-2">
              <span aria-hidden className="text-gold">✦</span>
              {g}
            </li>
          ))}
        </ul>
        <p className="text-xs text-muted">{topic.caveat}</p>
      </div>
    </>
  );
}

export function SajuDetailView({ detail, name }: { detail: SajuDetail; name?: string }) {
  const { dayMaster, strength, luck } = detail;
  const prompts = useMemo(() => [buildSajuPrompt(detail), buildSajuPrompt(detail, { compact: true })], [detail]);
  const current = luck.periods.find((p) => p.current);

  return (
    <div className="flex flex-col gap-4">
      <section className={`${card} border-2 border-gold/60`}>
        <p className="text-xs font-medium text-accent">{name ? `${name}님의 일간` : "나를 나타내는 일간"}</p>
        <h2 className="text-xl font-bold">
          <span className={ELEMENT_TEXT[dayMaster.element]}>{dayMaster.hanja}</span> {dayMaster.ko} — {dayMaster.image}
        </h2>
        <p className="leading-relaxed">{dayMaster.text}</p>
        <div className="flex flex-wrap gap-1.5 text-xs">
          <span className="rounded-full bg-accent-soft px-2.5 py-1 text-accent">{strength.label}</span>
          <span className="rounded-full bg-accent-soft px-2.5 py-1 text-accent">용신 {detail.yongsin.primary}</span>
          {current && <span className="rounded-full bg-gold/20 px-2.5 py-1 text-gold">지금 대운 {current.label}</span>}
        </div>
      </section>

      <Section title="사주팔자" note={detail.chart[0] ? "가운데 강조된 일주의 천간이 '나'예요." : "태어난 시간을 몰라 시주는 비워 두었어요."}>
        <ChartTable chart={detail.chart} />
      </Section>

      <Section title="오행 분포" note="목·화·토·금·수 기운이 사주에 얼마나 있는지">
        <Elements detail={detail} />
        <p className="text-sm leading-relaxed">
          <span className="font-medium">{strength.label}</span> — {strength.text}
        </p>
        <p className="rounded-xl bg-accent-soft p-3 text-sm leading-relaxed text-accent">
          🧭 용신 {detail.yongsin.primary} · 희신 {detail.yongsin.secondary}
          <span className="mt-1 block text-xs">{detail.yongsin.reasoning}</span>
        </p>
      </Section>

      <Section title="십신 분포" note="일간을 기준으로 다른 글자들이 나에게 어떤 역할인지">
        <ul className="grid grid-cols-5 gap-1 text-center text-xs">
          {detail.groups.map((g) => (
            <li key={g.group} className={`rounded-lg py-2 ${g.count ? "bg-accent-soft text-accent" : "bg-border/40 text-muted"}`}>
              <span className="block font-medium">{g.group}</span>
              {g.count}
            </li>
          ))}
        </ul>
        <p className="text-sm leading-relaxed">{detail.groupSummary}</p>
        {detail.relations.length > 0 && (
          <ul className="flex flex-col gap-1.5 border-t border-border pt-3 text-sm leading-relaxed">
            {detail.relations.map((r) => (
              <li key={`${r.between.join()}${r.kind}`}>{r.text}</li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="주제별 풀이">
        <Topics topics={detail.topics} />
      </Section>

      <Section
        title="대운 — 10년마다 바뀌는 큰 흐름"
        note={`${luck.forward ? "순행" : "역행"} · 만 ${luck.startAge}세부터${luck.approximate ? " · 태어난 시간을 몰라 시작 나이는 잠정이에요" : ""}`}
      >
        <ol className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1">
          {luck.periods.map((p) => (
            <li
              key={p.age}
              aria-current={p.current ? "step" : undefined}
              className={`flex w-24 shrink-0 flex-col gap-1 rounded-xl border p-2.5 text-center ${p.current ? "border-gold bg-gold/10" : "border-border"}`}
            >
              <span className="text-xs text-muted">{p.age}세~</span>
              <span className="text-lg font-bold">{p.hanja}</span>
              <span className="text-xs">
                {p.label} · {p.stemTenGod}
              </span>
              {p.yongsin && <span className="text-[0.65rem] text-accent">용신 대운</span>}
            </li>
          ))}
        </ol>
        {current && <p className="text-sm leading-relaxed">지금은 <span className="font-medium">{current.label} 대운</span>이에요. {current.text}</p>}
      </Section>

      <Section title="올해·내년 운">
        <ul className="flex flex-col gap-3">
          {detail.years.map((y) => (
            <li key={y.year}>
              <p className="text-sm font-medium">
                {y.year}년 {y.hanja}({y.label}) · <span className="text-muted">{y.tenGod}</span>
              </p>
              <p className="mt-0.5 text-sm leading-relaxed text-muted">{y.text}</p>
            </li>
          ))}
        </ul>
      </Section>

      <AskAi
        prompts={prompts}
        description="명식·대운·세운을 담은 상담 프롬프트를 만들어 두었어요. 사용 중인 AI에서 궁금한 점을 이어서 물어보세요."
        notice="생년월일시는 빼고 계산된 간지·오행만 선택한 AI 서비스로 전달돼요."
      />

      <Link href="/compat" className="rounded-xl bg-accent py-3 text-center font-medium text-white dark:text-background">
        💞 이 사주로 궁합 보기
      </Link>

      {detail.limitations.length > 0 && (
        <ul className="flex flex-col gap-1 text-xs leading-relaxed text-muted">
          {detail.limitations.map((l) => (
            <li key={l}>· {l}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
