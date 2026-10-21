import { describe, expect, it } from "vitest";
import { parseInlineBold, parseResume } from "./parser";

const RESUME = `# Jane Example

**Email:** jane@example.com | **LinkedIn:** [linkedin.com/in/jane](https://linkedin.com/in/jane)
**Phone:** +1 555 0100 | **Location:** Berlin, Germany

---

## SUMMARY

Backend engineer with six years in payments.
Likes boring, reliable systems.

---

## PROFESSIONAL EXPERIENCE

### Acme Payments — Senior Engineer
**Berlin, Germany | Jan 2021 | Present**

- Cut settlement time by **40%** with a new batching job
- Owned the ledger service

**Stack:** TypeScript, PostgreSQL

### Widget Co - Engineer
**Remote | 2018 - 2020**

- Built the billing API

---

## EDUCATION

**BSc Computer Science | Example University | 2014 - 2018**
- Exchange year abroad
**MSc Data Science | Other University | 2019**

---

## SKILLS

**Languages:** TypeScript, Python
**Infra:** AWS, Terraform

---

## AWARDS

Ignored section.
`;

describe("parseResume", () => {
  const resume = parseResume(RESUME);

  it("reads the name from the H1", () => {
    expect(resume.name).toBe("Jane Example");
  });

  it("reads contact fields across both header lines", () => {
    expect(resume.contact).toEqual({
      email: "jane@example.com",
      phone: "+1 555 0100",
      location: "Berlin, Germany",
      linkedin: { text: "linkedin.com/in/jane", url: "https://linkedin.com/in/jane" },
    });
  });

  it("joins multi-line summaries into one paragraph", () => {
    expect(resume.summary).toBe(
      "Backend engineer with six years in payments. Likes boring, reliable systems."
    );
  });

  it("splits company and role on an em dash or a spaced hyphen", () => {
    expect(resume.experience.map((e) => [e.company, e.role])).toEqual([
      ["Acme Payments", "Senior Engineer"],
      ["Widget Co", "Engineer"],
    ]);
  });

  it("keeps everything after the first pipe as the date range", () => {
    expect(resume.experience[0].location).toBe("Berlin, Germany");
    expect(resume.experience[0].dateRange).toBe("Jan 2021 | Present");
    expect(resume.experience[1].dateRange).toBe("2018 - 2020");
  });

  it("parses bullets with inline bold and pulls out the stack line", () => {
    const [acme, widget] = resume.experience;
    expect(acme.bullets).toHaveLength(2);
    expect(acme.bullets[0].segments).toEqual([
      { text: "Cut settlement time by ", bold: false },
      { text: "40%", bold: true },
      { text: " with a new batching job", bold: false },
    ]);
    expect(acme.stack).toBe("TypeScript, PostgreSQL");
    expect(widget.stack).toBeNull();
  });

  it("groups education sub-bullets under the preceding degree", () => {
    expect(resume.education).toEqual([
      {
        degree: "BSc Computer Science",
        institution: "Example University",
        dateRange: "2014 - 2018",
        subBullets: ["Exchange year abroad"],
      },
      {
        degree: "MSc Data Science",
        institution: "Other University",
        dateRange: "2019",
        subBullets: [],
      },
    ]);
  });

  it("reads skills as label/value pairs", () => {
    expect(resume.skills).toEqual([
      { label: "Languages", value: "TypeScript, Python" },
      { label: "Infra", value: "AWS, Terraform" },
    ]);
  });

  it("treats a role title without a separator as company only", () => {
    const md = `# A\n\n---\n\n## PROFESSIONAL EXPERIENCE\n\n### Freelance\n**Remote | 2020**\n\n- Did things\n`;
    const [entry] = parseResume(md).experience;
    expect(entry.company).toBe("Freelance");
    expect(entry.role).toBe("");
    expect(entry.bullets).toHaveLength(1);
  });

  it("returns empty sections and a null summary when they are missing", () => {
    const parsed = parseResume("# Only A Name\n");
    expect(parsed.summary).toBeNull();
    expect(parsed.experience).toEqual([]);
    expect(parsed.education).toEqual([]);
    expect(parsed.skills).toEqual([]);
    expect(parsed.contact.email).toBe("");
  });

  it("uses the raw value when LinkedIn is not a markdown link", () => {
    const parsed = parseResume("# A\n\n**LinkedIn:** linkedin.com/in/a\n");
    expect(parsed.contact.linkedin).toEqual({
      text: "linkedin.com/in/a",
      url: "linkedin.com/in/a",
    });
  });

  it("throws when there is no H1 name", () => {
    expect(() => parseResume("**Email:** a@b.c\n")).toThrow(/name/);
  });
});

describe("parseInlineBold", () => {
  it("returns a single plain segment when there is no bold", () => {
    expect(parseInlineBold("plain text")).toEqual([{ text: "plain text", bold: false }]);
  });

  it("handles bold at the start and end", () => {
    expect(parseInlineBold("**a** b **c**")).toEqual([
      { text: "a", bold: true },
      { text: " b ", bold: false },
      { text: "c", bold: true },
    ]);
  });

  it("leaves an unclosed marker as plain text", () => {
    expect(parseInlineBold("half **open")).toEqual([{ text: "half **open", bold: false }]);
  });
});
