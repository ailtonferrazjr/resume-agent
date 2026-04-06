import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { basename, join, resolve } from "path";
import { parseResume } from "../lib/resume/parser";
import { cleanCompanyName, cleanRoleName } from "../lib/jd/intake-utils";

async function main() {
  const inputPath = process.argv[2];

  if (!inputPath) {
    console.error("Usage: npm run generate -- <path-to-resume.md> [--docx]");
    process.exit(1);
  }

  const resolvedInput = resolve(inputPath);

  if (!existsSync(resolvedInput)) {
    console.error(`File not found: ${resolvedInput}`);
    process.exit(1);
  }

  const markdown = readFileSync(resolvedInput, "utf-8");
  const resume = parseResume(markdown);

  if (process.argv.includes("--dry-run")) {
    console.log(JSON.stringify(resume, null, 2));
    return;
  }

  const { renderResume } = await import("../lib/resume/renderer");
  const { Packer } = await import("docx");
  const doc = renderResume(resume);

  const outputDir = resolve("outputs");
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  const slug = basename(inputPath, ".md");
  const outputName = slug + ".docx";
  const outputPath = join(outputDir, outputName);

  const buffer = await Packer.toBuffer(doc);
  writeFileSync(outputPath, buffer);
  console.log(`Generated .docx: ${outputPath}`);

  const localOnly = process.argv.includes("--docx");

  if (!localOnly) {
    try {
      const { uploadAsGoogleDoc, getOrCreateJobFolder, uploadTextFile } =
        await import("../lib/infra/drive");

      const folderName = await resolveFolderName(slug);
      const folderId = await getOrCreateJobFolder(folderName);
      console.log(`Drive folder: ${folderName}/`);

      const docName = `${resume.name} - Resume (${folderName})`;
      const result = await uploadAsGoogleDoc(outputPath, docName, folderId);
      console.log(
        `${result.action === "updated" ? "Updated" : "Created"} Google Doc: ${result.url}`
      );

      await uploadTextFile(resolvedInput, folderId);
      console.log(`Uploaded resume .md: ${basename(resolvedInput)}`);

      const jdPath = resolve("job-descriptions", `${slug}.md`);
      if (existsSync(jdPath)) {
        await uploadTextFile(jdPath, folderId);
        console.log(`Uploaded JD .md: ${slug}.md`);
      }

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
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

async function resolveFolderName(slug: string): Promise<string> {
  const { getAllRowsWithIds } = await import("../lib/tracker/repository");
  const { basename } = await import("path");
  const rows = await getAllRowsWithIds();
  for (const row of rows) {
    const jdSlug = row.jdFile
      ? basename(row.jdFile, ".md").replace(/^job-descriptions\//, "")
      : "";
    if (jdSlug === slug || basename(row.jdFile ?? "") === `${slug}.md`) {
      return `${cleanCompanyName(row.company)} - ${cleanRoleName(row.role, row.company)}`;
    }
  }
  return slugToTitle(slug);
}

async function updateTracker(
  resumeUrl: string,
  resumeFileId: string,
  driveFolderId: string,
  slug: string
): Promise<void> {
  const { findRowByCompany, getAllRowsWithIds, updateRow, STAGES } = await import(
    "../lib/tracker/repository"
  );

  const updates: Record<string, string> = {
    resumeFile: resumeUrl,
    resumeFileId,
    driveFolderId,
  };

  const companyIdx = process.argv.indexOf("--company");
  if (companyIdx !== -1 && process.argv[companyIdx + 1]) {
    const company = process.argv[companyIdx + 1];
    const found = await findRowByCompany(company);
    if (found) {
      const stageIdx = STAGES.indexOf(found.data.stage);
      if (stageIdx < STAGES.indexOf("Resume Generated")) {
        updates.stage = "Resume Generated";
      }
      await updateRow(found.rowIndex, updates);
      console.log(`Tracker updated: ${company} → resumeFile set`);
      return;
    }
  }

  const rows = await getAllRowsWithIds();
  for (const row of rows) {
    const jdSlug = row.jdFile
      ? basename(row.jdFile, ".md").replace(/^job-descriptions\//, "")
      : "";
    if (jdSlug === slug || basename(row.jdFile ?? "") === `${slug}.md`) {
      const stageIdx = STAGES.indexOf(row.stage);
      if (stageIdx < STAGES.indexOf("Resume Generated")) {
        updates.stage = "Resume Generated";
      }
      await updateRow(row.id, updates);
      console.log(`Tracker auto-updated: ${row.company} → resumeFile set`);
      return;
    }
  }

  console.log(
    "Tracker: no matching entry found (use --company to specify manually)"
  );
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
