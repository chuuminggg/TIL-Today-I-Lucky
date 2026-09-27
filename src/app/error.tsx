"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function Error({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center">
      <p className="text-5xl">🌧️</p>
      <h1 className="text-xl font-bold">잠시 문제가 생겼어요</h1>
      <p className="text-sm leading-relaxed text-muted">
        페이지를 보여 주는 중에 오류가 났어요. 잠시 뒤 다시 시도해 주세요.
        {error.digest && <span className="mt-1 block text-xs">오류 코드: {error.digest}</span>}
      </p>
      <div className="mt-2 flex w-full flex-col gap-2">
        <button type="button" onClick={() => retry()} className="rounded-xl bg-accent py-3 font-medium text-white dark:text-background">
          다시 시도
        </button>
        <Link href="/" className="rounded-xl border border-border py-3 font-medium">
          홈으로 가기
        </Link>
      </div>
    </main>
  );
}
