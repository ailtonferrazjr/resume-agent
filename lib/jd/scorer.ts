import type { CandidateProfile } from "../candidate/profile";
import type { ParsedJD, RoleType } from "./parser";

export interface ScoreBreakdown {
  skillsMatch: {
    score: number;
    maxScore: 35;
    matched: string[];
    percentage: number;
  };
  seniorityFit: {
    score: number;
    maxScore: 20;
    detail: string;
    percentage: number;
  };
  locationMatch: {
    score: number;
    maxScore: 20;
    detail: string;
    percentage: number;
  };
  companyStage: {
    score: number;
    maxScore: 15;
    detail: string;
    percentage: number;
  };
  roleTypeFit: {
    score: number;
    maxScore: 10;
    detail: string;
    percentage: number;
  };
}

export interface ScoreResult {
  total: number;
  breakdown: ScoreBreakdown;
  recommendation: string;
  jdFile: string;
}

function flattenSkills(profile: CandidateProfile): string[] {
  return [
    ...profile.skills.engineering,
    ...profile.skills.operations,
    ...profile.skills.product,
    ...profile.skills.general,
  ];
}

function normalizeForMatch(text: string): string {
  return text.toLowerCase().replace(/[-_]/g, " ").trim();
}

// Expand common abbreviations to also check full forms
const SKILL_EXPANSIONS: Record<string, string[]> = {
  "sales ops": ["sales ops", "sales operations"],
  "revenue ops": ["revenue ops", "revenue operations"],
  "product ops": ["product ops", "product operations"],
  crm: ["crm"],
  gtm: ["gtm", "go to market", "go-to-market"],
  b2b: ["b2b"],
  saas: ["saas"],
  llm: ["llm", "large language model"],
  rag: ["rag", "retrieval augmented"],
  "rest api": ["rest api", "rest", "api"],
};

function skillMatchesJdText(skill: string, jdText: string): boolean {
  const normalized = normalizeForMatch(skill);

  // Direct inclusion check
  if (jdText.includes(normalized)) return true;

  // Check expanded forms
  const expansions = SKILL_EXPANSIONS[normalized];
  if (expansions) {
    return expansions.some((form) => jdText.includes(form));
  }

  // Check if skill is a substring of any word boundary match
  const escaped = normalized.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`\\b${escaped}\\b`);
  return pattern.test(jdText);
}

function scoreSkills(
  profile: CandidateProfile,
  jd: ParsedJD
): ScoreBreakdown["skillsMatch"] {
  const candidateSkills = flattenSkills(profile);

  // Combine JD keywords + requirements text for matching
  const jdTerms = [
    ...jd.keywords.map(normalizeForMatch),
    ...jd.requirements.map(normalizeForMatch),
  ];

  // Deduplicate JD keywords for scoring denominator
  const uniqueJdKeywords = [...new Set(jd.keywords.map(normalizeForMatch))];
  const denominator = Math.max(uniqueJdKeywords.length, 1);

  const jdFullText = jdTerms.join(" ");
  const matched: string[] = [];

  for (const skill of candidateSkills) {
    if (skillMatchesJdText(skill, jdFullText)) {
      matched.push(normalizeForMatch(skill));
    }
  }

  const uniqueMatched = [...new Set(matched)];
  const ratio = Math.min(uniqueMatched.length / denominator, 1);
  const score = Math.round(ratio * 35);

  return {
    score,
    maxScore: 35,
    matched: uniqueMatched,
    percentage: Math.round(ratio * 100),
  };
}

function parseLargestYearsRequired(signals: string[]): number | null {
  let maxYears = 0;
  for (const signal of signals) {
    const match = signal.match(/(\d+)/);
    if (match) {
      const years = parseInt(match[1], 10);
      if (years > maxYears) maxYears = years;
    }
  }
  return maxYears > 0 ? maxYears : null;
}

function getRelevantExperience(
  profile: CandidateProfile,
  roleType: RoleType
): { years: number; label: string } {
  switch (roleType) {
    case "engineering":
      return { years: profile.yearsExperience.engineering, label: "engineering" };
    case "product":
      return { years: profile.yearsExperience.operations, label: "ops/product" };
    case "biz-ops":
      return {
        years:
          profile.yearsExperience.operations + profile.yearsExperience.sales,
        label: `ops + sales`,
      };
    case "hybrid":
      return { years: profile.yearsExperience.total, label: "total" };
  }
}

function scoreSeniority(
  profile: CandidateProfile,
  jd: ParsedJD
): ScoreBreakdown["seniorityFit"] {
  const required = parseLargestYearsRequired(jd.senioritySignals);
  const relevant = getRelevantExperience(profile, jd.roleType);

  if (required === null) {
    return {
      score: 14,
      maxScore: 20,
      detail: "no years requirement found; defaulting to mid score",
      percentage: 70,
    };
  }

  const diff = required - relevant.years;
  let score: number;

  if (diff <= 0) {
    score = 20;
  } else if (diff <= 2) {
    score = 14;
  } else if (diff <= 4) {
    score = 8;
  } else {
    score = 4;
  }

  const detail = `JD asks ${required}+ yrs; candidate has ${relevant.years} yrs ${relevant.label}`;

  return {
    score,
    maxScore: 20,
    detail,
    percentage: Math.round((score / 20) * 100),
  };
}

function scoreLocation(
  profile: CandidateProfile,
  jd: ParsedJD
): ScoreBreakdown["locationMatch"] {
  const loc = jd.location.toLowerCase();
  let score: number;
  let detail: string;

  const isRemote =
    loc.includes("remote") ||
    jd.requirements.some((r) => r.toLowerCase().includes("remote"));

  if (isRemote && profile.location.remote) {
    score = 20;
    detail = "remote available";
  } else if (loc.includes(profile.location.city.toLowerCase())) {
    score = 20;
    detail = profile.location.city;
  } else if (loc.includes(profile.location.country.toLowerCase())) {
    score = 16;
    detail = profile.location.country;
  } else if (
    loc.includes(profile.location.region.toLowerCase()) ||
    loc.includes("europe")
  ) {
    score = 12;
    detail = profile.location.region;
  } else if (loc.includes("relocation")) {
    score = 8;
    detail = "relocation mentioned";
  } else {
    score = 0;
    detail = `location mismatch: ${jd.location}`;
  }

  // Combine remote + city match for best detail
  if (isRemote && loc.includes(profile.location.city.toLowerCase())) {
    detail = `${profile.location.city}, remote`;
  } else if (isRemote) {
    detail = "remote";
  }

  return {
    score,
    maxScore: 20,
    detail,
    percentage: Math.round((score / 20) * 100),
  };
}

function scoreCompanyStage(
  _profile: CandidateProfile,
  jd: ParsedJD
): ScoreBreakdown["companyStage"] {
  const signals = jd.companyStageSignals;

  if (signals.length === 0) {
    return {
      score: 10,
      maxScore: 15,
      detail: "no stage signals found",
      percentage: Math.round((10 / 15) * 100),
    };
  }

  let score: number;
  let detail: string;

  if (signals.includes("startup") || signals.includes("early-stage")) {
    score = 15;
    detail = "startup/early-stage signals";
  } else if (signals.includes("growth-stage")) {
    score = 15;
    detail = "growth-stage signals";
  } else if (signals.includes("scale-up")) {
    score = 12;
    detail = "scale-up signals";
  } else if (signals.includes("enterprise")) {
    score = 8;
    detail = "enterprise signals";
  } else {
    score = 10;
    detail = "unclear stage";
  }

  return {
    score,
    maxScore: 15,
    detail,
    percentage: Math.round((score / 15) * 100),
  };
}

function scoreRoleType(
  profile: CandidateProfile,
  jd: ParsedJD
): ScoreBreakdown["roleTypeFit"] {
  const index = profile.strongestRoleTypes.indexOf(jd.roleType);
  const scoreMap: Record<number, number> = { 0: 10, 1: 8, 2: 5, 3: 3 };
  const score = index >= 0 ? (scoreMap[index] ?? 3) : 3;

  return {
    score,
    maxScore: 10,
    detail: `${jd.roleType} role (rank ${index >= 0 ? index + 1 : "unranked"} of ${profile.strongestRoleTypes.length})`,
    percentage: Math.round((score / 10) * 100),
  };
}

function getRecommendation(total: number): string {
  if (total >= 80) return "STRONG APPLY";
  if (total >= 60) return "APPLY WITH TAILORING";
  if (total >= 40) return "CONSIDER";
  return "SKIP";
}

export function scoreJob(
  profile: CandidateProfile,
  jd: ParsedJD,
  jdFile: string = ""
): ScoreResult {
  const breakdown: ScoreBreakdown = {
    skillsMatch: scoreSkills(profile, jd),
    seniorityFit: scoreSeniority(profile, jd),
    locationMatch: scoreLocation(profile, jd),
    companyStage: scoreCompanyStage(profile, jd),
    roleTypeFit: scoreRoleType(profile, jd),
  };

  const total =
    breakdown.skillsMatch.score +
    breakdown.seniorityFit.score +
    breakdown.locationMatch.score +
    breakdown.companyStage.score +
    breakdown.roleTypeFit.score;

  return {
    total,
    breakdown,
    recommendation: getRecommendation(total),
    jdFile,
  };
}
