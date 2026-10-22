import { appIcon } from "@/lib/app-icon";

// /icons/192, /icons/512, /icons/maskable-512 — 빌드 때 한 번 그려 정적 파일로 둔다
const ICONS = { "192": { size: 192 }, "512": { size: 512 }, "maskable-512": { size: 512, maskable: true } } as const;

export const dynamicParams = false;

export function generateStaticParams() {
  return Object.keys(ICONS).map((size) => ({ size }));
}

export async function GET(_request: Request, { params }: RouteContext<"/icons/[size]">) {
  const { size } = await params;
  const icon = ICONS[size as keyof typeof ICONS];
  return appIcon(icon.size, { maskable: "maskable" in icon });
}
