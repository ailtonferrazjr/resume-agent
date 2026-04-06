---
name: jd-scrape
description: Scrape a job posting from any URL (Greenhouse, Lever, Ashby, company sites) and save it as a structured JD markdown file. Use when the user provides a non-LinkedIn job URL.
---

# JD Scrape Skill

Scrape a job description from any public job posting URL and save it as a structured markdown file in `job-descriptions/`.

## Inputs

The user provides:
- A job URL (e.g., Greenhouse, Lever, Ashby, or a company careers page)

If the URL is a LinkedIn URL, use the `/linkedin-scrape` skill instead.

## Extraction Steps

### Step 1: Navigate to the Job Posting

```bash
agent-browser open "<job_url>"
```

Then wait for the page to load:

```bash
agent-browser wait --load networkidle
```

### Step 2: Extract Page Content

Get all visible text from the page:

```bash
agent-browser get-text
```

Check if the output contains actual job content (role title, responsibilities, requirements). Most ATS pages (Greenhouse, Lever, Ashby) are public and load without authentication.

If the page is blank, redirected, or shows an error, take a screenshot to diagnose:

```bash
agent-browser screenshot --annotate
```

### Step 3: Expand Truncated Content (if needed)

Some job boards collapse sections or use "Read more" / "Show more" buttons. If the extracted text looks incomplete:

1. Take an interactive snapshot to find element refs:

```bash
agent-browser snapshot -i
```

2. Look for expand buttons in the snapshot output. If found, click by ref (e.g., `@e3`):

```bash
agent-browser click @e3
```

3. Re-extract after expanding:

```bash
agent-browser wait --load networkidle
agent-browser get-text
```

### Step 4: Parse Into Structured Format

From the extracted page text, build the markdown file in this exact format:

```markdown
# {Role Title} — {Company}

**Company:** {company} ({brief description if available from the page})
**Location:** {location} ({remote/hybrid/onsite if specified})
**Team:** {team/department if mentioned}
**Salary:** {salary range if listed}
**Source:** {the job URL}

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
- Example: "Senior Product Manager" at "Acme Corp" becomes `acme-sr-pm.md`
- Keep it short and readable — abbreviate common terms (e.g., "biz-ops" for "business operations", "swe" for "software engineer", "pm" for "product manager", "sr" for "senior", "eng" for "engineering")

### Step 6: Save the File

Write the markdown content to `job-descriptions/{filename}.md` using the Write tool.

Confirm to the user: "Saved job description to `job-descriptions/{filename}.md`"

### Step 7: Score and Track

After saving, automatically run intake to score and add to the application tracker:

```bash
npm run intake -- job-descriptions/{filename}.md --url "{the job URL}"
```

This will print the score breakdown and scores and adds to the application tracker.

If the score is 60+, suggest: `/tailor {filename-without-extension}`

## Troubleshooting

| Problem | Solution |
|---|---|
| Blank page or redirect | Use `agent-browser screenshot --annotate` to diagnose; check if the URL requires auth |
| Collapsed sections | Use `agent-browser snapshot -i` to find expand buttons, click them, then re-extract |
| Page still loading | Re-run `agent-browser wait --load networkidle` and retry `agent-browser get-text` |
| Content in wrong language | Extract as-is — the user can request translation separately |
| Pagination / multi-page JD | Navigate to each page and combine the extracted text before parsing |
