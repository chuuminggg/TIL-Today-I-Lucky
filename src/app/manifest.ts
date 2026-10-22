import type { MetadataRoute } from "next";

// 홈 화면에 추가(PWA) — 계산은 서버에서 하므로 오프라인 기능은 두지 않는다
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "TIL — Today I Lucky",
    short_name: "TIL",
    description: "매일 확인하는 오늘의 사주 운세와 타로 한 장",
    lang: "ko",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#faf7f2",
    theme_color: "#6d4bc3",
    icons: [
      { src: "/icons/192", sizes: "192x192", type: "image/png" },
      { src: "/icons/512", sizes: "512x512", type: "image/png" },
      { src: "/icons/maskable-512", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
