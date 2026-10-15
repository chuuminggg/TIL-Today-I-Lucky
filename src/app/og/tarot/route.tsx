import { ImageResponse } from "next/og";
import { cardOgImage } from "@/components/tarot/card-face";
import { readingFromShare } from "@/lib/tarot/share";
import { TOPICS } from "@/lib/tarot/spreads";
import { OG_COLOR, OG_SIZE, OgFrame, ogFonts } from "@/lib/og";
import { SITE_URL } from "@/lib/site";

// 타로 공유 주소(/tarot/r)의 미리보기 이미지 — 앞 3장 + "+N장", 주제, 결론 한 줄. 질문은 넣지 않는다.
// 공유 주소의 쿼리는 opengraph-image 파일 규칙으로 받을 수 없어 라우트 핸들러로 만든다.

const SHOWN = 3;
const CARD_WIDTH = 180;
const CARD_HEIGHT = Math.round((CARD_WIDTH * 830) / 480);

export async function GET(request: Request) {
  // 주소에 질문이 실려 있어도 그림에는 쓰지 않는다
  const reading = readingFromShare(Object.fromEntries(new URL(request.url).searchParams));
  if (!reading) return new Response("잘못된 타로 공유 주소입니다.", { status: 400 });

  const topic = TOPICS[reading.topic];
  const shown = reading.cards.slice(0, SHOWN);
  const rest = reading.cards.length - shown.length;
  const sameName = topic.label.replace(/\s/g, "") === reading.spread.name.replace(/\s/g, "");
  const heading = sameName ? topic.label : `${topic.label} · ${reading.spread.name}`;
  const verdict = reading.verdict ? `${reading.verdict.label} — ` : "";
  const conclusion = `${verdict}${reading.summary.title}`;
  const advice = reading.advice.length > 60 ? `${reading.advice.slice(0, 59)}…` : reading.advice;
  const restLabel = `+${rest}장`;
  const host = new URL(SITE_URL).host;

  return new ImageResponse(
    (
      <OgFrame>
        <div style={{ display: "flex", alignItems: "center", gap: 18, marginRight: 48 }}>
          {shown.map((c) => (
            // eslint-disable-next-line @next/next/no-img-element -- ImageResponse는 <img>만 그린다
            <img
              key={c.position.key}
              src={new URL(cardOgImage(c.card), request.url).toString()}
              width={CARD_WIDTH}
              height={CARD_HEIGHT}
              alt=""
              style={{ borderRadius: 14, border: `3px solid ${OG_COLOR.gold}`, ...(c.reversed ? { transform: "rotate(180deg)" } : {}) }}
            />
          ))}
          {rest > 0 && <span style={{ fontSize: 40, color: OG_COLOR.gold }}>{restLabel}</span>}
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 20 }}>
          <span style={{ fontSize: 30, color: OG_COLOR.accent }}>
            {topic.emoji} {heading}
          </span>
          <span style={{ fontSize: 46, lineHeight: 1.3 }}>{conclusion}</span>
          <span style={{ fontSize: 28, lineHeight: 1.45, color: OG_COLOR.muted }}>💡 {advice}</span>
        </div>
      </OgFrame>
    ),
    {
      ...OG_SIZE,
      fonts: await ogFonts(`TIL — Today I Lucky ${host} ${heading} ${conclusion} ${advice} ${restLabel}`),
      // 같은 주소면 같은 그림 — 메신저 미리보기 서버가 여러 번 불러도 다시 그리지 않게
      headers: { "Cache-Control": "public, max-age=86400, s-maxage=31536000, immutable" },
    },
  );
}
