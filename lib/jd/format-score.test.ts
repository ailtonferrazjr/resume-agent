import { describe, expect, it } from "vitest";
import { formatScore } from "./format-score";
import type { ScoreResult } from "./scorer";

describe("formatScore", () => {
  it("prints the total, each component and the recommendation", () => {
    const result: ScoreResult = {
      total: 61,
      jdFile: "job-descriptions/example-backend.md",
      recommendation: "APPLY WITH TAILORING",
      breakdown: {
        skillsMatch: { score: 21, maxScore: 35, matched: [], percentage: 60 },
        seniorityFit: { score: 14, maxScore: 20, detail: "JD asks 5+ yrs", percentage: 70 },
        locationMatch: { score: 12, maxScore: 20, detail: "Europe", percentage: 60 },
        companyStage: { score: 8, maxScore: 15, detail: "enterprise signals", percentage: 53 },
        roleTypeFit: { score: 6, maxScore: 10, detail: "hybrid role", percentage: 60 },
      },
    };

    const out = formatScore(result);
    expect(out).toContain("Job Score: 61/100");
    expect(out).toContain("example-backend");
    expect(out).not.toContain(".md");
    expect(out).toMatch(/Skills Match:\s+21\/35\s+\( 60%\).*matched: none/);
    expect(out).toContain("Recommendation: APPLY WITH TAILORING");
  });
});
