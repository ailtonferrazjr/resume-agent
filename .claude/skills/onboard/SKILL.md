---
name: onboard
description: First-time setup. Interviews the user deeply to build their career master context file, candidate profile, and base resumes. Use when docs/career_master_context.md is empty or has only template headers, or when the user says "onboard", "set up", "get started", "build my profile".
---

# Onboarding Skill

Build a new user's career profile from scratch (or from existing materials). This creates the foundation for all resume and cover letter generation.

## When to use

- First time a user runs the system
- `docs/career_master_context.md` is empty or contains only template headers
- `docs/candidate-profile.json` doesn't exist
- User explicitly asks to onboard or set up their profile

## Phase 1: Source Material Check

Ask the user (use AskUserQuestion):

> "Welcome to Resume Agent. I need to build your career profile. This will take 15-30 minutes but produces much better results than a generic resume. Do you have any of the following?"
>
> 1. An existing resume (PDF, DOCX, or paste the text)
> 2. A LinkedIn profile URL (I can scrape it with agent-browser)
> 3. Neither — let's build from scratch

**If resume provided:**
- Read the file (PDF, DOCX, or pasted text)
- Extract all structured data: companies, roles, dates, bullets, skills, education
- Present a summary: "I found X roles at Y companies. I'll now ask deeper questions about each one to build a richer profile."
- Proceed to Phase 2 — but skip questions where the resume already provides strong answers

**If LinkedIn URL provided:**
- First check if agent-browser is installed:
  ```bash
  which agent-browser
  ```
- If NOT installed, tell the user:
  > "agent-browser is needed for LinkedIn scraping. Install it with: `npm install -g agent-browser`"
  > "After installing, you'll also need to log into LinkedIn once. Run `/setup-browser` for the full setup."
  > "In the meantime, you can paste your resume text directly, or we can build from scratch."
- If installed, check if LinkedIn session exists:
  ```bash
  agent-browser --profile .browser-profile open "<linkedin_url>"
  agent-browser wait --load networkidle
  agent-browser get-text
  ```
- If login wall appears, tell the user to run `/setup-browser` first to authenticate with LinkedIn
- Extract career data from the profile text
- Proceed to Phase 2 with extracted data as a starting point

**If from scratch:**
- Go directly to Phase 2

## Phase 2: Deep Interview

This is the core of onboarding. Use AskUserQuestion for EVERY question. Wait for the answer before proceeding to the next question. Do NOT rush through this — the quality of the career context file depends entirely on the depth of these answers.

### Personal Information (ask once)

1. "What's your full name?"
2. "What's your email address?"
3. "Phone number? (optional, used on resumes)"
4. "Where are you located? (city, country)"
5. "Do you have a LinkedIn profile URL?"
6. "Are you authorized to work in your country? Any visa/work authorization notes worth mentioning?"
7. "What languages do you speak, and at what level?"
8. "Is remote work required, preferred, or flexible for you?"

### Target Roles

9. "What kind of roles are you targeting? Give me 2-3 job titles that describe your ideal next position."
10. "Are there specific industries or company stages you prefer? (startup, growth, enterprise, specific sectors)"

### Work Experience (repeat for each role, starting from most recent)

11. "Let's go through your work history, starting with your current or most recent role. What company are you at (or were you at most recently)?"

**For each company/role, ask these questions sequentially:**

a. "What does/did {company} do? Give me a one-sentence description."
b. "What was the company stage when you were there? (early startup, growth, enterprise, etc.) Roughly how many employees?"
c. "What was your exact job title? What team or department?"
d. "What dates did you work there? (month/year to month/year)"
e. "Where was this based? (city, remote, etc.)"
f. "Forget the job description for a moment — what did you actually DO day-to-day? What was your real scope?"
g. "What did you build, ship, or create that you're proud of? I want specifics — systems, products, processes, tools. Name them."
h. "Do you have any numbers? Revenue generated, costs saved, efficiency gains, team size managed, users served, transactions processed, anything quantified. Even rough estimates are valuable."
i. "What was your tech stack or key tools? (programming languages, frameworks, platforms, business tools)"
j. "Why did you leave? (This stays private — it helps me frame things correctly and avoid landmines. I'll never put departure reasons in your resume.)"

After finishing a role, ask:
k. "Do you have another role to add? (previous job, or a different role at the same company)"

If yes, repeat the questions for the next role.

### Education

After all work experience:
12. "What's your educational background? Degrees, institutions, dates. Include incomplete degrees too — I need to know what to include or omit."
13. "Any certifications, courses, or programs worth mentioning?"

### Skills & Extras

14. "Any technical skills or tools I haven't captured from your work history?"
15. "Do you do any mentoring, speaking, open source, community work, or side projects worth mentioning?"

### Sensitive Context

16. "Last question — anything sensitive I should know? Companies that went bankrupt, gaps in employment, political departures, incomplete degrees, anything that needs careful framing? This information stays in the context file marked as 'do not include in outputs' — it helps me frame things correctly without putting you at risk."

## Phase 3: Generate Career Master Context

From all the interview data, generate `docs/career_master_context.md` following this structure:

```markdown
# {Full Name} — Career Master Context File

> **Purpose:** Single source of truth for generating tailored resumes, cover letters, and positioning materials.

---

## 1. Personal Information

| Field | Detail |
|---|---|
| **Full Name** | {name} |
| **Email** | {email} |
| **Phone** | {phone} |
| **Location** | {location} |
| **LinkedIn** | {linkedin} |
| **Work Authorization** | {authorization} |
| **Languages** | {languages} |
| **Remote Preference** | {preference} |

---

## 2. Professional Positioning

### One-Liner
{A single sentence capturing who they are and their unique value proposition}

### Core Narrative
{2-3 sentences describing the career arc and what makes this person distinctive}

### Key Differentiators
- {differentiator 1}
- {differentiator 2}
- {differentiator 3}

### Target Roles
- **Primary:** {primary targets}
- **Secondary:** {secondary targets}
- **Requirements:** {must-haves like remote, location, etc.}

---

## 3. Professional Experience

### 3.1 {Company} — {Role}
**{Location} | {Date Range}**

#### Company Context
{What the company does, stage, size}

#### Role & Scope
{What they actually did, their responsibilities and ownership}

#### Tech Stack / Tools
| Category | Technologies |
|---|---|
| **{category}** | {tools} |

#### Key Achievements & Metrics
| Metric | Value |
|---|---|
| **{metric}** | {value} |

#### What to Emphasize
{What to highlight when tailoring resumes for this role}

#### Sensitive Context (do not include in outputs)
{Departure reasons, company issues, anything to be careful about}

---

{Repeat for each role}

## 4. Education

### {Degree} — {Institution}
**{Date Range}**
{Notes, exchange programs, incomplete status if relevant}

---

## 5. Technical Skills Inventory

| Category | Technologies |
|---|---|
| **{category}** | {skills} |

---

## 6. Metrics Quick Reference

| Metric | Context |
|---|---|
| {strongest number} | {where and what it means} |

---

## 7. Resume Framing Guidelines

### Strongest Narrative Threads (by target role type)

**For {role type 1} roles:**
- {what to emphasize}

**For {role type 2} roles:**
- {what to emphasize}
```

Write this file using the Write tool to `docs/career_master_context.md`.

## Phase 4: Generate Candidate Profile

Generate `docs/candidate-profile.json` with the structured scoring data:

```json
{
  "skills": {
    "engineering": ["skill1", "skill2"],
    "operations": ["skill1", "skill2"],
    "product": ["skill1", "skill2"],
    "general": ["skill1", "skill2"]
  },
  "titles": ["Title 1", "Title 2"],
  "location": {
    "city": "City",
    "country": "Country",
    "region": "Region",
    "remote": true
  },
  "yearsExperience": {
    "engineering": 0,
    "operations": 0,
    "sales": 0,
    "total": 0
  },
  "strongestRoleTypes": ["engineering", "hybrid", "product", "biz-ops"]
}
```

**How to populate:**
- `skills.engineering`: Programming languages, frameworks, databases, cloud services, testing tools from their tech stacks
- `skills.operations`: Business ops tools, CRMs, analytics, process design keywords
- `skills.product`: Product management keywords, frameworks, methodologies
- `skills.general`: Cross-cutting skills (automation, B2B, SaaS, startup, etc.)
- `titles`: Their actual job titles from work history
- `location`: From personal info
- `yearsExperience`: Calculate from date ranges. Engineering = time in engineering roles. Operations = time in ops roles. Sales = time in sales roles. Total = overall career length.
- `strongestRoleTypes`: Ordered by strength based on their experience depth

## Phase 5: Generate Base Resumes

Based on which role types are relevant to the user's targets, generate 1-3 base resume files:

- If targeting engineering roles -> `resumes/engineering.md`
- If targeting product roles -> `resumes/product-manager.md`
- If targeting ops roles -> `resumes/biz-ops.md`
- If targeting hybrid -> pick the closest 1-2

**Resume format MUST match this exactly** (the parser depends on it):

```markdown
# {Full Name}

**Email:** {email} | **LinkedIn:** [{display text}]({url})
**Phone:** {phone} | **Location:** {location}

---

## SUMMARY

{2-4 sentence summary tailored to this role type}

---

## PROFESSIONAL EXPERIENCE

### {Company} — {Role}
**{Location} | {Date Range}**

- {Bullet point — outcome-focused, metric where possible}
- {Bullet point}

**Stack:** {comma-separated technologies, only if relevant}

### {Next company} — {Role}
...

---

## EDUCATION

**{Degree} | {Institution} | {Date Range}**
- {Sub-bullet if relevant, e.g., exchange program}

---

## SKILLS

**{Category}:** {comma-separated skills}
**Languages:** {languages without proficiency levels}
```

**Resume writing rules:**
- List experience in reverse chronological order (most recent first) — NEVER reorder by relevance
- Most relevant role: 5-7 bullets; moderately relevant: 3-4; least relevant: 1-2
- NO em-dashes as sentence connectors (commas, periods, semicolons instead)
- NO banned words: leverage, utilize, spearhead, delve, synergy, paradigm, multifaceted, holistic, robust, cutting-edge, seamlessly, game-changer, empower
- Short, direct sentences. One idea per bullet.
- Every bullet must pass the "so what?" test
- Include metrics where available — use the strongest credible framing

## Phase 6: Confirmation

Present a summary to the user:

> "Your career profile is ready. Here's what I created:
>
> - `docs/career_master_context.md` — {word count} words across {number} roles
> - `docs/candidate-profile.json` — scoring profile ({number} skills mapped)
> - `resumes/{type}.md` — base resume(s)
>
> **Next steps:**
> - Paste a job description and I'll `/intake` it
> - Or give me a URL: `/jd-scrape <url>` or `/linkedin-scrape <url>`
> - Then run `/tailor <slug>` to generate a tailored resume
>
> **Optional setup:**
> - `/setup-db` — Enable application tracking (requires Postgres)
> - `/setup-gcloud` — Enable Google Drive upload for .docx files
> - `/setup-browser` — Enable LinkedIn scraping"
