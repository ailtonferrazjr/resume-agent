---
name: setup-db
description: Set up the optional Postgres database for application tracking. Guides through Supabase, Neon, or local Postgres setup. Use when the user says "setup database", "setup tracker", "setup db", or wants to track applications.
---

# Database Setup Skill

The application tracker is optional. Everything else (resume generation, scoring, tailoring) works without a database. This skill helps set up Postgres if the user wants to track their applications.

## Steps

### Step 1: Check current state

Check if DATABASE_URL is already configured:

```bash
grep DATABASE_URL .env 2>/dev/null
```

If it exists and has a value, verify it works:

```bash
npm run tracker -- list
```

If that works, tell the user: "Database is already configured and working."

### Step 2: Choose a provider

Ask the user (use AskUserQuestion):

> "Which Postgres provider do you want to use?"
> 1. Supabase (free tier, cloud-hosted) — Recommended
> 2. Neon (free tier, cloud-hosted)
> 3. Local Postgres (you manage it)
> 4. Skip — I don't need application tracking

**For Supabase:**
1. "Go to https://supabase.com and create a free project"
2. "Once created, go to Settings > Database > Connection string > URI"
3. "Copy the connection string (it starts with `postgresql://`)"
4. "Important: Use the connection pooler URL (port 6543), not the direct connection"

**For Neon:**
1. "Go to https://neon.tech and create a free project"
2. "Copy the connection string from the dashboard"

**For Local Postgres:**
1. "Make sure Postgres is running locally"
2. "Create a database: `createdb resume_agent`"
3. "Your connection string is: `postgresql://localhost:5432/resume_agent`"

### Step 3: Configure .env

Tell the user to add the connection string to `.env`:

```
DATABASE_URL=postgresql://...
```

Or offer to do it for them (use the Edit tool on .env).

### Step 4: Run migrations

```bash
npx drizzle-kit push
```

This creates the `applications` table.

### Step 5: Verify

```bash
npm run tracker -- list
```

Should show "No entries found." (empty table, no errors).

Tell the user: "Database is configured. Application tracking is now active."
