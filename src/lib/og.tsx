// 공유 미리보기(OG) 이미지 공통 — 한글 글꼴과 바탕
import type { ReactNode } from "react";
import { SITE_URL } from "./site";

export const OG_COLOR = { gold: "#e0bf6a", muted: "#a39db3", accent: "#a88cf0" };

export const OG_SIZE = { width: 1200, height: 630 };

/**
 * 이미지에 들어갈 글자만 담은 Noto Sans KR(굵게)을 Google Fonts에서 받는다.
 * 한글 전체 글꼴은 수 MB라 이미지 번들 한도(500KB)를 넘으므로 그때그때 필요한 글자만 받는다.
 * 서버의 기본 User-Agent에는 Satori가 읽을 수 있는 TTF를 준다. 실패하면 null(글꼴 없이 그림).
 */
export async function loadKoreanFont(text: string): Promise<ArrayBuffer | null> {
  try {
    const chars = [...new Set(text)].join("");
    const css = await fetch(`https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@700&text=${encodeURIComponent(chars)}`, {
      cache: "force-cache",
    }).then((res) => (res.ok ? res.text() : ""));
    const url = css.match(/src: url\((.+?)\) format\('(?:opentype|truetype)'\)/)?.[1];
    if (!url) return null;
    const res = await fetch(url, { cache: "force-cache" });
    return res.ok ? await res.arrayBuffer() : null;
  } catch {
    return null;
  }
}

export async function ogFonts(text: string) {
  const data = await loadKoreanFont(text);
  return data ? [{ name: "Noto Sans KR", data, weight: 700 as const, style: "normal" as const }] : [];
}

/** 사이트 어두운 테마 색(globals.css)과 아래쪽 사이트 이름 */
export function OgFrame({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: "linear-gradient(135deg, #14121c 0%, #2a2340 100%)",
        color: "#eeeaf6",
        fontFamily: "Noto Sans KR",
        padding: "48px 64px",
      }}
    >
      <div style={{ flex: 1, display: "flex" }}>{children}</div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 26, color: "#e0bf6a" }}>
        <span>TIL — Today I Lucky</span>
        <span style={{ color: "#a39db3" }}>{new URL(SITE_URL).host}</span>
      </div>
    </div>
  );
}
