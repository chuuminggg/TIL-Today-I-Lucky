// 홈 화면 아이콘·파비콘 공통 그림 — 보라 바탕에 금색 별과 TIL
import { ImageResponse } from "next/og";

export function appIcon(size: number, { maskable = false } = {}) {
  // 마스크 아이콘은 가장자리가 잘려도 되도록 안쪽 80%에 그린다
  const inner = maskable ? size * 0.8 : size;
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#6d4bc3",
          borderRadius: maskable ? 0 : size * 0.22,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", color: "#e0bf6a", lineHeight: 1 }}>
          {/* 기본 글꼴에 ✦ 글자가 없어 네 갈래 별을 직접 그린다 */}
          <svg width={inner * 0.3} height={inner * 0.3} viewBox="0 0 100 100">
            <path d="M50 0 C55 35 65 45 100 50 C65 55 55 65 50 100 C45 65 35 55 0 50 C35 45 45 35 50 0Z" fill="#e0bf6a" />
          </svg>
          <div style={{ fontSize: inner * 0.26, fontWeight: 700, letterSpacing: inner * 0.01, marginTop: inner * 0.04 }}>TIL</div>
        </div>
      </div>
    ),
    { width: size, height: size },
  );
}
