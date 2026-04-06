import { google, type drive_v3 } from "googleapis";
import { createReadStream } from "fs";
import { basename } from "path";
import { getGoogleAuthClient } from "./google-auth";

function getDriveFolderId(): string {
  const id = process.env.DRIVE_FOLDER_ID;
  if (!id) {
    throw new Error(
      "DRIVE_FOLDER_ID is not set in .env.\n" +
      "Run /setup-gcloud to configure Google Drive integration."
    );
  }
  return id;
}

let driveClient: drive_v3.Drive | null = null;

export async function getDriveClient(): Promise<drive_v3.Drive> {
  if (driveClient) return driveClient;
  const client = await getGoogleAuthClient();
  driveClient = google.drive({ version: "v3", auth: client as any });
  return driveClient;
}

export async function findFileByName(
  fileName: string,
  folderId?: string
): Promise<string | null> {
  const folder = folderId ?? getDriveFolderId();
  const drive = await getDriveClient();
  const res = await drive.files.list({
    q: `name = '${fileName}' and '${folder}' in parents and trashed = false`,
    fields: "files(id, name)",
    spaces: "drive",
  });
  return res.data.files?.[0]?.id ?? null;
}

export async function uploadFile(
  localPath: string,
  folderId?: string
): Promise<{ fileId: string; url: string; action: "created" | "updated" }> {
  const folder = folderId ?? getDriveFolderId();
  const drive = await getDriveClient();
  const fileName = basename(localPath);
  const mimeType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  const media = { mimeType, body: createReadStream(localPath) };
  const existingId = await findFileByName(fileName, folder);

  if (existingId) {
    const res = await drive.files.update({ fileId: existingId, media, fields: "id" });
    const fileId = res.data.id!;
    return { fileId, url: `https://docs.google.com/document/d/${fileId}/edit`, action: "updated" };
  }

  const res = await drive.files.create({
    requestBody: { name: fileName, parents: [folder], mimeType },
    media,
    fields: "id",
  });
  const fileId = res.data.id!;
  return { fileId, url: `https://docs.google.com/document/d/${fileId}/edit`, action: "created" };
}

export async function listFiles(
  folderId?: string
): Promise<Array<{ id: string; name: string; modifiedTime: string }>> {
  const folder = folderId ?? getDriveFolderId();
  const drive = await getDriveClient();
  const res = await drive.files.list({
    q: `'${folder}' in parents and trashed = false`,
    fields: "files(id, name, modifiedTime)",
    orderBy: "name",
    spaces: "drive",
  });
  return res.data.files?.map((f) => ({ id: f.id!, name: f.name!, modifiedTime: f.modifiedTime! })) ?? [];
}

export async function deleteFile(fileId: string): Promise<void> {
  const drive = await getDriveClient();
  await drive.files.delete({ fileId });
}

export async function uploadAsGoogleDoc(
  localPath: string,
  docName: string,
  folderId?: string
): Promise<{ fileId: string; url: string; action: "created" | "updated" }> {
  const folder = folderId ?? getDriveFolderId();
  const drive = await getDriveClient();
  const media = {
    mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    body: createReadStream(localPath),
  };
  const existingId = await findGoogleDocByName(docName, folder);
  let action: "created" | "updated" = "created";
  if (existingId) {
    await drive.files.delete({ fileId: existingId });
    action = "updated";
  }
  const res = await drive.files.create({
    requestBody: { name: docName, parents: [folder], mimeType: "application/vnd.google-apps.document" },
    media,
    fields: "id",
  });
  const fileId = res.data.id!;
  return { fileId, url: `https://docs.google.com/document/d/${fileId}/edit`, action };
}

export async function getOrCreateJobFolder(
  folderName: string,
  parentFolderId?: string
): Promise<string> {
  const parent = parentFolderId ?? getDriveFolderId();
  const drive = await getDriveClient();
  const res = await drive.files.list({
    q: `name = '${folderName}' and '${parent}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
    fields: "files(id, name)",
    spaces: "drive",
  });
  const existing = res.data.files?.[0];
  if (existing?.id) return existing.id;
  const created = await drive.files.create({
    requestBody: { name: folderName, parents: [parent], mimeType: "application/vnd.google-apps.folder" },
    fields: "id",
  });
  return created.data.id!;
}

export async function uploadTextFile(
  localPath: string,
  folderId: string
): Promise<{ fileId: string; url: string }> {
  const drive = await getDriveClient();
  const fileName = basename(localPath);
  const media = { mimeType: "text/plain", body: createReadStream(localPath) };
  const existingId = await findFileByName(fileName, folderId);
  if (existingId) {
    await drive.files.update({ fileId: existingId, media, fields: "id" });
    return { fileId: existingId, url: `https://drive.google.com/file/d/${existingId}/view` };
  }
  const res = await drive.files.create({
    requestBody: { name: fileName, parents: [folderId] },
    media,
    fields: "id",
  });
  const fileId = res.data.id!;
  return { fileId, url: `https://drive.google.com/file/d/${fileId}/view` };
}

export async function findGoogleDocByName(
  name: string,
  folderId?: string
): Promise<string | null> {
  const folder = folderId ?? getDriveFolderId();
  const drive = await getDriveClient();
  const res = await drive.files.list({
    q: `name = '${name}' and '${folder}' in parents and mimeType = 'application/vnd.google-apps.document' and trashed = false`,
    fields: "files(id, name)",
    spaces: "drive",
  });
  return res.data.files?.[0]?.id ?? null;
}
