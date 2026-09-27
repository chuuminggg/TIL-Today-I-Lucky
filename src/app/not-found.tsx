import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center">
      <p className="text-5xl">🃏</p>
      <h1 className="text-xl font-bold">찾는 페이지가 없어요</h1>
      <p className="text-sm leading-relaxed text-muted">주소가 바뀌었거나 잘못 입력된 것 같아요.</p>
      <div className="mt-2 flex w-full flex-col gap-2">
        <Link href="/" className="rounded-xl bg-accent py-3 font-medium text-white dark:text-background">
          🍀 오늘의 운세로 가기
        </Link>
        <Link href="/tarot/cards" className="rounded-xl border border-border py-3 font-medium">
          📖 타로 카드 사전 보기
        </Link>
      </div>
    </main>
  );
}
