# Stack Decision

> Archived document.
> This file contains early stack assumptions and no longer fully matches the current dependencies in `package.json`.
> For the current code reality, use `../../../package.json`, `../../tech/system-architecture.md`, and `../../deployment/vercel-demo.md`.

## Decision Summary

AdmitGenie MVP uses a Vercel-first TypeScript stack.

## Chosen Stack

- App framework: `Next.js`
- Language: `TypeScript`
- Styling: `Tailwind CSS`
- Auth: `Auth.js`
- ORM: `Drizzle ORM`
- Database: `Neon Postgres`
- File storage: `Vercel Blob`
- configuration and flags: `Edge Config`
- scheduled jobs: `Vercel Cron`
- AI application layer: `Vercel AI SDK`

## Why This Stack

### 1. MVP Needs A Single Deployable Surface

The product needs to be easy to demo and easy to iterate on.

Using Next.js as the primary application surface means:

- front-end and API logic stay together
- preview deployments are easy
- auth, streaming, uploads, and UI iteration stay in one stack

### 2. The Product Is Application-Led, Not Infrastructure-Led

The MVP is mostly:

- guided conversation
- profile state management
- material ingestion
- brief generation

This does not justify a heavier polyglot stack yet.

### 3. Vercel Ecosystem Reduces Setup Drag

Using Vercel-native or Vercel-friendly services supports:

- fast demos
- easier founder iteration
- fewer moving parts early

## Explicit Non-Choices

### Not FastAPI As The Main API Layer

Reason:

- adds a second runtime and deployment surface
- slows MVP iteration
- less aligned with Vercel-first deployment

### Not Celery + Redis As The Default Async Layer

Reason:

- too much operational weight for the current phase
- Vercel Cron plus lightweight orchestration is enough for MVP

### Not A Heavy Agent Framework As The Core

Reason:

- the MVP needs controllable workflows more than open-ended agent autonomy
- explicit orchestration is easier to debug and document early

## Deferred / Optional Additions

### Likely Next Layer

- `Inngest` for stronger workflow orchestration
- `Langfuse` for LLM observability
- `PostHog` for analytics and product instrumentation

### Future External Worker Layer

- `Scrapling` as a likely Python crawler candidate
- optional OCR or parsing workers
- browser-driven crawling fallback

These are intentionally outside the MVP core.

## Data Source Strategy

### MVP

- curated school data
- mock or curated change events
- selected public APIs where useful

### Deferred

- live school website crawling
- complex OCR and PDF parsing
- durable external worker pipelines

## Public API Notes

These are candidates for MVP or near-MVP use:

- College Scorecard API
- OpenAlex
- Crossref
- Resend

These should be integrated behind adapters, not directly inside product logic.

## Architecture Outcome

The stack supports:

- AI-native onboarding
- material inbox
- explainable profile state
- monthly brief generation

without requiring a heavy service topology on day one.
