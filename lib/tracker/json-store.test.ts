import { mkdtempSync, readFileSync, rmSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// json-store resolves docs/tracker.json against the working directory at
// import time, so each test runs in a fresh temp dir with a fresh module.
let workdir: string;
let originalCwd: string;
let store: typeof import("./json-store");

beforeEach(async () => {
  originalCwd = process.cwd();
  workdir = mkdtempSync(join(tmpdir(), "resume-agent-tracker-"));
  process.chdir(workdir);
  vi.resetModules();
  store = await import("./json-store");
});

afterEach(() => {
  process.chdir(originalCwd);
  rmSync(workdir, { recursive: true, force: true });
});

describe("json-store tracker", () => {
  it("starts empty when no file exists", async () => {
    expect(await store.getAllRows()).toEqual([]);
  });

  it("fills defaults on append and persists to docs/tracker.json", async () => {
    await store.appendRow({ company: "Example", role: "Engineer", score: 72 });

    const [row] = await store.getAllRows();
    expect(row).toMatchObject({
      company: "Example",
      role: "Engineer",
      score: 72,
      stage: "Discovered",
      origin: "outbound",
      notes: "",
    });
    expect(row.dateDiscovered).toMatch(/^\d{4}-\d{2}-\d{2}$/);

    const onDisk = JSON.parse(readFileSync(join(workdir, "docs/tracker.json"), "utf-8"));
    expect(onDisk).toHaveLength(1);
  });

  it("finds rows by company case-insensitively and by source URL", async () => {
    await store.appendRow({ company: "Example", sourceUrl: "https://example.com/1" });

    expect((await store.findRowByCompany("EXAMPLE"))?.data.company).toBe("Example");
    expect((await store.findBySourceUrl("https://example.com/1"))?.data.company).toBe("Example");
    expect(await store.findRowByCompany("Other")).toBeNull();
  });

  it("updates and deletes by id", async () => {
    await store.appendRow({ company: "Example", lastUpdated: "2000-01-01" });
    const found = await store.findRowByCompany("Example");
    const id = found!.rowIndex;

    await store.updateRow(id, { stage: "Applied" });
    const updated = await store.findById(id);
    expect(updated?.data.stage).toBe("Applied");
    expect(updated?.data.lastUpdated).not.toBe("2000-01-01");

    await store.deleteRow(id);
    expect(await store.getAllRows()).toEqual([]);
  });

  it("sorts rows by discovery date", async () => {
    await store.appendRow({ company: "Later", dateDiscovered: "2026-05-01" });
    await store.appendRow({ company: "Earlier", dateDiscovered: "2026-01-01" });

    expect((await store.getAllRowsWithIds()).map((r) => r.company)).toEqual(["Earlier", "Later"]);
  });
});
