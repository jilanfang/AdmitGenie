# AGENTS.md

## Project Intent

AdmitGenie is an AI-native admissions coach for North America-focused 11th-grade families.

The MVP is explicitly:

- conversation-first, not form-first
- built around `Coach Inbox + Material Inbox + Weekly Brief`
- designed for progressive profile building instead of one-time intake completion
- optimized for a Vercel-first TypeScript stack

## Product Truths Learned So Far

- Do not drift back toward CollegeVine-style heavy structured onboarding.
- Structured profile state is still required, but it should stay behind the scenes.
- New material must visibly affect either profile understanding, weekly guidance, or both.
- The MVP user is still an individual front-end user, usually student plus parent, even if counselor-facing paths may exist later.

## Current Demo Architecture

- `components/coach-shell.tsx`
  - primary demo UI
  - fetches state from API routes, not local hardcoded state
- `lib/domain/demo-state.ts`
  - lightweight domain state and demo patch behavior
- `lib/domain/personas.ts`
  - reusable persona fixtures
  - default seeded scenario is `strategic-stem-striver`
- `lib/server/persistence.ts`
  - shared persistence boundary
  - supports `memory` mode and `drizzle` mode
- `app/api/demo/*`
  - demo state, conversation, materials, and persona switching routes

## Important Implementation Lessons

- Keep `CoachSnapshot` and `DemoState` conceptually separate.
  - `CoachSnapshot` is the read model returned to UI and API consumers.
  - `DemoState` is the lean domain shape used by demo behavior helpers.
- Do not silently mix read-model entities into domain helpers.
- In `drizzle` mode, return hydrated snapshot data directly instead of wrapping it again with default snapshot values.
- Persona switching is a demo operator capability for `memory` mode.
  - It should not pretend to work in durable `drizzle` mode unless true persistence for scenario changes is implemented.

## Verified Demo Capabilities

- shared state across `/api/demo/state`, `/api/demo/conversation`, and `/api/demo/materials`
- household and student profile entities visible in the UI
- persona fixture system with multiple North America family archetypes
- demo persona switcher in memory mode
- visible weekly brief refresh after material updates

## Testing Expectations

- Before closing work in this repo, run:
  - `pnpm test`
  - `pnpm build`
- Keep API tests and component tests aligned whenever state shape changes.

## Build / Tooling Notes

- Production build should use `next build --webpack`.
- This is intentional.
- Turbopack previously failed in this environment because of process / port restrictions.

## Persona Notes

- Current seeded persona: `Strategic STEM Striver`
- Additional personas exist for:
  - first-gen ambition builder
  - story-rich humanities builder
  - balanced pre-med planner
  - trajectory rebounder
- If future work changes onboarding, brief tone, or demo flow, check whether it should become persona-aware instead of globally hardcoded.

## Next Likely Priorities

- turn `Upload file` / `Paste update` from placeholders into a real MVP input flow
- connect material submission UX to the existing material route shape
- keep demo scenario switching stable while adding richer inbox behavior
