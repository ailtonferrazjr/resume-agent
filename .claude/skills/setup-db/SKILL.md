---
name: setup-db
description: Upgrade from local JSON tracker to Postgres for application tracking. Use when the user says "setup database", "setup tracker", "setup db", "upgrade tracker", or wants a cloud-backed database.
---

# Database Setup Skill

By default, the application tracker stores data in a local JSON file (`docs/tracker.json`). This works out of the box with zero configuration.

This skill upgrades the tracker to Postgres, which is useful if:
- You want to access your data from multiple machines
- You're tracking many applications and want query performance
- You want a cloud-backed store

## Steps

### Step 1: Check current state

Check if Postgres is already configured:

```bash
grep DATABASE_URL .env 2>/dev/null
```

If it exists and has a value, verify it works:

```bash
npm run tracker -- list
```

If that works, tell the user: "Postgres is already configured and working."

If not configured, check how many applications are tracked locally:

```bash
cat docs/tracker.json 2>/dev/null | head -5
```

If there are existing entries, note them — we'll mention migration at the end.

### Step 2: Choose a provider

Ask the user (use AskUserQuestion):

> "Which Postgres provider do you want to use?"
> 1. Supabase (free tier, cloud-hosted) — Recommended
> 2. Neon (free tier, cloud-hosted)
> 3. Local Postgres (you manage it)
> 4. Keep using local JSON — no upgrade needed

If they choose option 4, tell them:
> "No problem. The local tracker at `docs/tracker.json` works great. You can always run `/setup-db` later if you change your mind."

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

Create or update `.env` with the connection string:

```bash
touch .env
```

Use the Edit tool to add:

```
DATABASE_URL=postgresql://...
```

### Step 4: Run migrations

```bash
npx drizzle-kit push
```

This creates the `applications` table in Postgres.

### Step 5: Migrate existing data (if any)

If `docs/tracker.json` has existing entries, offer to migrate them:

> "You have existing applications tracked locally. Want me to migrate them to Postgres?"

If yes, read `docs/tracker.json`, iterate through entries, and insert each one using `npm run tracker -- add` or direct DB operations.

### Step 6: Verify

```bash
npm run tracker -- list
```

Should show all applications (migrated ones + any new). No errors means Postgres is active.

Tell the user:
> "Postgres is set up. All tracker operations now use the database instead of the local JSON file."
> "Your local `docs/tracker.json` is still there as a backup. You can delete it once you've confirmed everything migrated correctly."
