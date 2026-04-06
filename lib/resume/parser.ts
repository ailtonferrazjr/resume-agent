import type {
  ParsedResume,
  ContactInfo,
  ExperienceEntry,
  EducationEntry,
  SkillEntry,
  BulletPoint,
  TextSegment,
} from "../types";

export function parseResume(markdown: string): ParsedResume {
  const sections = markdown.split(/\n---\n/).map((s) => s.trim());

  // First section: name + contact
  const headerSection = sections[0];
  const name = parseName(headerSection);
  const contact = parseContact(headerSection);

  // Remaining sections: look for ## headers
  let summary: string | null = null;
  let experience: ExperienceEntry[] = [];
  let education: EducationEntry[] = [];
  let skills: SkillEntry[] = [];

  for (let i = 1; i < sections.length; i++) {
    const section = sections[i];
    const headerMatch = section.match(/^## (.+)/m);
    if (!headerMatch) continue;

    const sectionTitle = headerMatch[1].trim().toUpperCase();

    if (sectionTitle === "SUMMARY") {
      summary = parseSummary(section);
    } else if (sectionTitle === "PROFESSIONAL EXPERIENCE") {
      experience = parseExperience(section);
    } else if (sectionTitle === "EDUCATION") {
      education = parseEducation(section);
    } else if (sectionTitle === "SKILLS") {
      skills = parseSkills(section);
    }
  }

  return { name, contact, summary, experience, education, skills };
}

function parseName(header: string): string {
  const match = header.match(/^# (.+)/m);
  if (!match) throw new Error("Could not parse name from header");
  return match[1].trim();
}

function parseContact(header: string): ContactInfo {
  const lines = header.split("\n").filter((l) => l.startsWith("**"));

  let email = "";
  let phone = "";
  let location = "";
  let linkedin = { text: "", url: "" };

  for (const line of lines) {
    const parts = line.split(" | ");
    for (const part of parts) {
      const trimmed = part.trim();
      const kvMatch = trimmed.match(/^\*\*(.+?):\*\*\s*(.+)$/);
      if (!kvMatch) continue;

      const key = kvMatch[1].trim().toLowerCase();
      const value = kvMatch[2].trim();

      if (key === "email") {
        email = value;
      } else if (key === "phone") {
        phone = value;
      } else if (key === "location") {
        location = value;
      } else if (key === "linkedin") {
        const linkMatch = value.match(/\[(.+?)\]\((.+?)\)/);
        if (linkMatch) {
          linkedin = { text: linkMatch[1], url: linkMatch[2] };
        } else {
          linkedin = { text: value, url: value };
        }
      }
    }
  }

  return { email, phone, location, linkedin };
}

function parseSummary(section: string): string {
  const lines = section.split("\n");
  const contentLines = lines.filter(
    (l) => !l.startsWith("## ") && l.trim() !== ""
  );
  return contentLines.join(" ").trim();
}

function parseExperience(section: string): ExperienceEntry[] {
  const entries: ExperienceEntry[] = [];

  const parts = section.split(/\n### /);
  for (let i = 1; i < parts.length; i++) {
    entries.push(parseExperienceEntry(parts[i]));
  }

  return entries;
}

function parseExperienceEntry(block: string): ExperienceEntry {
  const lines = block.split("\n");

  const titleLine = lines[0].trim();
  const dashMatch = titleLine.match(/^(.+?)\s[—–-]\s(.+)$/);

  let company: string;
  let role: string;
  if (dashMatch) {
    company = dashMatch[1].trim();
    role = dashMatch[2].trim();
  } else {
    company = titleLine;
    role = "";
  }

  let location = "";
  let dateRange = "";
  let bulletStartIndex = 2;

  for (let j = 1; j < lines.length; j++) {
    const line = lines[j].trim();
    if (line.startsWith("**") && line.endsWith("**") && line.includes("|")) {
      const stripped = line.replace(/^\*\*/, "").replace(/\*\*$/, "");
      const parts = stripped.split(" | ");
      location = parts[0].trim();
      dateRange = parts.slice(1).join(" | ").trim();
      bulletStartIndex = j + 1;
      break;
    }
  }

  const bullets: BulletPoint[] = [];
  let stack: string | null = null;

  for (let j = bulletStartIndex; j < lines.length; j++) {
    const line = lines[j].trim();
    if (line === "") continue;

    if (line.startsWith("**Stack:**")) {
      stack = line.replace(/^\*\*Stack:\*\*\s*/, "");
      continue;
    }

    if (line.startsWith("- ")) {
      const bulletText = line.slice(2);
      bullets.push({ segments: parseInlineBold(bulletText) });
    }
  }

  return { company, role, location, dateRange, bullets, stack };
}

function parseEducation(section: string): EducationEntry[] {
  const entries: EducationEntry[] = [];
  const lines = section
    .split("\n")
    .filter((l) => !l.startsWith("## ") && l.trim() !== "");

  let currentEntry: EducationEntry | null = null;

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith("- ")) {
      if (currentEntry) {
        currentEntry.subBullets.push(trimmed.slice(2));
      }
    } else if (trimmed.startsWith("**")) {
      if (currentEntry) {
        entries.push(currentEntry);
      }

      const clean = trimmed.replace(/\*\*/g, "");
      const parts = clean.split("|").map((p) => p.trim());

      const degree = parts[0] ?? "";
      const institution = parts[1] ?? "";
      const dateRange = parts[2] ?? "";

      currentEntry = { degree, institution, dateRange, subBullets: [] };
    }
  }

  if (currentEntry) {
    entries.push(currentEntry);
  }

  return entries;
}

function parseSkills(section: string): SkillEntry[] {
  const entries: SkillEntry[] = [];
  const lines = section
    .split("\n")
    .filter((l) => !l.startsWith("## ") && l.trim() !== "");

  for (const line of lines) {
    const match = line.trim().match(/^\*\*(.+?):\*\*\s*(.+)$/);
    if (match) {
      entries.push({ label: match[1].trim(), value: match[2].trim() });
    }
  }

  return entries;
}

export function parseInlineBold(text: string): TextSegment[] {
  const segments: TextSegment[] = [];
  const regex = /\*\*(.+?)\*\*/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ text: text.slice(lastIndex, match.index), bold: false });
    }
    segments.push({ text: match[1], bold: true });
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    segments.push({ text: text.slice(lastIndex), bold: false });
  }

  if (segments.length === 0) {
    segments.push({ text, bold: false });
  }

  return segments;
}
