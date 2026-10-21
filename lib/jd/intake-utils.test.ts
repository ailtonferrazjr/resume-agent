import { describe, expect, it } from "vitest";
import {
  abbreviateRole,
  cleanCompanyName,
  cleanRoleName,
  formatRawJD,
  slugify,
} from "./intake-utils";
import { parseJD } from "./parser";

describe("cleanCompanyName", () => {
  it("strips long LinkedIn-style descriptions in parentheses", () => {
    expect(cleanCompanyName("Example (a tech-driven platform for logistics teams)")).toBe("Example");
  });

  it("keeps short intentional parentheticals", () => {
    expect(cleanCompanyName("Example (Stealth)")).toBe("Example (Stealth)");
  });
});

describe("cleanRoleName", () => {
  it("drops an em dash or en dash company suffix", () => {
    expect(cleanRoleName("Product Manager — Example")).toBe("Product Manager");
    expect(cleanRoleName("Product Manager – Example")).toBe("Product Manager");
  });

  it("drops a hyphen suffix only when it is the given company", () => {
    expect(cleanRoleName("Engineer - Example", "Example")).toBe("Engineer");
    expect(cleanRoleName("Full-Stack Engineer - Platform")).toBe("Full-Stack Engineer - Platform");
  });

  it("matches the company after cleaning its name", () => {
    expect(
      cleanRoleName("Engineer - Example", "Example (a tech-driven platform for logistics teams)")
    ).toBe("Engineer");
  });
});

describe("slugify", () => {
  it("lowercases, drops punctuation and collapses separators", () => {
    expect(slugify("  Senior Engineer, Platform & Infra!  ")).toBe("senior-engineer-platform-infra");
    expect(slugify("A -- B")).toBe("a-b");
  });
});

describe("abbreviateRole", () => {
  it("shortens common title words", () => {
    expect(abbreviateRole("Senior Software Engineer")).toBe("sr swe");
    expect(abbreviateRole("Engineering Manager")).toBe("em");
    expect(abbreviateRole("Junior Product Manager")).toBe("jr pm");
  });
});

describe("formatRawJD", () => {
  const raw = `Example Robotics builds scheduling software.
Location: Remote, Europe

What you'll do
- Build TypeScript services
- Run PostgreSQL in production

Requirements
- 5+ years of experience
- Comfortable with Docker
`;

  const md = formatRawJD(raw, "Example Robotics", "Backend Engineer", "https://example.com/jobs/1");

  it("writes the header fields the JD parser expects", () => {
    expect(md).toContain("**Company:** Example Robotics");
    expect(md).toContain("**Location:** Remote, Europe");
    expect(md).toContain("**Source:** https://example.com/jobs/1");
  });

  it("produces markdown that parseJD reads back into sections", () => {
    const parsed = parseJD(md);
    expect(parsed.company).toBe("Example Robotics");
    expect(parsed.location).toBe("Remote, Europe");
    expect(parsed.requirements).toEqual([
      "5+ years of experience",
      "Comfortable with Docker",
      "Build TypeScript services",
      "Run PostgreSQL in production",
    ]);
    expect(parsed.keywords).toEqual(
      expect.arrayContaining(["TypeScript", "PostgreSQL", "Docker", "backend", "engineer"])
    );
  });

  it("keeps all text as the About section when no headings are found", () => {
    const flat = formatRawJD("Line one\nLine two", "Co", "Role");
    expect(flat).toContain("## About the Role\nLine one\n\nLine two");
    expect(flat).not.toContain("## Requirements");
  });
});
