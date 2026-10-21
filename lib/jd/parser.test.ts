import { describe, expect, it } from "vitest";
import { parseJD } from "./parser";

const JD = `# Senior Backend Engineer

**Company:** Example Robotics
**Location:** Remote (Europe)

## About the Role
We are a Series B startup.

## Key Responsibilities
- Optimize the scheduling service
- Own on-call for the quoting API

## Requirements
- 5+ years of backend experience
- Strong PostgreSQL skills

## Keywords to mirror
TypeScript, PostgreSQL,
Kubernetes
`;

describe("parseJD", () => {
  const jd = parseJD(JD);

  it("reads title, company and location", () => {
    expect(jd.title).toBe("Senior Backend Engineer");
    expect(jd.company).toBe("Example Robotics");
    expect(jd.location).toBe("Remote (Europe)");
  });

  it("merges requirements and responsibilities, requirements first", () => {
    expect(jd.requirements).toEqual([
      "5+ years of backend experience",
      "Strong PostgreSQL skills",
      "Optimize the scheduling service",
      "Own on-call for the quoting API",
    ]);
  });

  it("does not cut a section at the letter z (regression)", () => {
    expect(jd.requirements).toContain("Optimize the scheduling service");
  });

  it("splits keywords on commas and newlines", () => {
    expect(jd.keywords).toEqual(["TypeScript", "PostgreSQL", "Kubernetes"]);
  });

  it("extracts years-of-experience signals", () => {
    expect(jd.senioritySignals.some((s) => s.startsWith("5+ years"))).toBe(true);
  });

  it("maps funding stage text to stage labels", () => {
    expect(jd.companyStageSignals).toEqual(expect.arrayContaining(["startup", "growth-stage"]));
  });

  it("infers an engineering role from the title", () => {
    expect(jd.roleType).toBe("engineering");
  });

  it("falls back to Unknown when header fields are missing", () => {
    const bare = parseJD("Just some text with no structure.");
    expect(bare.title).toBe("Unknown");
    expect(bare.company).toBe("Unknown");
    expect(bare.location).toBe("Unknown");
    expect(bare.requirements).toEqual([]);
    expect(bare.keywords).toEqual([]);
  });
});

describe("parseJD role type inference", () => {
  const roleFor = (title: string, keywords = "") =>
    parseJD(`# ${title}\n\n## Keywords to mirror\n${keywords}\n`).roleType;

  it("detects product roles", () => {
    expect(roleFor("Product Manager, Payments")).toBe("product");
  });

  it("detects business operations roles", () => {
    expect(roleFor("Revenue Ops Lead", "Salesforce")).toBe("biz-ops");
  });

  it("calls a role hybrid when two categories show up", () => {
    expect(roleFor("Product Manager", "software engineer background")).toBe("hybrid");
  });

  it("defaults to hybrid when nothing matches", () => {
    expect(roleFor("Chief of Staff")).toBe("hybrid");
  });
});
