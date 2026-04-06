---
name: linkedin-scrape
description: Scrape a LinkedIn job posting and save it as a structured JD markdown file. Use when the user provides a LinkedIn job URL or asks to scrape/extract a job description from LinkedIn.
---

# LinkedIn Job Scrape Skill

Scrape a LinkedIn job posting and save it as a structured markdown file in `job-descriptions/`.

## Inputs

The user provides:
- A LinkedIn job URL (e.g., `https://www.linkedin.com/jobs/view/1234567890/`)

## Extraction Steps

### Step 1: Navigate to the Job Posting

Run the following Bash command to open the URL:

```bash
agent-browser open "<linkedin_url>"
```

Then wait for the page to load:

```bash
agent-browser wait --load networkidle
```

### Step 2: Extract Page Content

Get all visible text from the page:

```bash
agent-browser get text
```

This is the **primary data source** — it captures all visible text content. Check if the extracted text contains actual job details (role title, responsibilities, requirements). If it does NOT and instead shows a login wall or generic LinkedIn content:
- Tell the user: "LinkedIn is showing a login wall. Please log into LinkedIn in the Chrome browser first, then ask me to scrape again."
- Stop here.

### Step 3: Expand Truncated Descriptions

LinkedIn often truncates long job descriptions behind a "Show more" or "See more" button.

1. Take an interactive snapshot to find element refs:

```bash
agent-browser snapshot -i
```

2. Look for a "Show more" or "See more" button in the snapshot output. If found, click it by its ref (e.g., `@e5`):

```bash
agent-browser click @e5
```

3. Wait briefly, then re-extract the full text:

```bash
agent-browser wait --load networkidle
agent-browser get text
```

### Step 4: Parse Into Structured Format

From the extracted page text, build the markdown file in this exact format:

```markdown
# {Role Title} — {Company}

**Company:** {company} ({brief description if available from the page})
**Location:** {location} ({remote/hybrid/onsite if specified})
**Team:** {team/department if mentioned}
**Salary:** {salary range if listed}
**Source:** {the LinkedIn URL}

## About the Role
{1-3 sentence summary of what the role is about — write this yourself, do NOT copy verbatim from the JD}

## Key Responsibilities
- {responsibility 1}
- {responsibility 2}
- ...

## Requirements
- {requirement 1}
- {requirement 2}
- ...

## Keywords to mirror
{comma-separated list of the most resume-relevant terms extracted from the JD}
```

**Parsing rules:**
- **About the Role:** Summarize in your own words, 1-3 sentences. Do not copy paragraphs from the JD verbatim.
- **Key Responsibilities:** Distill into concise bullet points. Combine redundant items. Restructure and rephrase rather than copying word-for-word.
- **Requirements:** Same approach — concise, restructured bullets.
- **Keywords to mirror:** This is YOUR analysis of the JD, not a section from it. Extract the terms that matter most for tailoring a resume: hard skills, tools, frameworks, domain terms, seniority signals. Comma-separated, no fluff.
- **Salary:** Include as a header field ONLY if the JD explicitly lists a salary range. Omit the field entirely if no salary is mentioned.
- **Team:** Include only if the JD mentions a specific team or department. Omit otherwise.
- Do NOT copy large chunks of text verbatim from the posting. Summarize and restructure to respect copyright.

### Step 5: Generate Filename

Slugify the company name and role title into a filename:
- Lowercase everything
- Replace spaces and special characters with hyphens
- Remove consecutive hyphens
- Example: "Business Operations Manager" at "Fever" becomes `fever-biz-ops-manager.md`
- Keep it short and readable — abbreviate common terms (e.g., "biz-ops" for "business operations", "swe" for "software engineer", "pm" for "product manager", "eng" for "engineering")

### Step 6: Save the File

Write the markdown content to `job-descriptions/{filename}.md` using the Write tool.

Confirm to the user: "Saved job description to `job-descriptions/{filename}.md`"

### Step 7: Score and Track

After saving, automatically run intake to score and add to the application tracker:

```bash
npm run intake -- job-descriptions/{filename}.md --url "{the LinkedIn URL}"
```

This will print the score breakdown and scores and adds to the application tracker.

If the score is 60+, suggest: `/tailor {filename-without-extension}`

## Troubleshooting

| Problem | Solution |
|---|---|
| Login wall / no job content | Ask user to log into LinkedIn in Chrome first, then retry |
| Truncated description | Take snapshot with `agent-browser snapshot -i`, find and click the "Show more" / "See more" button ref, then re-run `agent-browser get text` |
| Page didn't load | Re-run `agent-browser wait --load networkidle` and retry `agent-browser get text` |
| Content in wrong language | Extract as-is — the user can request translation separately |
| Multiple job postings visible | Use `agent-browser snapshot -i` to identify the correct job's elements, focus extraction on that posting's content |
