import { basename } from "path";
import type { ScoreResult } from "./scorer";

export function formatScore(result: ScoreResult): string {
  const { breakdown: b } = result;
  const jdName = basename(result.jdFile, ".md");

  const pad = (label: string) => label.padEnd(18);
  const fmtLine = (label: string, score: number, max: number, pct: number, detail: string) =>
    `  ${pad(label)} ${String(score).padStart(2)}/${max}  (${String(pct).padStart(3)}%) — ${detail}`;

  const lines = [
    "",
    `Job Score: ${result.total}/100 — ${jdName}`,
    "",
    fmtLine(
      "Skills Match:",
      b.skillsMatch.score,
      b.skillsMatch.maxScore,
      b.skillsMatch.percentage,
      `matched: ${b.skillsMatch.matched.join(", ") || "none"}`
    ),
    fmtLine(
      "Seniority Fit:",
      b.seniorityFit.score,
      b.seniorityFit.maxScore,
      b.seniorityFit.percentage,
      b.seniorityFit.detail
    ),
    fmtLine(
      "Location:",
      b.locationMatch.score,
      b.locationMatch.maxScore,
      b.locationMatch.percentage,
      b.locationMatch.detail
    ),
    fmtLine(
      "Company Stage:",
      b.companyStage.score,
      b.companyStage.maxScore,
      b.companyStage.percentage,
      b.companyStage.detail
    ),
    fmtLine(
      "Role Type Fit:",
      b.roleTypeFit.score,
      b.roleTypeFit.maxScore,
      b.roleTypeFit.percentage,
      b.roleTypeFit.detail
    ),
    "",
    `Recommendation: ${result.recommendation}`,
    "",
  ];

  return lines.join("\n");
}
