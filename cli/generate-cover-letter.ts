import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { basename, join, resolve } from "path";
import type { ParsedCoverLetter, BulletPoint, ContactInfo } from "../lib/types";
import { cleanCompanyName, cleanRoleName } from "../lib/jd/intake-utils";

function parseCoverLetter(markdown: string): ParsedCoverLetter {
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

async function main() {
  const inputPath = process.argv[2];

  if (!inputPath) {
    console.error("Usage: npm run generate:cover -- <path-to-cover-letter.md> [--docx]");
    process.exit(1);
  }

  const resolvedInput = resolve(inputPath);
  if (!existsSync(resolvedInput)) {
    console.error(`File not found: ${resolvedInput}`);
    process.exit(1);
  }

  const markdown = readFileSync(resolvedInput, "utf-8");
  const letter = parseCoverLetter(markdown);

  if (process.argv.includes("--dry-run")) {
    console.log(JSON.stringify(letter, null, 2));
    return;
  }

  const { renderCoverLetter, Packer } = await import("../lib/cover-letter/renderer");
  const doc = renderCoverLetter(letter);

  const outputDir = resolve("outputs");
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  const slug = basename(inputPath, ".md");
  const outputName = `${slug}-cover-letter.docx`;
  const outputPath = join(outputDir, outputName);

  const buffer = await Packer.toBuffer(doc);
  writeFileSync(outputPath, buffer);
  console.log(`Generated .docx: ${outputPath}`);

  const localOnly = process.argv.includes("--docx");

  if (!localOnly) {
    try {
      const { uploadAsGoogleDoc, getOrCreateJobFolder, uploadTextFile } = await import("../lib/infra/drive");

      const folderName = await resolveFolderName(slug);
      const folderId = await getOrCreateJobFolder(folderName);
      console.log(`Drive folder: ${folderName}/`);

      const docName = `${letter.name} - Cover Letter (${folderName})`;
      const result = await uploadAsGoogleDoc(outputPath, docName, folderId);
      console.log(`${result.action === "updated" ? "Updated" : "Created"} Google Doc: ${result.url}`);

      await uploadTextFile(resolvedInput, folderId);
      console.log(`Uploaded cover letter .md: ${basename(resolvedInput)}`);

      await updateTracker(result.url, result.fileId, folderId, slug);
    } catch (err: any) {
      if (err.message?.includes("DRIVE_FOLDER_ID")) {
        console.log("\nSkipping Drive upload (DRIVE_FOLDER_ID not configured).");
        console.log("Run /setup-gcloud to enable Google Drive integration.");
      } else {
        throw err;
      }
    }
  }
}

function slugToTitle(slug: string): string {
  return slug.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

async function resolveFolderName(slug: string): Promise<string> {
  const { getAllRowsWithIds } = await import("../lib/tracker/repository");
  const { basename } = await import("path");
  const rows = await getAllRowsWithIds();
  for (const row of rows) {
    const jdSlug = row.jdFile ? basename(row.jdFile, ".md").replace(/^job-descriptions\//, "") : "";
    if (jdSlug === slug || basename(row.jdFile ?? "") === `${slug}.md`) {
      return `${cleanCompanyName(row.company)} - ${cleanRoleName(row.role, row.company)}`;
    }
  }
  return slugToTitle(slug);
}

async function updateTracker(coverLetterUrl: string, coverLetterFileId: string, driveFolderId: string, slug: string): Promise<void> {
  const { findRowByCompany, getAllRowsWithIds, updateRow } = await import("../lib/tracker/repository");
  const updates: Record<string, string> = { coverLetterFile: coverLetterUrl, coverLetterFileId, driveFolderId };
  const companyIdx = process.argv.indexOf("--company");
  if (companyIdx !== -1 && process.argv[companyIdx + 1]) {
    const company = process.argv[companyIdx + 1];
    const found = await findRowByCompany(company);
    if (found) {
      await updateRow(found.rowIndex, updates);
      console.log(`Tracker updated: ${company} → coverLetterFile set`);
      return;
    }
  }
  const rows = await getAllRowsWithIds();
  for (const row of rows) {
    const jdSlug = row.jdFile ? basename(row.jdFile, ".md").replace(/^job-descriptions\//, "") : "";
    if (jdSlug === slug || basename(row.jdFile ?? "") === `${slug}.md`) {
      await updateRow(row.id, updates);
      console.log(`Tracker auto-updated: ${row.company} → coverLetterFile set`);
      return;
    }
  }
  console.log("Tracker: no matching entry found (use --company to specify manually)");
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
