---
name: setup-browser
description: Set up agent-browser for LinkedIn job scraping. Guides through installation, headed LinkedIn login, and headless verification. Use when the user says "setup browser", "setup linkedin", "setup scraping", or wants to scrape LinkedIn job postings.
---

# Browser Setup Skill

agent-browser is required for LinkedIn job scraping (`/linkedin-scrape`) and general web scraping (`/jd-scrape`).

## Steps

### Step 1: Check if agent-browser is installed

```bash
which agent-browser
```

If not found:
> "Install agent-browser: `npm install -g @anthropic/agent-browser`"

### Step 2: First-time LinkedIn login (headed mode)

LinkedIn requires manual login the first time to handle CAPTCHAs and 2FA.

Tell the user:
> "I'm going to open a visible browser window. You'll need to:"
> 1. Log into LinkedIn manually
> 2. Complete any verification/CAPTCHA challenges
> 3. Once you see your LinkedIn feed, come back here and tell me

```bash
agent-browser --headed --profile .browser-profile open "https://www.linkedin.com/login"
```

Wait for the user to confirm they've logged in.

### Step 3: Verify login persisted

```bash
agent-browser --profile .browser-profile open "https://www.linkedin.com/feed"
agent-browser wait --load networkidle
agent-browser get-text
```

**If feed content appears:** "LinkedIn login is saved. Headless scraping is ready."

**If login wall appears:**
> "The session didn't persist. Delete `.browser-profile` and try again."

### Step 4: Test with a real job posting

```bash
agent-browser --profile .browser-profile open "https://www.linkedin.com/jobs"
agent-browser wait --load networkidle
agent-browser get-text
```

If job content appears, setup is complete.

Tell the user:
> "Browser setup complete. You can now use `/linkedin-scrape <url>` and `/jd-scrape <url>`."
> "LinkedIn sessions expire after a few weeks. Run `/setup-browser` again if scraping starts failing."
