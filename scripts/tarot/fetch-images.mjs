// Wikimedia Commons의 라이더-웨이트-스미스(1909, 퍼블릭 도메인) 스캔 78장을 받아
// public/tarot/rws/{slug}.webp 로 변환한다.
//
//   node scripts/tarot/fetch-images.mjs          # 없는 파일만 받기
//   node scripts/tarot/fetch-images.mjs --force  # 전부 다시 받기
//
// 원본(960px 썸네일 jpg)은 assets/tarot/raw/ 에 보관한다 (git 제외).
import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const RAW_DIR = path.join(ROOT, "assets/tarot/raw");
const OUT_DIR = path.join(ROOT, "public/tarot/rws");
const WIDTH = 480; // 화면 최대 약 240px × 2배 밀도 — 종이 질감 때문에 용량이 커서 이 이상은 비효율
const FETCH_WIDTH = 960; // Commons 표준 썸네일 크기
const USER_AGENT = "TIL-Today-I-Lucky/0.1 (tarot image import script)";
const force = process.argv.includes("--force");

// src/lib/tarot/data 의 slug 규칙과 같아야 한다 (cards.test.ts가 파일 존재를 검사)
const MAJORS = [
  ["Fool", "the-fool"], ["Magician", "the-magician"], ["High Priestess", "the-high-priestess"],
  ["Empress", "the-empress"], ["Emperor", "the-emperor"], ["Hierophant", "the-hierophant"],
  ["Lovers", "the-lovers"], ["Chariot", "the-chariot"], ["Strength", "strength"], ["Hermit", "the-hermit"],
  ["Wheel of Fortune", "wheel-of-fortune"], ["Justice", "justice"], ["Hanged Man", "the-hanged-man"],
  ["Death", "death"], ["Temperance", "temperance"], ["Devil", "the-devil"], ["Tower", "the-tower"],
  ["Star", "the-star"], ["Moon", "the-moon"], ["Sun", "the-sun"], ["Judgement", "judgement"], ["World", "the-world"],
];
const RANKS = ["ace", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "page", "knight", "queen", "king"];
const SUITS = [["Wands", "wands"], ["Cups", "cups"], ["Swords", "swords"], ["Pents", "pentacles"]];

const pad = (n) => String(n).padStart(2, "0");
const CARDS = [
  ...MAJORS.map(([name, slug], i) => ({ file: `RWS Tarot ${pad(i)} ${name}.jpg`, slug })),
  ...SUITS.flatMap(([prefix, suit]) => RANKS.map((rank, i) => ({ file: `${prefix}${pad(i + 1)}.jpg`, slug: `${rank}-of-${suit}` }))),
];

async function thumbUrls(files) {
  const params = new URLSearchParams({
    action: "query",
    titles: files.map((f) => `File:${f}`).join("|"),
    prop: "imageinfo",
    iiprop: "url",
    iiurlwidth: String(FETCH_WIDTH),
    format: "json",
    formatversion: "2",
  });
  const res = await fetch(`https://commons.wikimedia.org/w/api.php?${params}`, { headers: { "User-Agent": USER_AGENT } });
  if (!res.ok) throw new Error(`Commons API ${res.status}`);
  const { query } = await res.json();
  const byTitle = new Map(query.pages.map((p) => [p.title, p]));
  for (const { from, to } of query.normalized ?? []) byTitle.set(from, byTitle.get(to));
  return files.map((f) => {
    const page = byTitle.get(`File:${f}`);
    const url = page?.imageinfo?.[0]?.thumburl;
    if (!url) throw new Error(`Commons에서 찾을 수 없음: ${f}`);
    return url;
  });
}

async function download(url, dest) {
  for (let attempt = 1; ; attempt++) {
    const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
    if (res.ok) return writeFile(dest, Buffer.from(await res.arrayBuffer()));
    if (attempt >= 4 || (res.status !== 429 && res.status < 500)) throw new Error(`${res.status} ${url}`);
    await new Promise((r) => setTimeout(r, 2000 * attempt));
  }
}

await mkdir(RAW_DIR, { recursive: true });
await mkdir(OUT_DIR, { recursive: true });

const todo = CARDS.filter(({ slug }) => force || !existsSync(path.join(OUT_DIR, `${slug}.webp`)));
console.log(`${todo.length}/${CARDS.length}장 처리`);

for (let i = 0; i < todo.length; i += 50) {
  const batch = todo.slice(i, i + 50);
  const urls = await thumbUrls(batch.map((c) => c.file));
  for (const [j, card] of batch.entries()) {
    const raw = path.join(RAW_DIR, `${card.slug}.jpg`);
    if (force || !existsSync(raw)) {
      await download(urls[j], raw);
      await new Promise((r) => setTimeout(r, 300)); // Commons에 부담을 주지 않도록 천천히
    }
    await sharp(raw).resize({ width: WIDTH }).webp({ quality: 70 }).toFile(path.join(OUT_DIR, `${card.slug}.webp`));
    console.log(`✓ ${card.slug}`);
  }
}
