# Resume Agent

[![CI](https://github.com/ailtonferrazjr/resume-agent/actions/workflows/ci.yml/badge.svg)](https://github.com/ailtonferrazjr/resume-agent/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

A job application workflow that runs inside [Claude Code](https://docs.claude.com/en/docs/claude-code). Claude interviews you once to build a detailed career profile, then uses it to score job descriptions and write a tailored resume and cover letter for each role. A small TypeScript CLI turns the markdown into formatted `.docx` files and keeps a tracker of where every application stands. It exists because tailoring every application by hand is slow, and resumes written by a general-purpose chatbot are easy to spot.

## How it works

The interface is a set of Claude Code skills in `.claude/skills/`. Each skill is a prompt that tells Claude which files to read, what to write, and which CLI command to run.

1. **`/onboard`** interviews you (15 to 30 minutes) and writes `docs/career_master_context.md`, `docs/candidate-profile.json`, and base resumes in `resumes/`. Everything else depends on this.
2. **Add a job.** `/intake` takes pasted JD text, `/jd-scrape <url>` reads a posting from Greenhouse, Lever, Ashby or a company site, and `/linkedin-scrape <url>` reads a LinkedIn posting. Each one saves `job-descriptions/<slug>.md`, scores it against your profile, and adds it to the tracker.
3. **`/tailor <slug>`** picks the closest base resume, pulls relevant experience from your career context, writes `resumes/<slug>.md`, and runs `/resume-review` on it to catch banned words, em dashes and weak metrics.
4. **`npm run generate -- resumes/<slug>.md`** renders the resume to `outputs/<slug>.docx`, and uploads it to Google Drive if that is configured.
5. **`/cover-letter <slug>`** (optional) writes `cover-letters/<slug>.md` from the tailored resume, reviewed by `/cover-letter-review`. Render it with `npm run generate:cover`.

The scorer is deterministic, not an LLM call. It weighs skills overlap (35), seniority (20), location (20), company stage (15) and role type (10), and returns one of STRONG APPLY, APPLY WITH TAILORING, CONSIDER or SKIP.

## Quick start

```bash
git clone https://github.com/ailtonferrazjr/resume-agent.git
cd resume-agent
npm install
```

Open the folder in Claude Code and run:

```
/onboard
```

After onboarding you can add a job and tailor for it. To try the renderer without onboarding, use the fictional example:

```bash
npm run generate -- examples/sample-resume.md --docx
```

## Example output

Everything in [`examples/`](examples/) is fictional. Priya Lindqvist and the companies she worked at do not exist.

| Input | Output |
|---|---|
| [`sample-resume.md`](examples/sample-resume.md) | [`sample-resume.docx`](examples/sample-resume.docx) |
| [`sample-cover-letter.md`](examples/sample-cover-letter.md) | [`sample-cover-letter.docx`](examples/sample-cover-letter.docx) |

Scoring [`sample-job-description.md`](examples/sample-job-description.md) against [`sample-candidate-profile.json`](examples/sample-candidate-profile.json) prints:

```
Job Score: 91/100 (sample-job-description)

  Skills Match:      26/35  ( 75%)  matched: typescript, python, postgresql, aws, sqs, terraform
  Seniority Fit:     20/20  (100%)  JD asks 5+ yrs; candidate has 7 yrs engineering
  Location:          20/20  (100%)  remote
  Company Stage:     15/15  (100%)  startup/early-stage signals
  Role Type Fit:     10/10  (100%)  engineering role (rank 1 of 4)

Recommendation: STRONG APPLY
```

The `.docx` files use the Work Sans font. Install it, or open the files in Google Docs, to see the intended layout.

## Requirements

| Dependency | What it does | Required? |
|---|---|---|
| **Node.js 20+** | Runs the CLI and tests | Yes |
| **Claude Code** | Runs the skills | Yes |
| **agent-browser** | Scrapes jobs from LinkedIn and other sites | No, you can paste JDs with `/intake` |
| **gcloud CLI** | Uploads `.docx` files to Google Drive | No, `--docx` keeps output local |
| **Postgres** | Cloud-backed application tracker | No, a local JSON file is the default |

The core workflow (onboard, intake, tailor, generate) needs only Node.js and Claude Code. The optional pieces have setup skills: `/setup-browser`, `/setup-gcloud` and `/setup-db`.

## Skills

| Skill | What it does |
|---|---|
| `/onboard` | First-time interview, builds your career profile and base resumes |
| `/intake` | Adds a job from pasted text |
| `/jd-scrape <url>` | Adds a job from any posting URL |
| `/linkedin-scrape <url>` | Adds a job from LinkedIn |
| `/tailor <slug>` | Writes a tailored resume |
| `/cover-letter <slug>` | Writes a tailored cover letter |
| `/resume-review` | Checks a resume for AI writing patterns, relevance and metrics |
| `/cover-letter-review` | Checks a cover letter for length, tone and specificity |
| `/setup-db` | Moves the tracker to Postgres |
| `/setup-gcloud` | Configures Google Drive upload |
| `/setup-browser` | Configures agent-browser for LinkedIn |

## CLI

| Command | What it does |
|---|---|
| `npm run generate -- resumes/<slug>.md [--docx]` | Render a resume to `.docx` |
| `npm run generate:cover -- cover-letters/<slug>.md [--docx]` | Render a cover letter to `.docx` |
| `npm run intake -- job-descriptions/<slug>.md` | Score a JD and add it to the tracker |
| `npm run score -- job-descriptions/<slug>.md` | Score a JD only |
| `npm run tracker -- list` | List tracked applications |
| `npm run upload -- outputs/<file>.docx` | Upload a file to Google Drive |
| `npm run typecheck` | Type-check the project |
| `npm test` | Run the unit tests |

## Architecture

```
.claude/skills/   Claude Code skills, one folder per command. The primary interface.
cli/              Thin entry points behind the npm scripts. Parse args, call lib/, print.
lib/
  resume/         Markdown parser and .docx renderer for resumes
  cover-letter/   Markdown parser and .docx renderer for cover letters
  jd/             JD parser, raw text formatter, scorer, score formatter
  candidate/      Loads docs/candidate-profile.json
  tracker/        Application tracker: local JSON store or Postgres via Drizzle
  infra/          Google auth and Drive upload
docs/             Career context template and the .docx formatting spec
examples/         Fictional inputs and generated output
```

The resume and cover letter formats are plain markdown with a fixed structure (see `docs/template-spec.md` and the template in `.claude/skills/onboard/SKILL.md`). Claude writes that markdown, the parsers in `lib/` turn it into typed objects, and the renderers build the `.docx` with the [`docx`](https://github.com/dolanmiu/docx) library. Keeping the LLM on the markdown side means every document can be read, diffed and edited by hand before it is rendered.

Unit tests live next to the code (`lib/**/*.test.ts`) and cover the parsers, the scorer and the JSON tracker. None of them touch the network or a database.

## License

[MIT](LICENSE)
