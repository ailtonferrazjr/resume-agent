/**
 * Strip long parenthetical descriptions (LinkedIn metadata) from company names.
 * e.g. "Tangible (tech-driven platform for LP/GP...)" → "Tangible"
 * Preserves short intentional differentiators like "(Ghostbuster)" or "(Undisclosed)".
 */
export function cleanCompanyName(name: string): string {
  // Only strip parentheticals longer than 25 chars (LinkedIn metadata)
  return name.replace(/\s*\([^)]{25,}\)\s*$/, "").trim();
}

/**
 * Strip company name suffix from role titles.
 * e.g. "Product Manager — Tangible" → "Product Manager"
 * Handles both em-dash and en-dash separators.
 */
export function cleanRoleName(role: string, company?: string): string {
  // Remove "— Company" or "- Company" suffix
  let cleaned = role.replace(/\s*[—–]\s*[^—–]+$/, "").trim();
  // If company provided, also remove " - Company" with regular dash
  if (company) {
    const cleanCo = cleanCompanyName(company);
    const suffixPattern = new RegExp(`\\s*[-—–]\\s*${escapeRegex(cleanCo)}\\s*$`, "i");
    cleaned = cleaned.replace(suffixPattern, "").trim();
  }
  return cleaned;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function abbreviateRole(role: string): string {
  return role
    .replace(/business operations/gi, "biz-ops")
    .replace(/software engineer/gi, "swe")
    .replace(/product manager/gi, "pm")
    .replace(/engineering manager/gi, "em")
    .replace(/product operations/gi, "product-ops")
    .replace(/sales operations/gi, "sales-ops")
    .replace(/revenue operations/gi, "rev-ops")
    .replace(/senior/gi, "sr")
    .replace(/junior/gi, "jr")
    .replace(/manager/gi, "mgr");
}

export function formatRawJD(rawText: string, company: string, role: string, sourceUrl?: string): string {
  const lines: string[] = [];

  lines.push(`# ${role} — ${company}`);
  lines.push("");
  lines.push(`**Company:** ${company}`);

  const locationMatch = rawText.match(/(?:location|based in|office)[:\s]+([^\n]+)/i);
  if (locationMatch) {
    lines.push(`**Location:** ${locationMatch[1].trim()}`);
  }

  if (sourceUrl) {
    lines.push(`**Source:** ${sourceUrl}`);
  }

  lines.push("");

  const sections = splitIntoSections(rawText);

  lines.push("## About the Role");
  lines.push(sections.about || "See responsibilities and requirements below.");
  lines.push("");

  if (sections.responsibilities.length > 0) {
    lines.push("## Key Responsibilities");
    for (const r of sections.responsibilities) {
      lines.push(`- ${r}`);
    }
    lines.push("");
  }

  if (sections.requirements.length > 0) {
    lines.push("## Requirements");
    for (const r of sections.requirements) {
      lines.push(`- ${r}`);
    }
    lines.push("");
  }

  lines.push("## Keywords to mirror");
  lines.push(extractKeywords(rawText, role));
  lines.push("");

  return lines.join("\n");
}

interface SplitSections {
  about: string;
  responsibilities: string[];
  requirements: string[];
}

function splitIntoSections(text: string): SplitSections {
  const result: SplitSections = { about: "", responsibilities: [], requirements: [] };

  const respPatterns = /(?:responsibilities|what you.?ll do|the role|key duties|about the role)/i;
  const reqPatterns = /(?:requirements|qualifications|what you.?ll need|what we.?re looking for|skills|experience|who you are|about you|must have|nice to have)/i;

  const lines = text.split("\n");
  let currentSection: "about" | "responsibilities" | "requirements" = "about";
  const aboutLines: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Bullets are content even when they mention "experience" or "skills".
    const isBullet = /^(?:[-•●▪]|\*\s)/.test(trimmed);
    const cleanLine = trimmed.replace(/^#+\s*/, "").replace(/[*_]/g, "");
    if (!isBullet && respPatterns.test(cleanLine) && cleanLine.length < 80) {
      currentSection = "responsibilities";
      continue;
    }
    if (!isBullet && reqPatterns.test(cleanLine) && cleanLine.length < 80) {
      currentSection = "requirements";
      continue;
    }

    const content = trimmed.replace(/^[-*•●▪]\s*/, "").trim();
    if (!content) continue;

    switch (currentSection) {
      case "about":
        aboutLines.push(content);
        break;
      case "responsibilities":
        result.responsibilities.push(content);
        break;
      case "requirements":
        result.requirements.push(content);
        break;
    }
  }

  if (result.responsibilities.length === 0 && result.requirements.length === 0) {
    result.about = aboutLines.join("\n\n");
  } else {
    result.about = aboutLines.slice(0, 3).join(" ");
  }

  return result;
}

function extractKeywords(text: string, role: string): string {
  const techTerms = new Set<string>();
  const textLower = text.toLowerCase();

  const knownTerms = [
    "TypeScript", "JavaScript", "Python", "SQL", "Node.js", "React", "Next.js",
    "PostgreSQL", "MongoDB", "Redis", "AWS", "GCP", "Azure", "Docker", "Kubernetes",
    "GraphQL", "REST", "API", "CI/CD", "Git", "Agile", "Scrum",
    "Salesforce", "HubSpot", "Jira", "Confluence", "Looker", "Tableau",
    "Snowflake", "Datadog", "Sentry", "Amplitude",
    "LLM", "RAG", "OpenAI", "machine learning", "AI",
    "product management", "product operations", "sales ops", "revenue ops",
    "biz ops", "GTM", "go-to-market", "CRM", "SaaS", "B2B", "B2C",
    "cross-functional", "stakeholder management", "data analysis",
    "automation", "process design", "operations",
  ];

  for (const term of knownTerms) {
    if (textLower.includes(term.toLowerCase())) {
      techTerms.add(term);
    }
  }

  const roleWords = role.toLowerCase().split(/\s+/);
  for (const word of roleWords) {
    if (word.length > 3) techTerms.add(word);
  }

  return [...techTerms].join(", ");
}
