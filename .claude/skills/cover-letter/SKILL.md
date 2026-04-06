---
name: cover-letter
description: Generate a tailored cover letter for a specific job description. Takes a JD slug, reads the matching resume and career context, and produces a cover letter markdown file. Use when the user says "cover letter", "write a cover letter for", or after /tailor when a role requires one.
---

# Cover Letter Skill

Generate a tailored cover letter markdown file for a specific role.

## Prerequisites

- `docs/career_master_context.md` must be populated (run `/onboard` if not)
- `resumes/{slug}.md` must exist (run `/tailor {slug}` first)

## Inputs

The user provides one of:
- A JD slug (e.g., `tangible-pm`)
- A JD file path (e.g., `job-descriptions/tangible-pm.md`)

## Steps

### Step 1: Load Context Files

Read all three files:
1. `job-descriptions/{slug}.md` — the JD
2. `resumes/{slug}.md` — the tailored resume (DON'T repeat these)
3. `docs/career_master_context.md` — full career context

If `resumes/{slug}.md` doesn't exist, tell the user to run `/tailor {slug}` first.

### Step 2: Analyze the Role

From the JD, extract:
- What does this company actually do?
- What's the core problem they need this person to solve?
- Company stage/size/vibe?

From the resume, note what's already covered (DON'T repeat).

### Step 3: Design the Letter

Structure:
1. **Opening (2-3 sentences):** Hook + intent. Reference something specific about the company.
2. **Body paragraph 1 (3-4 sentences):** Core fit. Strongest experience. Anchor with a metric.
3. **Body paragraph 2 (2-3 sentences):** Why THIS company specifically. Something real, not generic.
4. **Closing (1-2 sentences):** Specific CTA. Express availability.

### Step 4: Write the Cover Letter

Read contact info from `docs/career_master_context.md` Section 1.

Write to `cover-letters/{slug}.md`:

```markdown
# Cover Letter — {Company} | {Role}

**Name:** {name from career context}
**Email:** {email}
**LinkedIn:** [{display}]({url})
**Phone:** {phone}
**Location:** {location}
**Company:** {Company}
**Role:** {Role}
**Date:** {current date}
**Recipient:** {Hiring Manager name if visible, otherwise "Hiring Team"}

---

Dear {Recipient},

{Opening paragraph}

{Body paragraph 1}

{Body paragraph 2}

{Closing paragraph}

Best regards,
{Name}
```

### Writing Rules (MANDATORY)

- **NO em-dashes** as sentence connectors
- **NO banned words:** leverage, utilize, spearhead, delve, synergy, paradigm, holistic, cutting-edge, seamlessly, empower, passionate about, excited to apply
- **NO cliches:** "dynamic team", "fast-paced environment", "results-driven"
- Short sentences. First person, active voice.

### Step 5: Review

```
/cover-letter-review
```

Fix critical issues before proceeding.

### Step 6: Present Next Steps

```
Cover letter saved to cover-letters/{slug}.md

Generate the .docx:
  npm run generate:cover -- cover-letters/{slug}.md
```
