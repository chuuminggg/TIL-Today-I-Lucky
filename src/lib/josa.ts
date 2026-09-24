// 숫자로 끝나는 이름(예: "소드 2")은 읽는 소리의 받침으로 판단한다: 영 일 이 삼 사 오 육 칠 팔 구
const DIGIT_HAS_FINAL = [true, true, false, true, false, false, true, true, true, false];

// 받침 번호 (0 = 없음, 8 = ㄹ). 숫자는 읽는 소리 기준: 1(일)·7(칠)·8(팔)은 ㄹ
function finalConsonant(word: string): number {
  const last = word.trim().at(-1) ?? "";
  if (/\d/.test(last)) return DIGIT_HAS_FINAL[Number(last)] ? ("178".includes(last) ? 8 : 1) : 0;
  const code = last.charCodeAt(0) - 0xac00;
  if (code < 0 || code > 11171) return 0;
  return code % 28;
}

const hasFinalConsonant = (word: string) => finalConsonant(word) !== 0;

/** 받침에 맞는 조사를 붙인다 — josa("사과", "을", "를") → "사과를" */
export const josa = (word: string, withFinal: string, withoutFinal: string) =>
  `${word}${hasFinalConsonant(word) ? withFinal : withoutFinal}`;

/**
 * "받침 있을 때/없을 때" 쌍으로 조사를 붙인다 — attach("사과", "을/를") → "사과를".
 * "으로/로"는 ㄹ 받침도 "로"를 쓴다 — attach("서울", "으로/로") → "서울로".
 */
export function attach(word: string, pair: string): string {
  const [withFinal, withoutFinal] = pair.split("/");
  const final = finalConsonant(word);
  if (withFinal === "으로") return `${word}${final === 0 || final === 8 ? "로" : "으로"}`;
  return `${word}${final !== 0 ? withFinal : withoutFinal}`;
}
