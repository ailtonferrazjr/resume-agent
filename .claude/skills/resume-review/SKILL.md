---
name: resume-review
description: Review resume markdown files for AI writing patterns, content relevance per role type, and metrics framing. Run after writing or editing any resume content to catch em-dashes, banned words, irrelevant stack items, and weak metrics. Use when asked to "review resume", "check resume", or after any resume content changes.
---

# Resume Review Skill

Review a resume markdown file against the project's writing standards and role-specific relevance criteria.

## Inputs

The user should specify:
- Which resume file(s) to review (or "all" for all three)
- The target role type is inferred from the filename (engineering, product-manager, biz-ops)

## Review Steps

### Step 1: AI Writing Pattern Scan

Scan the resume file for patterns that reveal AI-generated content.

**Check for em-dashes (--) used as sentence connectors:**
- Search for ` — ` (space-em-dash-space) in bullet points, summary, and any prose text
- IGNORE em-dashes in "Company — Role" title lines (these are part of the template format)
- For each violation, suggest a specific rewrite using commas, periods, semicolons, or restructured sentences

**Check for banned words/phrases:**
- leverage, utilize, spearhead, delve, tapestry, multifaceted, synergy, paradigm, holistic, robust (non-technical), cutting-edge, state-of-the-art, seamlessly, game-changer, empower
- Also flag: "By doing X, achieved Y" inversions, "This resulted in...", excessive present participles as connectors ("...enabling, driving, fostering")

**Check for generic filler:**
- "various", "multiple" (be specific: say "8 partners" not "multiple partners")
- "helped to", "was responsible for" (use direct verbs)
- "in order to" (just "to")

**Output:** List every violation with line number, the offending text, and a suggested fix.

### Step 2: Content Relevance Review

Based on the target role type, check that every bullet and section earns its place.

**For engineering resumes (`engineering.md`):**
- Stack lines: include all technologies the candidate used hands-on and can discuss technically
- Bullets should emphasize architecture decisions, systems built, technical tradeoffs
- OK to go deep on implementation details
- Flag any bullets that sound like PM work (e.g., "managed stakeholders") without technical substance

**For product manager resumes (`product-manager.md`):**
- Stack lines: trim to only technologies that demonstrate technical fluency (no need for every library)
- Bullets should emphasize ownership, discovery, cross-functional impact, business outcomes
- Flag overly technical bullets that don't connect to product/business outcomes
- Flag missing "so what?" on any bullet (impact should be clear)

**For biz-ops resumes (`biz-ops.md`):**
- Stack lines: only include if they demonstrate automation/systems thinking ability
- Bullets should emphasize process design, team management, operational scale, efficiency gains
- Flag engineering-heavy language that would confuse a non-technical hiring manager

**Output:** For each item flagged, explain why it doesn't fit and suggest how to reframe or remove it.

### Step 3: Metrics Framing Review

Check that metrics are framed in the strongest defensible way.

- Prefer gross/GMV figures over net revenue when available
- Check that every metric has context (not just "35%" but "35% of all leads")
- Flag any metric that seems inflated or wouldn't survive a technical interview
- Suggest stronger framing where possible (e.g., total transaction volume instead of take-rate revenue)
- Verify metrics match `docs/career_master_context.md` (the source of truth)

**Output:** List each metric with current framing and suggested improvement (if any).

### Step 4: Summary Report

Produce a summary with:
1. **Critical fixes** (must change before sending): AI tells, factual errors
2. **Recommended changes** (should change): relevance issues, weak framing
3. **Optional improvements** (nice to have): minor wording tweaks

## Example Output Format

```
## Resume Review: engineering.md

### AI Writing Patterns (3 found)
1. Line 10: "...transitioned into engineering — bringing deep business empathy"
   → Fix: "...transitioned into engineering, bringing deep business empathy"
2. Line 21: "...doubt resolution via knowledge base + RAG, and funnel reengagement — qualifying 35%"
   → Fix: "...funnel reengagement. Qualifies 35% of all leads in under 3 minutes, 24/7."
3. ...

### Content Relevance (1 flag)
1. Line 28: Stack line includes "AssemblyAI, Google Cloud (Address Validation, Static Maps)"
   → These are niche and don't strengthen an engineering resume. Consider trimming to core stack.

### Metrics (1 suggestion)
1. Line 26: "144k+ EUR revenue" — this is net (8% take rate). Use "2M+ EUR in solar installation pipeline" for stronger framing.

### Summary
- Critical: 3 em-dash fixes
- Recommended: 1 stack trim, 1 metric reframe
- Optional: none
```
