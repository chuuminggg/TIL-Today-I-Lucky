/**
 * 휴대폰은 기기 공유 창, 없으면 클립보드에 "문구 + 주소" 복사.
 * 사용자가 공유 창을 닫으면 "cancelled", 둘 다 안 되면 예외.
 */
export async function shareOrCopy({ title, text, url }: { title: string; text: string; url: string }) {
  try {
    if (navigator.share) {
      await navigator.share({ title, text, url });
      return "shared" as const;
    }
    await navigator.clipboard.writeText(`${text} ${url}`);
    return "copied" as const;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") return "cancelled" as const;
    throw error;
  }
}
