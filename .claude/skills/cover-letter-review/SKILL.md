---
name: cover-letter-review
description: Review a cover letter markdown file for AI writing patterns, length, personalization, and story arc. Run after writing or editing any cover letter. Use when asked to "review cover letter", "check cover letter", or automatically after /cover-letter.
---

# Cover Letter Review Skill

Review a cover letter markdown file against quality standards. This is the gate between writing and generating the .docx.

## Inputs

The user specifies (or it's inferred from context):
- Which cover letter to review (`cover-letters/{slug}.md`)

If no file is specified, review the most recently modified file in `cover-letters/`.

## Review Steps

### Step 1: AI Writing Pattern Scan

Same banned patterns as resume-review — recruiters can spot AI text in a cover letter even faster than in a resume.

**Check for em-dashes used as connectors:**
- Flag ` — ` in body text (em-dash in "Cover Letter — Company | Role" title is fine)
- Suggest rewrites: commas, periods, or restructure

**Check for banned words/phrases:**
- `leverage`, `utilize`, `spearhead`, `delve`, `synergy`, `paradigm`, `holistic`, `cutting-edge`, `seamlessly`, `empower`
- `passionate about`, `excited to apply`, `thrilled`, `dynamic team`, `fast-paced environment`, `results-driven`, `self-starter`
- `I believe I would be a great fit` (show it, don't say it)
- `Please find attached`, `I am writing to express my interest` (robotic openers)
- `By doing X, achieved Y` inversions
- Present participles as connectors: "...enabling, driving, fostering"

**Check for generic filler:**
- "various", "multiple" without specifics
- "strong background in" (what does "strong" mean? Give a metric or example)
- "team player", "attention to detail", "hard worker"

**Output:** List every violation with the exact phrase, location in the letter, and a suggested rewrite.

### Step 2: Length Check

Count words in the body (excluding frontmatter and closing signature).

- **Under 200 words:** Too short — likely missing a paragraph or depth
- **200–400 words:** Good range
- **401–500 words:** Borderline — flag and suggest which paragraph to cut
- **Over 500 words:** Too long — recruiters won't read it. Must trim. Identify the weakest paragraph.

### Step 3: Personalization Check

A cover letter that could apply to any company is useless. Check:

- Does the letter name the company at least once in the body?
- Does it reference something specific about what the company does, their stage, or their problem?
- Does paragraph 2 ("why this company") contain a generic sentiment ("I admire your mission") or something real and specific?
- If contract role: does it address the format directly (or at least not pretend it's permanent)?
- If career pivot (e.g., PM applying for engineering role): does it address the transition?

Flag anything that sounds like it could be copy-pasted to a different company without changing a word.

### Step 4: Story Arc Check

A good cover letter follows a clear structure:

1. **Hook** — opens with something that earns attention, not "I am applying for..."
2. **Core fit** — strongest relevant experience with at least one metric
3. **Why them** — specific to this company, not generic enthusiasm
4. **CTA** — ends cleanly with an ask, not trailing off

Check each paragraph serves exactly one purpose. Flag:
- Paragraphs that duplicate what's on the resume (lists bullet points directly)
- Missing metric in the core fit paragraph
- Body paragraph 2 that's generic ("your mission excites me")
- Closing that just says "I look forward to hearing from you" with no specific angle

### Step 5: Repetition Check

Read the cover letter alongside `resumes/{slug}.md`.

Flag any sentence that:
- Directly quotes a resume bullet
- Repeats a metric without adding narrative context (metric alone belongs in the resume; the story behind it belongs in the letter)

### Step 6: Summary Report

Produce a summary with:
1. **Critical fixes** (must change before sending): AI tells, missing personalization, over 500 words
2. **Recommended changes** (should change): weak story arc, generic paragraph 2, missing metric
3. **Optional improvements** (nice to have): minor word choices, sentence rhythm

## Example Output Format

```
## Cover Letter Review: cover-letters/tangible-pm.md

Word count: 347 words ✓

### AI Writing Patterns (2 found)
1. Para 1: "...I am excited to apply for this role — bringing a strong background in..."
   → Fix: Remove "excited to apply". Remove em-dash. "...I'm applying because this maps closely to what I built at Huspy."
2. Para 2: "...results-driven approach..."
   → Fix: Cut entirely. Show it with specifics, don't label it.

### Personalization (1 flag)
1. Para 3: "I admire Tangible's mission to improve liquidity in private markets."
   → Too vague. What specifically about LP/GP secondary markets resonates? Why now? Add something specific.

### Story Arc ✓
- Hook: strong
- Core fit: strong (metric present)
- Why them: needs work (see personalization flag)
- CTA: good

### Repetition (1 flag)
1. Para 1: "...qualified 35% of inbound leads..." — this is verbatim from the resume bullet.
   → Reframe: what does that number MEAN? What changed for the business because of it?

### Summary
- Critical: 2 AI pattern fixes
- Recommended: 1 personalization rewrite, 1 metric reframe
- Optional: none
```
