import { readFileSync, existsSync } from "fs";
import { resolve, basename } from "path";
import { loadCandidateProfile } from "../lib/candidate/profile";
import { parseJD } from "../lib/jd/parser";
import { scoreJob } from "../lib/jd/scorer";
import { formatScore } from "../lib/jd/format-score";

function main() {
  const inputPath = process.argv[2];

  if (!inputPath) {
    console.error("Usage: npm run score -- <path-to-jd.md>");
    process.exit(1);
  }

  const resolvedPath = resolve(inputPath);
  if (!existsSync(resolvedPath)) {
    console.error(`File not found: ${resolvedPath}`);
    process.exit(1);
  }

  const profile = loadCandidateProfile();
  const markdown = readFileSync(resolvedPath, "utf-8");
  const jd = parseJD(markdown);
  const result = scoreJob(profile, jd, basename(resolvedPath));

  console.log(formatScore(result));
}

main();
