import { resolve } from "path";
import { existsSync, readdirSync } from "fs";
import { uploadFile, listFiles } from "../lib/infra/drive";

const OUTPUTS_DIR = resolve(import.meta.dirname, "../outputs");

async function main() {
  const args = process.argv.slice(2);

  if (args.includes("--list")) {
    const files = await listFiles();
    if (files.length === 0) {
      console.log("No files found in Drive folder.");
      return;
    }
    console.log("Files in Drive folder:");
    for (const f of files) {
      console.log(
        `  ${f.name}  (${f.modifiedTime})  https://docs.google.com/document/d/${f.id}/edit`
      );
    }
    return;
  }

  let filePaths: string[];

  if (args.length > 0 && !args[0].startsWith("--")) {
    filePaths = args.map((a) => resolve(a));
  } else {
    if (!existsSync(OUTPUTS_DIR)) {
      console.error("No outputs/ directory found. Run generate first.");
      process.exit(1);
    }
    filePaths = readdirSync(OUTPUTS_DIR)
      .filter((f) => f.endsWith(".docx"))
      .map((f) => resolve(OUTPUTS_DIR, f));
  }

  if (filePaths.length === 0) {
    console.error("No .docx files to upload.");
    process.exit(1);
  }

  for (const filePath of filePaths) {
    if (!existsSync(filePath)) {
      console.error(`File not found: ${filePath}`);
      continue;
    }
    const result = await uploadFile(filePath);
    console.log(
      `${result.action === "updated" ? "Updated" : "Created"}: ${filePath.split("/").pop()} → ${result.url}`
    );
  }
}

main().catch((err) => {
  console.error("Upload failed:", err.message);
  process.exit(1);
});
