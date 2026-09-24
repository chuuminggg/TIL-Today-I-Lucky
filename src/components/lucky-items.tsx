import type { LuckyItems as Lucky } from "@/lib/saju/luck";

export function LuckyItems({ lucky }: { lucky: Lucky }) {
  const items: Array<[string, React.ReactNode]> = [
    [
      "색",
      <span key="color" className="inline-flex items-center gap-1.5">
        <span aria-hidden className="size-3 rounded-full border border-border" style={{ background: lucky.colorHex }} />
        {lucky.color}
      </span>,
    ],
    ["숫자", lucky.numbers.join(", ")],
    ["방향", lucky.direction],
    ["시간", lucky.time],
    ["아이템", lucky.item],
  ];

  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <h2 className="text-xs font-medium text-accent">오늘의 행운</h2>
      <p className="mt-1 text-sm text-muted">나에게 필요한 {lucky.elementKo} 기운을 채워 주는 것들</p>
      <ul className="mt-3 flex flex-wrap gap-2">
        {items.map(([label, value]) => (
          <li key={label} className="rounded-full bg-accent-soft px-3 py-1.5 text-sm">
            <span className="text-muted">{label}</span> <span className="font-medium">{value}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
