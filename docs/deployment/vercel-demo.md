# Vercel Demo Deployment

## Goal

Deploy a stable AdmitGenie demo to Vercel that can be shared directly.

## Requirement

Stable shared demo deployment requires:

- Vercel project
- Neon Postgres database
- `DATABASE_URL` configured in Vercel
- `DEMO_ACCESS_CODE` configured in Vercel

Without `DATABASE_URL`, the app runs in memory mode and state is not durable across instances or restarts.

## Recommended Stack

- App: Vercel
- Database: Neon Postgres
- ORM: Drizzle

Supabase is not required for the current codebase.

## Environment Variables

Set in Vercel:

```bash
DATABASE_URL=postgresql://username:password@hostname:5432/admitgenie
DEMO_ACCESS_CODE=your-shared-demo-code
```

## Deploy Steps

1. Create a Neon database.
2. Copy the connection string into Vercel as `DATABASE_URL`.
3. From the repo, run:

```bash
pnpm install
pnpm db:push
pnpm test
pnpm build
```

4. Deploy the project to Vercel.

## Smoke Check

After deploy, verify these routes:

- `/api/demo/state`
  - should return `ok: true`
  - should include `state`, `capabilities`, `demoPersona`, and `deployment`
- `/api/demo/readiness`
  - should return `persistenceKind: "drizzle"`
  - should return `readyForSharedDemo: true`
- `/api/demo/materials`
  - should accept a valid draft payload and return updated state
- `/api/demo/access`
  - should accept the configured demo access code and set the access cookie

## Current Expected UI Behavior

- The home page requires the shared demo access code before rendering the coach shell.
- If deployment is still in memory mode, the page shows an `Ephemeral demo mode` warning.
- If `DATABASE_URL` is configured correctly, that warning should disappear.
- Each browser session keeps a workspace code in local storage so demo state stays isolated by workspace.
- Persona switching is available in memory demo mode only.
- Stable shared demo mode is focused on persistent state, not persona switching.

## Current Limitation

The current hosted demo is a stable product scaffold, not the final AI-native production system.

What is ready:

- coach inbox
- guided conversation updates
- material submission
- profile/patch/brief refresh
- durable persistence when `DATABASE_URL` is present

What still comes later:

- production LLM orchestration
- OCR / complex file parsing
- auth and multi-user isolation
- production storage pipeline
