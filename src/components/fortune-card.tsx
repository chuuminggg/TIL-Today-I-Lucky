import type { TodayReading } from "@/lib/today";

const STRENGTH_KO = { strong: "신강", balanced: "중화", weak: "신약" } as const;

function Stars({ count }: { count: number }) {
  return (
    <span aria-label={`별 5개 중 ${count}개`} className="tracking-tight text-gold">
      {"★".repeat(count)}
      <span className="text-border">{"★".repeat(5 - count)}</span>
    </span>
  );
}

export function FortuneCard({ reading }: { reading: TodayReading }) {
  const { fortune, me } = reading;
  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-accent">오늘의 총운</p>
          <h2 className="mt-1 text-lg font-bold">{fortune.headline}</h2>
        </div>
        <div className="shrink-0 text-right">
          <span className="text-4xl font-bold tabular-nums text-accent">{fortune.score}</span>
          <span className="text-sm text-muted">점</span>
        </div>
      </div>

      <p className="leading-relaxed">{fortune.summary}</p>

      <ul className="flex flex-col gap-3 border-t border-border pt-4">
        {fortune.categories.map((c) => (
          <li key={c.category}>
            <div className="flex items-center justify-between text-sm font-medium">
              {c.label}
              <Stars count={c.stars} />
            </div>
            <p className="mt-1 text-sm leading-relaxed text-muted">{c.text}</p>
          </li>
        ))}
      </ul>

      <dl className="grid gap-2 rounded-xl bg-accent-soft p-4 text-sm">
        <div>
          <dt className="inline font-bold text-accent">조언 · </dt>
          <dd className="inline">{fortune.advice}</dd>
        </div>
        <div>
          <dt className="inline font-bold text-muted">주의 · </dt>
          <dd className="inline">{fortune.caution}</dd>
        </div>
      </dl>

      <details className="text-sm text-muted">
        <summary className="cursor-pointer select-none">
          내 사주 · {me.dayMaster} 일간, {STRENGTH_KO[me.strength]} — 점수 근거 보기
        </summary>
        <p className="mt-2 font-medium tracking-widest text-foreground">
          {me.pillars.join(" ")} <span className="text-xs tracking-normal text-muted">(연·월·일·시)</span>
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          {fortune.factors.map((f) => (
            <li key={f}>{f}</li>
          ))}
        </ul>
        {reading.limitations.map((l) => (
          <p key={l} className="mt-2 text-xs">※ {l}</p>
        ))}
      </details>
    </section>
  );
}
