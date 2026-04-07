import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { randomUUID } from "crypto";
import type { TrackerRow, Stage } from "./repository";

const STORE_PATH = resolve("docs/tracker.json");

interface StoredRow {
  id: string;
  data: TrackerRow;
}

function ensureDir(): void {
  const dir = dirname(STORE_PATH);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

function readStore(): StoredRow[] {
  if (!existsSync(STORE_PATH)) return [];
  const raw = readFileSync(STORE_PATH, "utf-8");
  if (!raw.trim()) return [];
  return JSON.parse(raw) as StoredRow[];
}

function writeStore(rows: StoredRow[]): void {
  ensureDir();
  writeFileSync(STORE_PATH, JSON.stringify(rows, null, 2));
}

export async function appendRow(row: Partial<TrackerRow>): Promise<void> {
  const rows = readStore();
  const today = new Date().toISOString().split("T")[0];
  rows.push({
    id: randomUUID(),
    data: {
      company: row.company ?? "",
      role: row.role ?? "",
      sourceUrl: row.sourceUrl ?? "",
      score: row.score ?? null,
      stage: (row.stage ?? "Discovered") as Stage,
      resumeFile: row.resumeFile ?? "",
      jdFile: row.jdFile ?? "",
      coverLetterFile: row.coverLetterFile ?? "",
      driveFolderId: row.driveFolderId ?? "",
      resumeFileId: row.resumeFileId ?? "",
      coverLetterFileId: row.coverLetterFileId ?? "",
      origin: row.origin ?? "outbound",
      notes: row.notes ?? "",
      dateDiscovered: row.dateDiscovered ?? today,
      dateApplied: row.dateApplied ?? "",
      lastUpdated: row.lastUpdated ?? today,
    },
  });
  writeStore(rows);
}

export async function getAllRows(): Promise<TrackerRow[]> {
  return readStore()
    .map((r) => r.data)
    .sort((a, b) => a.dateDiscovered.localeCompare(b.dateDiscovered));
}

export async function findRowByCompany(
  company: string
): Promise<{ rowIndex: string; data: TrackerRow } | null> {
  const match = readStore().find(
    (r) => r.data.company.toLowerCase() === company.toLowerCase()
  );
  if (!match) return null;
  return { rowIndex: match.id, data: match.data };
}

export async function findById(
  id: string
): Promise<{ id: string; data: TrackerRow } | null> {
  const match = readStore().find((r) => r.id === id);
  if (!match) return null;
  return { id: match.id, data: match.data };
}

export async function findBySourceUrl(
  url: string
): Promise<{ id: string; data: TrackerRow } | null> {
  const match = readStore().find((r) => r.data.sourceUrl === url);
  if (!match) return null;
  return { id: match.id, data: match.data };
}

export async function updateRow(
  id: string,
  updates: Partial<TrackerRow>
): Promise<void> {
  const rows = readStore();
  const idx = rows.findIndex((r) => r.id === id);
  if (idx === -1) return;
  rows[idx].data = {
    ...rows[idx].data,
    ...updates,
    lastUpdated: new Date().toISOString().split("T")[0],
  };
  writeStore(rows);
}

export async function deleteRow(id: string): Promise<void> {
  const rows = readStore().filter((r) => r.id !== id);
  writeStore(rows);
}

export async function getAllRowsWithIds(): Promise<
  Array<{ id: string } & TrackerRow>
> {
  return readStore()
    .map((r) => ({ id: r.id, ...r.data }))
    .sort((a, b) => a.dateDiscovered.localeCompare(b.dateDiscovered));
}
