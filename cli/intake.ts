import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { resolve, basename, join } from "path";
import { loadCandidateProfile } from "../lib/candidate/profile";
import { parseJD } from "../lib/jd/parser";
import { scoreJob } from "../lib/jd/scorer";
import { formatScore } from "../lib/jd/format-score";
import { appendRow, findRowByCompany } from "../lib/tracker/repository";
import { slugify, abbreviateRole, formatRawJD } from "../lib/jd/intake-utils";

function readStdin(): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    process.stdin.on("data", (chunk) => chunks.push(chunk));
    process.stdin.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
    process.stdin.on("error", reject);
  });
}

function isUrl(input: string): boolean {
  return /^https?:\/\//.test(input);
}

function isLinkedInUrl(input: string): boolean {
  return /linkedin\.com/i.test(input);
}

function printUsage(): void {
  console.log(`
Usage: npm run intake -- <input> [options]

Inputs:
  <path-to-jd.md>     Score an existing JD file and add to tracker
  --paste              Read raw JD text from stdin (pipe or paste)
                       Example: pbpaste | npm run intake -- --paste

Options:
  --url <source-url>   Attach a source URL to the JD (used with --paste)
  --skip-tracker       Score only, don't add to tracker

LinkedIn URLs:
  Use /linkedin-scrape in Claude Code to scrape LinkedIn postings first,
  then run: npm run intake -- job-descriptions/<slug>.md
`);
}

async function handlePaste(args: Record<string, string>): Promise<string> {
  if (process.stdin.isTTY) {
    console.error("Error: --paste expects piped input.");
    console.error("  Example: pbpaste | npm run intake -- --paste");
    process.exit(1);
  }

  const rawText = await readStdin();
  if (!rawText.trim()) {
    console.error("Error: no input received from stdin.");
    process.exit(1);
  }

  let company = args.company ?? "";
  let role = args.role ?? "";

  if (!company || !role) {
    if (!company) {
      console.error("Error: --company is required with --paste");
      console.error('  Example: pbpaste | npm run intake -- --paste --company "Deel" --role "Sr Product Ops Manager"');
      process.exit(1);
    }
    if (!role) {
      console.error("Error: --role is required with --paste");
      process.exit(1);
    }
  }

  const slug = slugify(`${company} ${abbreviateRole(role)}`);
  const jdDir = resolve("job-descriptions");
  if (!existsSync(jdDir)) mkdirSync(jdDir, { recursive: true });

  const jdPath = join(jdDir, `${slug}.md`);
  const markdown = formatRawJD(rawText, company, role, args.url);
  writeFileSync(jdPath, markdown);
  console.log(`Saved JD: ${jdPath}`);

  return jdPath;
}

function parseArgs(argv: string[]): { input: string | null; args: Record<string, string> } {
  const args: Record<string, string> = {};
  let input: string | null = null;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg.startsWith("--")) {
      const key = arg.slice(2);
      const next = argv[i + 1];
      if (next && !next.startsWith("--")) {
        args[key] = next;
        i++;
      } else {
        args[key] = "true";
      }
    } else if (!input) {
      input = arg;
    }
  }

  return { input, args };
}

async function main() {
  const rawArgs = process.argv.slice(2);
  const { input, args } = parseArgs(rawArgs);

  if (args.help || args.h || (!input && !args.paste)) {
    printUsage();
    process.exit(0);
  }

  let jdPath: string;

  if (args.paste) {
    jdPath = await handlePaste(args);
  } else if (input && isUrl(input)) {
    if (isLinkedInUrl(input)) {
      console.log("\nLinkedIn URL detected. Use /linkedin-scrape in Claude Code first:");
      console.log(`  1. Run: /linkedin-scrape ${input}`);
      console.log("  2. Then run: npm run intake -- job-descriptions/<slug>.md");
      process.exit(0);
    }
    console.error("Error: direct URL scraping is not supported.");
    process.exit(1);
  } else if (input) {
    jdPath = resolve(input);
    if (!existsSync(jdPath)) {
      console.error(`File not found: ${jdPath}`);
      process.exit(1);
    }
  } else {
    printUsage();
    process.exit(1);
  }

  const profile = loadCandidateProfile();
  const markdown = readFileSync(jdPath, "utf-8");
  const jd = parseJD(markdown);
  const slug = basename(jdPath, ".md");
  const result = scoreJob(profile, jd, basename(jdPath));

  console.log(formatScore(result));

  if (!args["skip-tracker"]) {
    const existing = await findRowByCompany(jd.company);
    if (existing) {
      console.log(`Tracker: ${jd.company} already tracked (stage: ${existing.data.stage})`);
    } else {
      await appendRow({
        company: jd.company,
        role: jd.title,
        sourceUrl: args.url ?? "",
        score: result.total,
        stage: "Scored",
        jdFile: `job-descriptions/${slug}.md`,
        dateDiscovered: new Date().toISOString().split("T")[0],
        lastUpdated: new Date().toISOString().split("T")[0],
      });
      console.log(`Tracker: added ${jd.company} — ${jd.title} (stage: Scored)`);
    }
  }

  console.log("\nNext steps:");
  if (result.total >= 60) {
    console.log(`  /tailor ${slug}`);
  } else if (result.total >= 40) {
    console.log(`  Score is moderate. Consider tailoring if the role is strategic:`);
    console.log(`  /tailor ${slug}`);
  } else {
    console.log(`  Score is low (${result.total}/100). Consider skipping this one.`);
    console.log(`  If you still want to proceed: /tailor ${slug}`);
  }
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
