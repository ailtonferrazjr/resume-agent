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

If not found, tell the user:
> "Install the Google Cloud CLI first: https://cloud.google.com/sdk/docs/install"
> "On macOS: `brew install google-cloud-sdk`"

### Step 2: Authenticate

```bash
gcloud auth login
```

Then set up application default credentials with Drive scope:

```bash
gcloud auth application-default login --scopes=https://www.googleapis.com/auth/drive.file,https://www.googleapis.com/auth/documents
```

Tell the user: "Two browser windows will open for authentication. Sign in with the Google account where you want resumes stored."

### Step 3: Create or identify a Drive folder

Ask the user (use AskUserQuestion):

> "Where should I upload your resumes in Google Drive?"
> 1. Create a new folder called "Job Applications"
> 2. I already have a folder — I'll give you the ID

**If creating new:**
> "Open Google Drive, create a folder called 'Job Applications'. The URL will look like `https://drive.google.com/drive/folders/XXXXX`. Copy the XXXXX part — that's your folder ID."

**If existing:** Ask for the folder ID.

### Step 4: Configure .env

Add the folder ID to `.env`:

```
DRIVE_FOLDER_ID=<the folder ID>
```

### Step 5: Verify

```bash
npm run upload -- --list
```

Should list files (or "No files found" if empty). No errors means it's working.

Tell the user: "Google Drive integration is configured. `npm run generate` will auto-upload to your Drive folder."
