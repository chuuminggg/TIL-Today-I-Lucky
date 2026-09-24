// 숫자로 끝나는 이름(예: "소드 2")은 읽는 소리의 받침으로 판단한다: 영 일 이 삼 사 오 육 칠 팔 구
const DIGIT_HAS_FINAL = [true, true, false, true, false, false, true, true, true, false];

function hasFinalConsonant(word: string): boolean {
  const last = word.trim().at(-1) ?? "";
  if (/\d/.test(last)) return DIGIT_HAS_FINAL[Number(last)];
  const code = last.charCodeAt(0) - 0xac00;
  if (code < 0 || code > 11171) return false;
  return code % 28 !== 0;
}

/** 받침에 맞는 조사를 붙인다 — josa("사과", "을", "를") → "사과를" */
export const josa = (word: string, withFinal: string, withoutFinal: string) =>
  `${word}${hasFinalConsonant(word) ? withFinal : withoutFinal}`;
