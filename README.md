# AdmitGenie Closed Pilot POC

AdmitGenie is a chat-first admissions coach for North America-focused families and counselors. This repo now targets an external `closed pilot POC`, not an internal shared demo.

## Product shape

- Single active case per session
- Invite-only access, no public signup
- English-only customer experience
- Chat-first shell with chat cards for confirmation
- Deterministic state engine with OpenAI-first routing layered on top

## What is included

- `app/`
  Next.js App Router UI and API routes for `case` and `session` flows.
- `components/coach-shell.tsx`
  External POC shell with the main chat stream, compact case rail, sticky composer, and lightweight attachment flow.
- `lib/server/`
  Persistence adapter, pilot invite/session access, routing policy, and POC ops helpers.
- `docs/`
  Product source docs, customer corpus, deployment notes, and journey coverage artifacts.
- `tests/`
  Domain, API, routing, and UI regressions including journey-report generation.

## Run locally

```bash
pnpm install
pnpm test
pnpm build
pnpm dev -- --port 3101
```

Open [http://localhost:3101](http://localhost:3101).

Default local pilot invites:

- Family: `admitgenie-family-pilot`
- Counselor: `admitgenie-counselor-pilot`

You can override them with env vars.

Helpful external POC commands:

```bash
pnpm poc:generate-invites
pnpm poc:check-env
pnpm poc:smoke
```

- `poc:generate-invites` prints secure family/counselor invite tokens
- `poc:check-env` validates the required Production env vars
- `poc:smoke` hits the deployed Vercel URL and verifies the main pilot flow

## API surface

Primary external POC routes:

- `POST /api/session/access`
- `POST /api/session/logout`
- `GET /api/case/state`
- `POST /api/case/conversation`
- `POST /api/case/materials`
- `GET /api/case/readiness`

Legacy `/api/demo/*` routes remain only as an internal compatibility layer for regression flows.

## Deployment

The recommended deployment target is Vercel + Neon, with durable case persistence enabled by `DATABASE_URL`.

Before shipping a pilot build:

```bash
pnpm test
pnpm build
pnpm test:routing-report
pnpm poc:check-env
```

Then verify:

- invite entry works
- case state persists across reloads
- material upload outcomes stay visible in chat
- shortlist/conflict decisions still use chat cards

See [docs/deployment/vercel-demo.md](./docs/deployment/vercel-demo.md).

## Notes

- The production build intentionally uses `next build --webpack`.
- Without `DATABASE_URL`, the app falls back to memory mode for local iteration only.
- OpenAI routing is feature-flagged and always falls back to deterministic policy-safe behavior if classification or response generation fails.
