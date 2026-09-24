import { recommendNames, type NameCandidate, type NamingInput, type NamingResult } from "naming-house";
import { toSolarInput, type BirthProfile } from "@/lib/saju/adapter";

export interface NamingRequest extends BirthProfile {
  surname: string;
  surnameHanja?: string;
  candidates?: NameCandidate[];
  preferences?: NamingInput["preferences"];
}

export function recommend(request: NamingRequest): Promise<NamingResult> {
  const { birthDate, birthTime, gender } = toSolarInput(request);
  return recommendNames({
    surname: request.surname,
    surnameHanja: request.surnameHanja,
    birthDate,
    birthTime,
    gender,
    calendar: "solar",
    candidates: request.candidates,
    preferences: request.preferences,
  });
}
