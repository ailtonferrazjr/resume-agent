import {
  appendRow,
  getAllRows,
  findRowByCompany,
  updateRow,
  STAGES,
  type Stage,
  type TrackerRow,
} from "../lib/tracker/repository";

function parseArgs(argv: string[]): Record<string, string> {
  const args: Record<string, string> = {};
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
    }
  }
  return args;
}

function printUsage(): void {
  console.log(`
Usage: npx tsx src/tracker.ts <command> [options]

Commands:
  add     --company <name> --role <role> [--url <url>] [--jd <path>] [--score <n>]
  update  --company <name> [--stage <stage>] [--notes <text>] [--resume <file>]
  list    [--stage <stage>]

Stages: ${STAGES.join(", ")}
`);
}

function formatTable(rows: TrackerRow[]): void {
  if (rows.length === 0) {
    console.log("No entries found.");
    return;
  }

  const colWidths = {
    company: Math.max(8, ...rows.map((r) => r.company.length)),
    role: Math.max(5, ...rows.map((r) => r.role.length)),
    score: 5,
    stage: Math.max(6, ...rows.map((r) => r.stage.length)),
    date: 12,
  };

  const header = [
    "Company".padEnd(colWidths.company),
    "Role".padEnd(colWidths.role),
    "Score".padEnd(colWidths.score),
    "Stage".padEnd(colWidths.stage),
    "Discovered".padEnd(colWidths.date),
  ].join("  ");

  const separator = "-".repeat(header.length);

  console.log(header);
  console.log(separator);

  for (const row of rows) {
    const line = [
      row.company.padEnd(colWidths.company),
      row.role.padEnd(colWidths.role),
      (row.score != null ? String(row.score) : "-").padEnd(colWidths.score),
      row.stage.padEnd(colWidths.stage),
      row.dateDiscovered.padEnd(colWidths.date),
    ].join("  ");
    console.log(line);
  }
}

function isValidStage(stage: string): stage is Stage {
  return STAGES.includes(stage as Stage);
}

async function handleAdd(args: Record<string, string>): Promise<void> {
  if (!args.company || !args.role) {
    console.error("Error: --company and --role are required for 'add'");
    process.exit(1);
  }

  const score = args.score ? parseInt(args.score, 10) : null;

  await appendRow({
    company: args.company,
    role: args.role,
    sourceUrl: args.url ?? "",
    score,
    stage: "Discovered",
    jdFile: args.jd ?? "",
    dateDiscovered: new Date().toISOString().split("T")[0],
    lastUpdated: new Date().toISOString().split("T")[0],
  });

  console.log(`Added: ${args.company}, ${args.role}`);
}

async function handleUpdate(args: Record<string, string>): Promise<void> {
  if (!args.company) {
    console.error("Error: --company is required for 'update'");
    process.exit(1);
  }

  const found = await findRowByCompany(args.company);
  if (!found) {
    console.error(`No entry found for company: ${args.company}`);
    process.exit(1);
  }

  const updates: Partial<TrackerRow> = {};

  if (args.stage) {
    if (!isValidStage(args.stage)) {
      console.error(`Invalid stage: ${args.stage}`);
      console.error(`Valid stages: ${STAGES.join(", ")}`);
      process.exit(1);
    }
    updates.stage = args.stage;

    if (args.stage === "Applied") {
      updates.dateApplied = new Date().toISOString().split("T")[0];
    }
  }

  if (args.notes) updates.notes = args.notes;
  if (args.resume) {
    if (!args.resume.startsWith("http")) {
      console.warn(
        `Warning: --resume should be a URL (Google Docs link), not a local path.`
      );
      console.warn(
        `  Run 'npm run generate' to auto-upload and set the correct URL.`
      );
      console.warn(`  Skipping resume file update.`);
    } else {
      updates.resumeFile = args.resume;
    }
  }

  await updateRow(found.rowIndex, updates);
  console.log(`Updated: ${args.company}`);
}

async function handleList(args: Record<string, string>): Promise<void> {
  let rows = await getAllRows();

  if (args.stage) {
    if (!isValidStage(args.stage)) {
      console.error(`Invalid stage: ${args.stage}`);
      console.error(`Valid stages: ${STAGES.join(", ")}`);
      process.exit(1);
    }
    rows = rows.filter((r) => r.stage === args.stage);
  }

  formatTable(rows);
}

async function main() {
  const rawArgs = process.argv.slice(2);
  const command = rawArgs[0];

  if (!command || command === "--help" || command === "-h") {
    printUsage();
    process.exit(0);
  }

  const args = parseArgs(rawArgs.slice(1));

  switch (command) {
    case "add":
      await handleAdd(args);
      break;
    case "update":
      await handleUpdate(args);
      break;
    case "list":
      await handleList(args);
      break;
    default:
      console.error(`Unknown command: ${command}`);
      printUsage();
      process.exit(1);
  }
}

main().catch((err) => {
  console.error("Tracker error:", err.message);
  process.exit(1);
});
