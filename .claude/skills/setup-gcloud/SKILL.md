---
name: setup-gcloud
description: Set up Google Cloud CLI for Drive/Docs integration. Guides through authentication and folder configuration. Use when the user says "setup google", "setup drive", "setup gcloud", or wants to upload resumes to Google Drive.
---

# Google Cloud Setup Skill

Google Drive integration is optional. It enables automatic upload of generated .docx resumes and cover letters to a Google Drive folder.

## Steps

### Step 1: Check if gcloud is installed

```bash
which gcloud
```

If not found, check if brew is available and install:

```bash
which brew
```

**If brew is available (macOS/Linux):**

```bash
brew install google-cloud-sdk
```

After install, verify:

```bash
gcloud --version
```

**If brew is not available:**
> "Install the Google Cloud CLI manually: https://cloud.google.com/sdk/docs/install"
> "Once installed, come back and run `/setup-gcloud` again."

### Step 2: Check if already authenticated

```bash
gcloud auth print-access-token 2>/dev/null | head -c 20
```

If this prints a token prefix, gcloud is already authenticated — skip to Step 4.

### Step 3: Authenticate

Tell the user:
> "I need to authenticate with Google. This will open two browser windows — sign in with the Google account where you want your resumes stored."

First, general gcloud login:

```bash
gcloud auth login
```

Wait for the browser flow to complete. Then verify it worked:

```bash
gcloud auth list
```

Should show an active account. If not, the user may have cancelled the browser flow — retry.

Then set up application default credentials (this is what the Drive API uses):

```bash
gcloud auth application-default login --scopes=https://www.googleapis.com/auth/drive.file,https://www.googleapis.com/auth/documents
```

Again wait for browser flow. Verify:

```bash
gcloud auth application-default print-access-token 2>/dev/null | head -c 20
```

If no token, the auth failed — ask the user to retry.

### Step 4: Create or identify a Drive folder

Ask the user (use AskUserQuestion):

> "Where should I upload your resumes in Google Drive?"
> 1. Create a new "Job Applications" folder automatically
> 2. I already have a folder — I'll give you the ID

**If creating new — create it via the API:**

```bash
curl -s -X POST "https://www.googleapis.com/drive/v3/files" \
  -H "Authorization: Bearer $(gcloud auth print-access-token)" \
  -H "Content-Type: application/json" \
  -d '{"name": "Job Applications", "mimeType": "application/vnd.google-apps.folder"}'
```

Extract the `id` field from the JSON response — that's the folder ID.

**If existing:** Ask for the folder ID. Tell them:
> "Open the folder in Google Drive. The URL looks like `https://drive.google.com/drive/folders/XXXXX`. The XXXXX part is your folder ID."

### Step 5: Configure .env

Create or update `.env` with the folder ID:

```bash
touch .env
```

Check if DRIVE_FOLDER_ID already exists in .env. If not, append it. If it does, update it.
Use the Edit tool to set:

```
DRIVE_FOLDER_ID=<the folder ID from Step 4>
```

### Step 6: Verify

```bash
npm run upload -- --list
```

Should list files (or "No files found" if the folder is empty). No errors means it's working.

If it errors with an auth issue:
- Re-run Step 3 (the application-default credentials may have expired)
- Check that the DRIVE_FOLDER_ID is correct

Tell the user:
> "Google Drive is set up. When you run `npm run generate -- resumes/<slug>.md`, the .docx will automatically upload to your Drive folder."
