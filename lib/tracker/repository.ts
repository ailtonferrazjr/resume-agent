import { eq, ilike } from "drizzle-orm";
import { db } from "./db";
import { applications } from "./schema";

export const STAGES = [
  "Discovered",
  "Scored",
  "Resume Generated",
  "Applied",
  "Interview",
  "Offer",
  "Accepted",
  "Rejected",
  "Archived",
] as const;

export type Stage = (typeof STAGES)[number];

export interface TrackerRow {
  company: string;
  role: string;
  sourceUrl: string;
  score: number | null;
  stage: Stage;
  resumeFile: string;
  dateDiscovered: string;
  dateApplied: string;
  origin: string;
  notes: string;
  lastUpdated: string;
  jdFile: string;
  coverLetterFile: string;
  driveFolderId: string;
  resumeFileId: string;
  coverLetterFileId: string;
}

function toTrackerRow(row: typeof applications.$inferSelect): TrackerRow {
  return {
    company: row.company,
    role: row.role,
    sourceUrl: row.sourceUrl,
    score: row.score,
    stage: row.stage as Stage,
    resumeFile: row.resumeFile,
    dateDiscovered: row.dateDiscovered,
    dateApplied: row.dateApplied,
    origin: row.origin,
    notes: row.notes,
    lastUpdated: row.lastUpdated,
    jdFile: row.jdFile,
    coverLetterFile: row.coverLetterFile,
    driveFolderId: row.driveFolderId,
    resumeFileId: row.resumeFileId,
    coverLetterFileId: row.coverLetterFileId,
  };
}

function isDbAvailable(): boolean {
  if (!db) {
    console.warn("[tracker] No DATABASE_URL configured — skipping tracker operation.");
    return false;
  }
  return true;
}

export async function appendRow(row: Partial<TrackerRow>): Promise<void> {
  if (!isDbAvailable()) return;
  const today = new Date().toISOString().split("T")[0];
  await db!.insert(applications).values({
    company: row.company ?? "",
    role: row.role ?? "",
    sourceUrl: row.sourceUrl ?? "",
    score: row.score ?? null,
    stage: row.stage ?? "Discovered",
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
  });
}

export async function getAllRows(): Promise<TrackerRow[]> {
  if (!isDbAvailable()) return [];
  const rows = await db!.select().from(applications).orderBy(applications.dateDiscovered);
  return rows.map(toTrackerRow);
}

export async function findRowByCompany(
  company: string
): Promise<{ rowIndex: string; data: TrackerRow } | null> {
  if (!isDbAvailable()) return null;
  const rows = await db!.select().from(applications).where(ilike(applications.company, company));
  if (rows.length === 0) return null;
  return { rowIndex: rows[0].id, data: toTrackerRow(rows[0]) };
}

export async function findById(
  id: string
): Promise<{ id: string; data: TrackerRow } | null> {
  if (!isDbAvailable()) return null;
  const rows = await db!.select().from(applications).where(eq(applications.id, id));
  if (rows.length === 0) return null;
  return { id: rows[0].id, data: toTrackerRow(rows[0]) };
}

export async function findBySourceUrl(
  url: string
): Promise<{ id: string; data: TrackerRow } | null> {
  if (!isDbAvailable()) return null;
  const rows = await db!.select().from(applications).where(eq(applications.sourceUrl, url));
  if (rows.length === 0) return null;
  return { id: rows[0].id, data: toTrackerRow(rows[0]) };
}

export async function updateRow(
  id: string,
  updates: Partial<TrackerRow>
): Promise<void> {
  if (!isDbAvailable()) return;
  await db!.update(applications).set({
    ...updates,
    lastUpdated: new Date().toISOString().split("T")[0],
  }).where(eq(applications.id, id));
}

export async function deleteRow(id: string): Promise<void> {
  if (!isDbAvailable()) return;
  await db!.delete(applications).where(eq(applications.id, id));
}

export async function getAllRowsWithIds(): Promise<Array<{ id: string } & TrackerRow>> {
  if (!isDbAvailable()) return [];
  const rows = await db!.select().from(applications).orderBy(applications.dateDiscovered);
  return rows.map((row) => ({ id: row.id, ...toTrackerRow(row) }));
}
