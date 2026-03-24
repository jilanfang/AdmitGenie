# AGENTS.md

## Project Intent

AdmitGenie is an AI-native admissions coach for North America-focused 9th-11th grade families.

The MVP is explicitly:

- conversation-first, not form-first
- built around `Coach Inbox + Material Inbox + Monthly Brief`
- designed for progressive profile building instead of one-time intake completion
- optimized for a Vercel-first TypeScript stack

## Product Truths Learned So Far

- Do not drift back toward CollegeVine-style heavy structured onboarding.
- Structured profile state is still required, but it should stay behind the scenes.
- New material must visibly affect either profile understanding, monthly guidance, or both.
- The MVP is still a single-user front-end product, but the usage framing is joint student-plus-parent use, with the same core product also usable by individual counselors as a personal productivity tool.
- The strongest current loop is:
  `material -> visible analysis -> confirmation or resolution -> profile update -> brief update`.
- Chat should not only explain state. The coach must be able to change state through conversation when the user confirms or corrects something.
- After a shortlist is confirmed, the next move should be execution-oriented list strategy, not more generic intake.

## Persona And Journey Guardrail

- Keep the MVP anchored to a concrete persona plus user journey, not to generic admissions-tool breadth.
- Default MVP anchor:
  - primary persona: `Strategic STEM Striver`
  - secondary persona: `First-Gen Ambition Builder`
- Before changing product behavior, UI, or docs, explicitly check:
  - which persona this serves
  - which workflow step this improves
  - whether this closes a real MVP gap or causes scope drift
- Prefer shrinking gaps on the strongest existing persona journeys before expanding to more personas, broader infrastructure, or extra surfaces.
- If a change does not clearly improve a target persona journey, stop and re-scope before implementing.

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
- When state shape changes, keep domain, API, and component tests aligned in the same pass.
- Conversation tests should use stateful mocks, not static fetch payloads, or Slice 3 behavior will look broken even when domain logic is correct.
- `pendingPatch` is not just a display flag.
  - It must drive coach behavior.
  - It must be clearable through user chat turns.
- Material analysis and latest patch state should stay in sync after confirmation or conflict resolution.
  - Otherwise the UI keeps showing stale `needs_confirmation` or `conflict` messaging after the user already fixed it.
- Bucket-style school-list parsing should be done conservatively.
  - Multi-sentence user input can otherwise over-capture school names and produce misleading structured state.

## Verified Demo Capabilities

- shared state across `/api/demo/state`, `/api/demo/conversation`, and `/api/demo/materials`
- household and student profile entities visible in the UI
- persona fixture system with multiple North America family archetypes
- demo persona switcher in memory mode
- visible brief refresh after material updates
- visible material update turns with:
  - patch status
  - affected fields
  - extracted facts
  - profile impact
- chat-driven confirmation of ambiguous school lists
- chat-driven resolution of conflicting testing updates
- chat-driven conversion of confirmed shortlists into `Reach / Target / Safer-fit` strategy state
- brief updates that stay aligned with the latest trustworthy profile state

## Founder Alignment Artifact

- The current founder/partner alignment questionnaire lives at:
  - `docs/product/founder-alignment-checklist-zh.md`
- It is written in Chinese for a non-technical, non-product stakeholder.
- Prefer yes/no or single-choice framing when extending it.
- Treat it as a decision-support doc, not as part of the user-facing product flow.

## Testing Expectations

- Before closing work in this repo, run:
  - `pnpm test`
  - `pnpm build`
- Keep API tests and component tests aligned whenever state shape changes.
- For conversation-slice work, prefer verifying at all three layers:
  - domain
  - API
  - component
- Do not claim a new user journey is done unless the whole path is covered end-to-end.

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

- continue Slice 3 from bucketed school-list state into the next execution loop
- keep pushing vertical closed loops instead of broad infrastructure work
- only start Slice 4 workspace/auth work after Slice 3 feels convincingly real in the demo
