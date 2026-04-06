import { pgTable, text, integer, uuid } from "drizzle-orm/pg-core";

export const applications = pgTable("applications", {
  id: uuid("id").defaultRandom().primaryKey(),
  company: text("company").notNull(),
  role: text("role").notNull(),
  sourceUrl: text("source_url").notNull().default(""),
  score: integer("score"),
  stage: text("stage").notNull().default("Discovered"),
  resumeFile: text("resume_file").notNull().default(""),
  jdFile: text("jd_file").notNull().default(""),
  coverLetterFile: text("cover_letter_file").notNull().default(""),
  driveFolderId: text("drive_folder_id").notNull().default(""),
  resumeFileId: text("resume_file_id").notNull().default(""),
  coverLetterFileId: text("cover_letter_file_id").notNull().default(""),
  origin: text("origin").notNull().default("outbound"),
  notes: text("notes").notNull().default(""),
  dateDiscovered: text("date_discovered").notNull(),
  dateApplied: text("date_applied").notNull().default(""),
  lastUpdated: text("last_updated").notNull(),
});

export type ApplicationRow = typeof applications.$inferSelect;
export type NewApplicationRow = typeof applications.$inferInsert;
