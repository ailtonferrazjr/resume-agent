import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

export interface CandidateProfile {
  skills: {
    engineering: string[];
    operations: string[];
    product: string[];
    general: string[];
  };
  titles: string[];
  location: {
    city: string;
    country: string;
    region: string;
    remote: boolean;
  };
  yearsExperience: {
    engineering: number;
    operations: number;
    sales: number;
    total: number;
  };
  strongestRoleTypes: Array<"engineering" | "hybrid" | "product" | "biz-ops">;
}

const PROFILE_PATH = resolve("docs/candidate-profile.json");

export function loadCandidateProfile(): CandidateProfile {
  if (!existsSync(PROFILE_PATH)) {
    throw new Error(
      "No candidate profile found at docs/candidate-profile.json.\n" +
      "Run /onboard to create your profile, or create the file manually."
    );
  }
  const raw = readFileSync(PROFILE_PATH, "utf-8");
  return JSON.parse(raw) as CandidateProfile;
}
