---
name: tailor
description: Generate a tailored resume for a specific job description. Takes a JD slug or file path, reads career context, picks the right base resume, and produces a fully tailored resume markdown file. Use when the user says "tailor", "generate resume for", or provides a JD slug after scoring.
---

# Resume Tailor Skill

Generate a tailored resume markdown file for a specific job description.

## Prerequisites

Before running this skill, ensure:
- `docs/career_master_context.md` exists and is populated (run `/onboard` if not)
- `docs/candidate-profile.json` exists (created by `/onboard`)
- At least one base resume exists in `resumes/` (created by `/onboard`)

If any of these are missing, tell the user to run `/onboard` first.

## Inputs

The user provides one of:
- A JD slug (e.g., `deel-sr-product-ops-manager`)
- A JD file path (e.g., `job-descriptions/deel-sr-product-ops-manager.md`)

## Steps

### Step 1: Load the JD

Resolve the input to a file path:
- If the input doesn't contain `/` or `.md`, treat it as a slug and look for `job-descriptions/{slug}.md`
- Read the JD file

If the file doesn't exist, tell the user and suggest:
- `/intake` to add a job description from pasted text
- `/linkedin-scrape <url>` to scrape from LinkedIn
- `/jd-scrape <url>` to scrape from any other URL

### Step 2: Score the JD

```bash
npm run score -- job-descriptions/{slug}.md
```

Note the score breakdown — this tells you which dimensions are strong (lean into them) and which are weak (compensate with adjacent experience).

### Step 3: Determine Role Type and Base Resume

Based on the JD's role type (visible in the score output), pick the base resume:

| Role Type | Base Resume |
|---|---|
| engineering | `resumes/engineering.md` |
| product | `resumes/product-manager.md` |
| biz-ops | `resumes/biz-ops.md` |
| hybrid | Pick the closest match based on JD responsibilities |

Read the base resume for structural reference.

### Step 4: Load Career Context

Read `docs/career_master_context.md` — the single source of truth for all experiences, metrics, and technical details.

### Step 5: Check for Existing Tailored Resumes

Check if `resumes/{slug}.md` already exists. If it does:
- Read it
- Ask the user: "A tailored resume already exists. Want me to rewrite from scratch or refine the existing one?"

### Step 6: Generate the Tailored Resume

Write a fully tailored resume to `resumes/{slug}.md`.

**Use contact info from `docs/career_master_context.md` Section 1 (Personal Information).**

**Structure must match the base resume exactly:**

```markdown
# {Full Name}

**Email:** {email} | **LinkedIn:** [{display}]({url})
**Phone:** {phone} | **Location:** {location}

---

## SUMMARY

{1 paragraph, tailored to this specific role}

---

## PROFESSIONAL EXPERIENCE

### {Company} — {Role}
**{Location} | {Date Range}**

- {Bullet}
- ...

**Stack:** {only if relevant to role type}

---

## EDUCATION

{Same as base resume}

---

## SKILLS

{Tailored skill categories}
```

**Tailoring rules (CRITICAL):**

1. **Summary:** Write fresh for every role. Mirror the JD's language. 3-4 sentences max.

2. **Experience bullets:**
   - Pull from `docs/career_master_context.md`, NOT from the base resume verbatim
   - Rewrite every bullet to emphasize what matters for THIS specific JD
   - Include metrics from the master context

3. **Experience selection:**
   - ALWAYS list in reverse chronological order — NEVER reorder
   - Most relevant role: 5-7 bullets
   - Moderately relevant: 3-4 bullets
   - Least relevant: 1-2 bullets

4. **Stack lines:** Only include technologies the candidate can discuss in an interview

5. **Skills section:** Mirror JD keywords naturally

6. **Keywords:** Incorporate terms from the JD's "Keywords to mirror" section

### Writing Rules (MANDATORY)

Follow ALL rules from CLAUDE.md:

- **NO em-dashes** as sentence connectors
- **NO banned words:** leverage, utilize, spearhead, delve, synergy, paradigm, multifaceted, holistic, robust, cutting-edge, seamlessly, game-changer, empower
- **NO "By doing X, achieved Y"** inversions
- **Short, direct sentences.** Subject-verb-object.
- **One idea per bullet.**

### Step 7: Review the Output

After writing the resume, immediately run:

```
/resume-review
```

Fix any critical issues.

### Step 8: Present Next Steps

```
Tailored resume saved to resumes/{slug}.md

Review the resume, then generate the .docx:
  npm run generate -- resumes/{slug}.md

If this role needs a cover letter:
  /cover-letter {slug}
```
