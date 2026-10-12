"use client";

import { useMemo } from "react";
import type { Reading } from "@/lib/tarot/interpret";
import { buildAiPrompt } from "@/lib/tarot/prompt";
import { AskAi as AskAiBase } from "../ask-ai";

/** 타로 결과를 ChatGPT·Gemini에서 이어 보기 — 주소에는 전체 프롬프트가 길면 짧은 판을 싣는다 */
export function AskAi({ reading }: { reading: Reading }) {
  const prompts = useMemo(() => [buildAiPrompt(reading), buildAiPrompt(reading, { compact: true })], [reading]);
  return (
    <AskAiBase
      prompts={prompts}
      description="카드 상징까지 풀어 달라는 상세 프롬프트를 만들어 두었어요. 사용 중인 AI에서 이어서 대화해 보세요."
      notice="질문과 카드 결과가 선택한 AI 서비스로 전달돼요."
    />
  );
}
