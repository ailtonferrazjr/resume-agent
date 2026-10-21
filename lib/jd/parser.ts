export type RoleType = "engineering" | "product" | "biz-ops" | "hybrid";

export interface ParsedJD {
  title: string;
  company: string;
  location: string;
  requirements: string[];
  keywords: string[];
  senioritySignals: string[];
  companyStageSignals: string[];
  roleType: RoleType;
}

const ENGINEERING_SIGNALS = [
  "engineer", "developer", "frontend", "backend", "full-stack", "fullstack",
  "devops", "sre", "software", "infrastructure", "platform", "data engineer",
  "ml engineer", "machine learning engineer",
];

const PRODUCT_SIGNALS = [
  "product manager", "product owner", "product lead", "product director",
  "product ops", "product operations",
];

const BIZ_OPS_SIGNALS = [
  "business operations", "biz ops", "sales ops", "revenue ops",
  "sales operations", "revenue operations", "operations manager",
  "commercial", "go-to-market", "gtm",
];

function extractSection(markdown: string, heading: string): string | null {
  const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  // JS regex has no \z anchor; (?![\s\S]) matches the true end of input.
  const pattern = new RegExp(`^##\\s+${escaped}[^\\n]*\\n([\\s\\S]*?)(?=^##\\s|(?![\\s\\S]))`, "m");
  const match = markdown.match(pattern);
  return match ? match[1].trim() : null;
}

function extractBullets(section: string): string[] {
  return section.split("\n").map((line) => line.replace(/^[-*]\s+/, "").trim()).filter((line) => line.length > 0);
}

function extractYearsRequirements(text: string): string[] {
  const signals: string[] = [];
  const yearPatterns = [
    /(\d+)\+?\s*(?:years?|yrs?)[\s\w]*(?:experience|exp)?/gi,
    /(?:experience|exp)\s*(?:of\s+)?(\d+)\+?\s*(?:years?|yrs?)/gi,
    /(?:minimum|min|at least)\s+(\d+)\s*(?:years?|yrs?)/gi,
  ];
  for (const pattern of yearPatterns) {
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(text)) !== null) {
      signals.push(match[0].trim());
    }
  }
  return [...new Set(signals)];
}

function inferRoleType(title: string, keywords: string[]): RoleType {
  const titleLower = title.toLowerCase();
  const allText = [titleLower, ...keywords.map((k) => k.toLowerCase())].join(" ");
  const engScore = ENGINEERING_SIGNALS.filter((s) => allText.includes(s)).length;
  const prodScore = PRODUCT_SIGNALS.filter((s) => allText.includes(s)).length;
  const bizScore = BIZ_OPS_SIGNALS.filter((s) => allText.includes(s)).length;
  const activeCats = [engScore > 0, prodScore > 0, bizScore > 0].filter(Boolean).length;
  if (activeCats >= 2) return "hybrid";
  if (engScore > prodScore && engScore > bizScore) return "engineering";
  if (prodScore > engScore && prodScore > bizScore) return "product";
  if (bizScore > 0) return "biz-ops";
  if (ENGINEERING_SIGNALS.some((s) => titleLower.includes(s))) return "engineering";
  if (PRODUCT_SIGNALS.some((s) => titleLower.includes(s))) return "product";
  if (BIZ_OPS_SIGNALS.some((s) => titleLower.includes(s))) return "biz-ops";
  return "hybrid";
}

function extractCompanyStageSignals(text: string): string[] {
  const signals: string[] = [];
  const textLower = text.toLowerCase();
  const stagePatterns: Array<{ pattern: string; label: string }> = [
    { pattern: "startup", label: "startup" },
    { pattern: "early-stage", label: "early-stage" },
    { pattern: "early stage", label: "early-stage" },
    { pattern: "growth-stage", label: "growth-stage" },
    { pattern: "growth stage", label: "growth-stage" },
    { pattern: "rapidly scaling", label: "growth-stage" },
    { pattern: "rapid growth", label: "growth-stage" },
    { pattern: "high-growth", label: "growth-stage" },
    { pattern: "high growth", label: "growth-stage" },
    { pattern: "scale-up", label: "scale-up" },
    { pattern: "scaleup", label: "scale-up" },
    { pattern: "scaling", label: "growth-stage" },
    { pattern: "enterprise", label: "enterprise" },
    { pattern: "fortune 500", label: "enterprise" },
    { pattern: "large organization", label: "enterprise" },
    { pattern: "series a", label: "startup" },
    { pattern: "series b", label: "growth-stage" },
    { pattern: "series c", label: "scale-up" },
    { pattern: "series d", label: "scale-up" },
    { pattern: "ipo", label: "enterprise" },
    { pattern: "foundational", label: "early-stage" },
  ];
  for (const { pattern, label } of stagePatterns) {
    if (textLower.includes(pattern)) signals.push(label);
  }
  return [...new Set(signals)];
}

export function parseJD(markdown: string): ParsedJD {
  const lines = markdown.split("\n");
  const titleLine = lines.find((l) => /^#\s+/.test(l));
  const title = titleLine ? titleLine.replace(/^#\s+/, "").trim() : "Unknown";
  const companyLine = lines.find((l) => /\*\*Company:\*\*/i.test(l));
  const company = companyLine ? companyLine.replace(/.*\*\*Company:\*\*\s*/i, "").trim() : "Unknown";
  const locationLine = lines.find((l) => /\*\*Location:\*\*/i.test(l));
  const location = locationLine ? locationLine.replace(/.*\*\*Location:\*\*\s*/i, "").trim() : "Unknown";
  const reqSection = extractSection(markdown, "Requirements");
  const requirements = reqSection ? extractBullets(reqSection) : [];
  const kwSection = extractSection(markdown, "Keywords to mirror");
  let keywords: string[] = [];
  if (kwSection) {
    keywords = kwSection.split(/[,\n]/).map((k) => k.replace(/^[-*]\s+/, "").trim()).filter((k) => k.length > 0);
  }
  const respSection = extractSection(markdown, "Key Responsibilities");
  const responsibilities = respSection ? extractBullets(respSection) : [];
  const fullText = markdown;
  const senioritySignals = extractYearsRequirements(fullText);
  const companyStageSignals = extractCompanyStageSignals(fullText);
  const roleType = inferRoleType(title, [...keywords, ...requirements, ...responsibilities]);
  return { title, company, location, requirements: [...requirements, ...responsibilities], keywords, senioritySignals, companyStageSignals, roleType };
}
