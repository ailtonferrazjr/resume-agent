# Resume Agent

An AI-powered career management system built on Claude Code. It interviews you to build a deep career profile, then generates tailored resumes and cover letters for specific job descriptions.

## Quick Start

```bash
git clone <this-repo>
cd resume-agent
npm install
```

Open in Claude Code, then run:

```
/onboard
```

The onboarding skill interviews you for 15-30 minutes to build your career profile. After that, you're ready to apply to jobs.

## How It Works

1. **`/onboard`** — Deep interview builds your career context, scoring profile, and base resumes
2. **`/intake`** or **`/jd-scrape <url>`** or **`/linkedin-scrape <url>`** — Add a job description
3. **`/tailor <slug>`** — Generate a tailored resume for that specific role
4. **`npm run generate -- resumes/<slug>.md`** — Convert to formatted .docx
5. **`/cover-letter <slug>`** — Generate a tailored cover letter (if needed)

## Skills Reference

| Skill | What it does |
|-------|-------------|
| `/onboard` | First-time setup, builds your career profile |
| `/intake` | Add a job description (paste raw text) |
| `/jd-scrape <url>` | Scrape a job posting from any URL |
| `/linkedin-scrape <url>` | Scrape from LinkedIn |
| `/tailor <slug>` | Generate a tailored resume |
| `/cover-letter <slug>` | Generate a tailored cover letter |
| `/resume-review` | Review resume for AI patterns and quality |
| `/cover-letter-review` | Review cover letter for quality |
| `/setup-db` | Set up application tracking (optional) |
| `/setup-gcloud` | Set up Google Drive upload (optional) |
| `/setup-browser` | Set up LinkedIn scraping (optional) |

## Prerequisites

- **Node.js 20+**
- **Claude Code CLI**

## Optional Integrations

### Application Tracker (Postgres)

Track application stages, scores, and files. Any Postgres instance works (Supabase free tier, Neon, or local).

```
/setup-db
```

### Google Drive Upload

Auto-upload generated .docx files to a Google Drive folder.

```
/setup-gcloud
```

### LinkedIn Scraping

Scrape job postings directly from LinkedIn URLs.

```
/setup-browser
```

## CLI Commands

| Command | What it does |
|---------|-------------|
| `npm run generate -- resumes/<slug>.md` | Generate .docx from resume markdown |
| `npm run generate:cover -- cover-letters/<slug>.md` | Generate .docx from cover letter |
| `npm run intake -- job-descriptions/<slug>.md` | Score a JD and add to tracker |
| `npm run score -- job-descriptions/<slug>.md` | Score a JD (no tracker) |
| `npm run tracker -- list` | List tracked applications |
| `npm run upload -- outputs/<file>.docx` | Upload to Google Drive |

## Project Structure

```
resume-agent/
  .claude/skills/     # Claude Code skills (the primary interface)
  cli/                # CLI entry points
  docs/               # Career context and templates
  lib/                # Core business logic
  resumes/            # Base and tailored resumes (markdown)
  job-descriptions/   # Job descriptions (markdown)
  cover-letters/      # Cover letters (markdown)
  outputs/            # Generated .docx files
```
