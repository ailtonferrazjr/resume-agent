import type { ParsedCoverLetter, BulletPoint, ContactInfo } from "../types";

export function parseCoverLetter(markdown: string): ParsedCoverLetter {
  const sections = markdown.split(/\n---\n/).map((s) => s.trim());
  const header = sections[0];

  const name = extractField(header, "Name") || "Unknown";
  const contact: ContactInfo = {
    email: extractField(header, "Email") || "",
    phone: extractField(header, "Phone") || "",
    location: extractField(header, "Location") || "",
    linkedin: {
      text: extractField(header, "LinkedIn") || "",
      url: extractLinkUrl(header, "LinkedIn") || "",
    },
  };

  const company = extractField(header, "Company") || "";
  const recipientCompany = extractField(header, "Recipient Company") || undefined;
  const role = extractField(header, "Role") || "";
  const date = extractField(header, "Date") || new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const recipient = extractField(header, "Recipient") || "Hiring Team";

  const bodySection = sections[1] || "";
  const rawParagraphs = bodySection.split(/\n\n+/).map((p) => p.trim()).filter((p) => p.length > 0);

  const closingPatterns = /^(Best|Regards|Sincerely|Kind regards|Cheers)/i;
  let closing = "Best regards,";
  const paragraphBlocks: string[] = [];

  for (const p of rawParagraphs) {
    const firstLine = p.split("\n")[0];
    if (closingPatterns.test(firstLine)) {
      closing = firstLine;
    } else if (/^Dear /i.test(firstLine)) {
      // Skip salutation
    } else {
      paragraphBlocks.push(p);
    }
  }

  const paragraphs: BulletPoint[] = paragraphBlocks.map((block) =>
    parseInlineBold(block.replace(/\n/g, " "))
  );

  return { name, contact, company, role, date, recipient, recipientCompany, paragraphs, closing };
}

function extractField(text: string, field: string): string {
  const match = text.match(new RegExp(`\\*\\*${field}:\\*\\*\\s*([^\\n\\[]+)`, "i"));
  return match ? match[1].trim() : "";
}

function extractLinkUrl(text: string, field: string): string {
  const match = text.match(new RegExp(`\\*\\*${field}:\\*\\*\\s*\\[([^\\]]+)\\]\\(([^)]+)\\)`, "i"));
  return match ? match[2].trim() : "";
}

function parseInlineBold(text: string): BulletPoint {
  const segments: { text: string; bold: boolean }[] = [];
  const parts = text.split(/(\*\*[^*]+\*\*)/);
  for (const part of parts) {
    if (part.startsWith("**") && part.endsWith("**")) {
      segments.push({ text: part.slice(2, -2), bold: true });
    } else if (part.length > 0) {
      segments.push({ text: part, bold: false });
    }
  }
  return { segments };
}
