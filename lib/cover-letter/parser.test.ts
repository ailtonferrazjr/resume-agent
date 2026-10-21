import { describe, expect, it } from "vitest";
import { parseCoverLetter } from "./parser";

const LETTER = `# Cover Letter: Example | Engineer

**Name:** Jane Example
**Email:** jane@example.com
**LinkedIn:** [linkedin.com/in/jane](https://linkedin.com/in/jane)
**Phone:** +1 555 0100
**Location:** Berlin
**Company:** Example
**Recipient Company:** Example Holdings
**Role:** Engineer
**Date:** March 3, 2026
**Recipient:** Alex Doe

---

Dear Alex,

First paragraph with **one bold claim**
wrapped across two lines.

Second paragraph.

Kind regards,
Jane Example
`;

describe("parseCoverLetter", () => {
  const letter = parseCoverLetter(LETTER);

  it("reads header fields", () => {
    expect(letter.name).toBe("Jane Example");
    expect(letter.company).toBe("Example");
    expect(letter.recipientCompany).toBe("Example Holdings");
    expect(letter.role).toBe("Engineer");
    expect(letter.date).toBe("March 3, 2026");
    expect(letter.recipient).toBe("Alex Doe");
    expect(letter.contact).toEqual({
      email: "jane@example.com",
      phone: "+1 555 0100",
      location: "Berlin",
      linkedin: { text: "linkedin.com/in/jane", url: "https://linkedin.com/in/jane" },
    });
  });

  it("skips the salutation, joins wrapped lines and keeps bold runs", () => {
    expect(letter.paragraphs).toHaveLength(2);
    expect(letter.paragraphs[0].segments).toEqual([
      { text: "First paragraph with ", bold: false },
      { text: "one bold claim", bold: true },
      { text: " wrapped across two lines.", bold: false },
    ]);
  });

  it("takes the closing from the sign-off line", () => {
    expect(letter.closing).toBe("Kind regards,");
  });

  it("falls back to defaults for missing fields", () => {
    const bare = parseCoverLetter("**Name:** A\n\n---\n\nOnly body.\n");
    expect(bare.recipient).toBe("Hiring Team");
    expect(bare.closing).toBe("Best regards,");
    expect(bare.recipientCompany).toBeUndefined();
    expect(bare.date).not.toBe("");
  });
});
