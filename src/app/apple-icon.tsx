import { appIcon } from "@/lib/app-icon";

// iOS 홈 화면 아이콘 — iOS가 모서리를 직접 둥글리므로 꽉 찬 사각형으로
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return appIcon(180, { maskable: true });
}
