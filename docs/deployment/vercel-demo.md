# Vercel External POC Deployment

## Goal

Deploy a stable AdmitGenie closed pilot POC to Vercel for a small set of invited families and counselors.

## Requirements

External POC deployment requires:

- Vercel project
- Neon Postgres database
- `DATABASE_URL` configured in Vercel
- `OPENAI_API_KEY` configured in Vercel
- pilot invite tokens configured in Vercel
- optional Blob token if you want file references later

Without `DATABASE_URL`, the app runs in memory mode and is not suitable for external pilot traffic.

## Recommended Stack

- App: Vercel
- Database: Neon Postgres
- ORM: Drizzle

Supabase is not required for the current codebase. No extra backend service is required for this POC.

## Environment Variables

Set in Vercel:

```bash
DATABASE_URL=postgresql://username:password@hostname:5432/admitgenie
OPENAI_API_KEY=sk-...
OPENAI_ROUTING_ENABLED=true
OPENAI_CLASSIFIER_MODEL=gpt-4o-mini
OPENAI_RESPONSE_MODEL=gpt-4o
PILOT_FAMILY_INVITE_TOKEN=your-family-pilot-token
PILOT_COUNSELOR_INVITE_TOKEN=your-counselor-pilot-token
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_token_optional
PILOT_BASE_URL=https://your-project.vercel.app
```

Useful local helpers:

```bash
pnpm poc:generate-invites
pnpm poc:check-env
pnpm poc:smoke
```

## Deploy Steps

1. Create a Neon database.
2. Copy the connection string into Vercel as `DATABASE_URL`.
3. Add the OpenAI and invite-token environment variables.
4. From the repo, run:

```bash
pnpm install
pnpm db:push
pnpm test
pnpm build
pnpm test:routing-report
pnpm poc:check-env
```

5. Deploy the project to Vercel.
6. Set `PILOT_BASE_URL=https://your-app.vercel.app` locally and run `pnpm poc:smoke`.
7. Open a pilot invite link such as `https://your-app.vercel.app/?invite=<token>`.

## Smoke Check

After deploy, verify these routes:

- `/api/session/access`
  - should accept a valid invite token
  - should set the pilot session cookie
- `/api/case/state`
  - should return `ok: true`
  - should include `state`, `capabilities`, and `readiness`
- `/api/case/readiness`
  - should return `persistenceKind: "drizzle"`
  - should return `durableMode: true`
- `/api/case/materials`
  - should accept a valid draft payload and return updated state
- `/api/case/conversation`
  - should accept a valid message and return updated state plus routing metadata

## Current Expected UI Behavior

- The home page requires a pilot invite before rendering the coach shell.
- Users should see no `demo`, `persona`, `workspace`, or `sample` controls.
- The main UI should stay `chat-first + compact case rail + sticky composer`.
- Brief explanation stays in the chat flow, with optional expansion.
- Shortlist confirmation and score conflict resolution still happen through chat cards.

## Current Scope Boundaries

This deployment is a usable pilot POC, not the full production system.

What is ready:

- invite-based case access
- case-scoped persistence
- guided conversation updates
- material submission with visible outcomes
- policy-gated routing with deterministic fallback
- durable persistence when `DATABASE_URL` is present

What still comes later:

- full auth platform
- OCR / complex file parsing
- multi-case counselor workspace
- production-grade storage and source workspace
