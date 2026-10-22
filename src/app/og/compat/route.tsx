import { ImageResponse } from "next/og";
import { OG_COLOR, OG_SIZE, OgFrame, ogFonts } from "@/lib/og";
import { parseCompatShare } from "@/lib/saju/compat-share";
import { compatHeadline, RELATION_TYPES } from "@/lib/saju/detail-text";
import { SITE_URL } from "@/lib/site";

// 궁합 공유 주소(/compat?a=…)의 미리보기 이미지 — 닉네임 두 개, 관계, 점수, 점수로 만든 한 줄
export async function GET(request: Request) {
  const share = parseCompatShare(Object.fromEntries(new URL(request.url).searchParams));
  if (!share) return new Response("잘못된 궁합 공유 주소입니다.", { status: 400 });

  const relation = RELATION_TYPES[share.relation];
  const label = `${relation.label} 궁합`;
  const headline = compatHeadline(share.score);
  const score = `${share.score}점`;
  const cta = "우리 궁합도 볼까요?";
  const host = new URL(SITE_URL).host;

  return new ImageResponse(
    (
      <OgFrame>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 18 }}>
          <span style={{ fontSize: 32, color: OG_COLOR.accent }}>
            {relation.emoji} {label}
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 36, fontSize: 60 }}>
            <span>{share.a}</span>
            <span>💞</span>
            <span>{share.b}</span>
          </div>
          <span style={{ fontSize: 120, lineHeight: 1.1, color: OG_COLOR.gold }}>{score}</span>
          <span style={{ fontSize: 36 }}>{headline}</span>
          <span style={{ fontSize: 26, color: OG_COLOR.muted }}>{cta}</span>
        </div>
      </OgFrame>
    ),
    {
      ...OG_SIZE,
      fonts: await ogFonts(`TIL — Today I Lucky ${host} ${label} ${share.a} ${share.b} ${score} ${headline} ${cta}`),
      headers: { "Cache-Control": "public, max-age=86400, s-maxage=31536000, immutable" },
    },
  );
}
