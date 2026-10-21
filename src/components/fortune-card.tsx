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

      <p className="leading-relaxed">{fortune.story}</p>

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

      <div className="grid gap-2 sm:grid-cols-2">
        <section className="rounded-xl bg-accent-soft p-4 text-sm">
          <h3 className="font-bold text-accent">👍 오늘 해 보면 좋은 것</h3>
          <p className="mt-1.5 leading-relaxed">{fortune.advice}</p>
        </section>
        <section className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm dark:border-rose-900 dark:bg-rose-950/40">
          <h3 className="font-bold text-rose-700 dark:text-rose-300">✋ 오늘 피하면 좋은 것</h3>
          <ul className="mt-1.5 list-disc space-y-1 pl-4 leading-relaxed">
            {fortune.avoid.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      </div>

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
