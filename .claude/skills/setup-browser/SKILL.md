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

If not found, install it:

```bash
npm install -g agent-browser
```

Verify it installed:

```bash
agent-browser --version
```

If the install fails (permissions), suggest:
> "Try with sudo: `sudo npm install -g agent-browser`"
> "Or if using nvm, make sure you're on the right Node version first."

### Step 2: Check for existing LinkedIn session

If `.browser-profile` directory exists, test if the session is still valid:

```bash
ls .browser-profile 2>/dev/null && echo "profile exists" || echo "no profile"
```

If profile exists, test it:

```bash
agent-browser --profile .browser-profile open "https://www.linkedin.com/feed"
agent-browser wait --load networkidle
agent-browser get-text
```

Check if the output contains feed content (posts, names) vs a login wall.

**If feed content appears:** "LinkedIn session is still valid. You're all set."
Skip to Step 4.

**If login wall or no profile:** Continue to Step 3.

### Step 3: LinkedIn login (headed mode)

LinkedIn requires manual login to handle CAPTCHAs and 2FA. This must be done in a visible browser window.

Tell the user:
> "I'm going to open a browser window. You'll need to:"
> 1. Log into LinkedIn with your credentials
> 2. Complete any CAPTCHA or 2FA challenges
> 3. Wait until you see your LinkedIn feed
> 4. Then come back here and tell me you're done
>
> **Important:** Don't close the browser window — I'll close it after verifying.

```bash
agent-browser --headed --profile .browser-profile open "https://www.linkedin.com/login"
```

Wait for the user to confirm they've logged in. Then verify the session saved:

```bash
agent-browser --profile .browser-profile open "https://www.linkedin.com/feed"
agent-browser wait --load networkidle
agent-browser get-text
```

**If feed content appears:** "Login saved successfully."

**If login wall appears:**
> "The session didn't persist. This sometimes happens with LinkedIn's security."
> "Let's try again — I'll delete the old profile and start fresh:"
```bash
rm -rf .browser-profile
```
> "Run `/setup-browser` again to retry."

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
