---
name: intake
description: Intake a job description from raw pasted text (no URL needed). Extracts company, role, and JD content, saves to job-descriptions/, scores, and adds to the tracker. Use when the user pastes raw JD text directly into the chat, or says "intake this", "add this job", "score this JD".
---

# Intake Skill

Take raw job description text pasted by the user, format it into a structured markdown file, score it, and optionally add it to the tracker.

## Prerequisites

`docs/candidate-profile.json` must exist for scoring. If it doesn't exist, tell the user:
> "You need to create your profile first. Run `/onboard` to get started."

## When to use

- User pastes a block of job description text into the chat
- User says "intake this", "score this", "add this job", or similar

If the user provides a **LinkedIn URL**, use `/linkedin-scrape` instead.
If the user provides a **non-LinkedIn URL**, use `/jd-scrape` instead.

## Inputs

The raw JD text is whatever the user pasted. Optionally:
- A source URL (if they mention where it came from)
- Company name and role title (if not obvious from the text)

## Steps

### Step 1: Extract metadata from the text

Read the pasted text and extract:
- **Company name**
- **Role title**
- **Location**
- **Source URL** (if mentioned)

If company name or role title are ambiguous, ask the user.

### Step 2: Generate the slug and file path

Slugify: `{company} {abbreviated-role}` using these abbreviations:
- "business operations" -> "biz-ops"
- "product manager" -> "pm"
- "software engineer" -> "swe"
- "senior" -> "sr"

File path: `job-descriptions/{slug}.md`

Check if the file already exists. If so, ask if they want to overwrite.

### Step 3: Format and save the JD

Write to `job-descriptions/{slug}.md`:

```markdown
# {Role Title} — {Company}

**Company:** {company} ({brief description if available})
**Location:** {location}
**Source:** {source URL if provided}

## About the Role
{1-3 sentence summary in your own words}

## Key Responsibilities
- {responsibility}
- ...

## Requirements
- {requirement}
- ...

## Keywords to mirror
{comma-separated list of resume-relevant terms}
```

### Step 4: Score and track

```bash
npm run intake -- job-descriptions/{slug}.md
```

If a source URL is available:
```bash
npm run intake -- job-descriptions/{slug}.md --url "{source URL}"
```

### Step 5: Present the result

Show the score and suggest next steps:

- **Score >= 60:** Strong match -> `/tailor {slug}`
- **Score 40-59:** Moderate -> worth tailoring if strategic
- **Score < 40:** Weak -> probably skip
