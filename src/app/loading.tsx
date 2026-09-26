export default function Loading() {
  return (
    <main aria-busy className="mx-auto flex w-full max-w-md flex-1 flex-col gap-5 px-4 py-8">
      <div className="flex flex-col gap-2">
        <div className="h-4 w-32 animate-pulse rounded bg-border/60" />
        <div className="h-8 w-48 animate-pulse rounded bg-border/60" />
      </div>
      {[40, 24, 56].map((h) => (
        <div key={h} className="animate-pulse rounded-2xl bg-border/60" style={{ height: `${h * 4}px` }} />
      ))}
      <span className="sr-only">불러오는 중…</span>
    </main>
  );
}
