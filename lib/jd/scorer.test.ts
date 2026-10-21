import { describe, expect, it } from "vitest";
import type { CandidateProfile } from "../candidate/profile";
import type { ParsedJD } from "./parser";
import { scoreJob } from "./scorer";

function profile(overrides: Partial<CandidateProfile> = {}): CandidateProfile {
  return {
    skills: {
      engineering: ["TypeScript", "Go", "Node.js"],
      operations: ["GTM"],
      product: [],
      general: [],
    },
    titles: ["Software Engineer"],
    location: { city: "Lisbon", country: "Portugal", region: "EMEA", remote: true },
    yearsExperience: { engineering: 6, operations: 2, sales: 1, total: 9 },
    strongestRoleTypes: ["engineering", "hybrid", "product", "biz-ops"],
    ...overrides,
  };
}

function jd(overrides: Partial<ParsedJD> = {}): ParsedJD {
  return {
    title: "Engineer",
    company: "Example",
    location: "Lisbon, Portugal",
    requirements: [],
    keywords: [],
    senioritySignals: [],
    companyStageSignals: [],
    roleType: "engineering",
    ...overrides,
  };
}

describe("scoreJob: skills", () => {
  it("scores the share of JD keywords the candidate covers", () => {
    const result = scoreJob(profile(), jd({ keywords: ["TypeScript", "React", "Kafka", "Node.js"] }));
    expect(result.breakdown.skillsMatch.matched).toEqual(["typescript", "node.js"]);
    expect(result.breakdown.skillsMatch.percentage).toBe(50);
    expect(result.breakdown.skillsMatch.score).toBe(18); // round(0.5 * 35)
  });

  it("matches known abbreviations against their long form", () => {
    const result = scoreJob(profile(), jd({ keywords: ["go-to-market"] }));
    expect(result.breakdown.skillsMatch.matched).toContain("gtm");
  });

  it("does not match short skills inside longer words", () => {
    const result = scoreJob(profile(), jd({ keywords: ["Google Cloud", "MongoDB"] }));
    expect(result.breakdown.skillsMatch.matched).not.toContain("go");
  });

  it("caps the ratio at 100% when requirements add extra matches", () => {
    const result = scoreJob(
      profile(),
      jd({ keywords: ["TypeScript"], requirements: ["Go and Node.js services"] })
    );
    expect(result.breakdown.skillsMatch.score).toBe(35);
    expect(result.breakdown.skillsMatch.percentage).toBe(100);
  });
});

describe("scoreJob: seniority", () => {
  const seniority = (years: number, required: string[]) =>
    scoreJob(
      profile({ yearsExperience: { engineering: years, operations: 0, sales: 0, total: years } }),
      jd({ senioritySignals: required })
    ).breakdown.seniorityFit.score;

  it("steps down as the experience gap grows", () => {
    expect(seniority(6, ["5+ years"])).toBe(20);
    expect(seniority(4, ["5+ years"])).toBe(14);
    expect(seniority(2, ["5+ years"])).toBe(8);
    expect(seniority(0, ["5+ years"])).toBe(4);
  });

  it("uses the largest requirement when several are listed", () => {
    expect(seniority(6, ["3 years", "8+ years"])).toBe(14);
  });

  it("gives a mid score when the JD states no years", () => {
    expect(seniority(1, [])).toBe(14);
  });

  it("counts ops plus sales years for biz-ops roles", () => {
    const result = scoreJob(profile(), jd({ roleType: "biz-ops", senioritySignals: ["3 years"] }));
    expect(result.breakdown.seniorityFit.score).toBe(20);
    expect(result.breakdown.seniorityFit.detail).toContain("3 yrs ops + sales");
  });
});

describe("scoreJob: location", () => {
  const location = (loc: string, remote = true) =>
    scoreJob(
      profile({ location: { city: "Lisbon", country: "Portugal", region: "EMEA", remote } }),
      jd({ location: loc })
    ).breakdown.locationMatch.score;

  it("ranks remote and same city highest, then country, region, relocation", () => {
    expect(location("Remote")).toBe(20);
    expect(location("Lisbon")).toBe(20);
    expect(location("Porto, Portugal")).toBe(16);
    expect(location("Berlin, Europe")).toBe(12);
    expect(location("New York (relocation offered)")).toBe(8);
    expect(location("New York")).toBe(0);
  });

  it("ignores remote when the candidate does not want remote", () => {
    expect(location("Remote, New York", false)).toBe(0);
  });
});

describe("scoreJob: company stage and role type", () => {
  it("prefers startup and growth signals over enterprise", () => {
    const stage = (signals: string[]) =>
      scoreJob(profile(), jd({ companyStageSignals: signals })).breakdown.companyStage.score;
    expect(stage(["startup"])).toBe(15);
    expect(stage(["growth-stage"])).toBe(15);
    expect(stage(["scale-up"])).toBe(12);
    expect(stage(["enterprise"])).toBe(8);
    expect(stage([])).toBe(10);
  });

  it("scores role type by its rank in the candidate's list", () => {
    const fit = (roleType: ParsedJD["roleType"]) =>
      scoreJob(profile(), jd({ roleType })).breakdown.roleTypeFit.score;
    expect(fit("engineering")).toBe(10);
    expect(fit("hybrid")).toBe(8);
    expect(fit("product")).toBe(5);
    expect(fit("biz-ops")).toBe(3);
  });
});

describe("scoreJob: totals", () => {
  it("sums the five components and maps the total to a recommendation", () => {
    const strong = scoreJob(
      profile(),
      jd({
        keywords: ["TypeScript", "Node.js"],
        senioritySignals: ["5+ years"],
        companyStageSignals: ["startup"],
      }),
      "job-descriptions/example.md"
    );
    const b = strong.breakdown;
    expect(strong.total).toBe(
      b.skillsMatch.score + b.seniorityFit.score + b.locationMatch.score +
        b.companyStage.score + b.roleTypeFit.score
    );
    expect(strong.total).toBe(100);
    expect(strong.recommendation).toBe("STRONG APPLY");
    expect(strong.jdFile).toBe("job-descriptions/example.md");

    const weak = scoreJob(
      profile(),
      jd({ location: "Tokyo", keywords: ["Rust"], senioritySignals: ["15 years"], roleType: "biz-ops" })
    );
    expect(weak.recommendation).toBe("SKIP");
  });
});
