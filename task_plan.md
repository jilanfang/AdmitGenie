<!-- task-archive metadata -->
<!-- snapshot_id: 20260323-221748-admitgenie-slice3-conversation-loops -->
<!-- project_path: /Users/jilanfang/ai college-apply-helper -->
<!-- saved_at: 2026-03-23 22:17 CST -->

# Task Plan: admitgenie-slice3-conversation-loops

## Goal
Turn AdmitGenie into a Vercel-first AI-native admissions coach MVP with closed-loop chat, material, and brief workflows that are demoable end-to-end.

## Success Criteria
- The main UX remains chat-first and coach-led.
- Material submission produces visible state change, not silent storage.
- Confirmation and conflict states can be resolved through conversation.
- Brief output stays tied to the latest trustworthy profile state.
- Local verification remains green for the current slice.

## Scope
- Next.js/Vercel/Neon MVP in `/Users/jilanfang/ai college-apply-helper`
- Vertical slices for Material, Brief, and Conversation loops
- Founder alignment support docs where needed
- No heavy OCR, crawler platform, Python worker, or counselor-first workflow

## Current Phase
Checkpoint after closing the first-run onboarding gap and extending Slice 3 deeper: the demo now moves from onboarding into shortlist, timing, story/material priority, execution progress, blocker resolution, and ready-to-ship guidance, with shared-demo access and workspace isolation layered on top.

## Completed Work
- Shipped material confirmation loop with visible `applied / needs_confirmation / conflict` states.
- Shipped brief action loop with in-chat brief expansion and notebook priority summary.
- Reworked conversation handling to be state-aware rather than static/demo-only.
- Added a first-run onboarding checkpoint that produces early understanding, one top priority, and one next-best missing input before deeper loops start.
- Added chat-driven school-list confirmation and testing-conflict resolution.
- Added chat-driven school bucket classification from confirmed shortlist input.
- Added chat-driven application timing capture after shortlist bucketing, including `early` vs `regular` strategy and a no-binding constraint.
- Added chat-driven story/material priority, execution progress, blocker-resolution, and ready-to-ship follow-up turns after timing.
- Added a visible `Application timing` profile field in the notebook rail.
- Added shared demo access gating and workspace-scoped demo state across the UI, API routes, and persistence layer.
- Added a focused spec and implementation plan for the deadline follow-up loop.
- Added a focused spec and implementation plan for onboarding closure.
- Added founder-facing Chinese alignment questionnaire for partner decision review.

## Remaining Work
- Decide the next product-depth slice after `ready-to-ship` guidance, with `testing policy` or a more calendarized execution loop as the strongest candidates.
- Keep avoiding broader auth/workspace architecture expansion until the next user-visible loop is worth it.
- Keep docs and checkpoint artifacts aligned with shipped behavior so planning files do not fall behind the code again.
- Keep the demo narrative aligned with the shipped onboarding, confirmation, and execution loops so external storytelling does not undersell the current MVP.

## Next Actions
- If prioritizing product depth: implement the next conversation-driven execution loop after `ready-to-ship`, with `testing policy` or calendarized execution as the leading candidates.
- If prioritizing external communication: use the refreshed demo script to show onboarding, confirmation, bucketing, timing, and execution progress before adding more behavior.
- Keep the shared demo path lightweight: access gate + workspace isolation for demos, not full auth/product accounts yet.
- Keep the shell and notebook lightweight while preserving the current chat-first UX.

## Blockers
- None.
- Local-only artifacts and untracked noise should stay uncommitted unless explicitly requested.

## Decisions Made
| Decision | Rationale |
|----------|-----------|
| Deliver by vertical slice, not broad scaffolding | Matches the user’s explicit direction and keeps work demoable. |
| Keep center UI as conversation + composer | Protects the AI-native product thesis. |
| Make materials visible in chat as system turns | Keeps updates explainable and concrete. |
| Resolve uncertain or conflicting state in chat | The coach should actually mediate profile truth, not just flag issues. |
| Capture timing as one readable profile field, not a fake per-school deadline system | It keeps the demo useful without inventing unsupported precision. |
| Close first-run onboarding before more infrastructure | The biggest credibility gap had shifted to the beginning of the journey. |
| Add demo access gating and workspace-scoped state as a support layer, not as full auth | Needed for a shareable demo without prematurely expanding into product account architecture. |
| Add founder alignment as a separate Chinese questionnaire doc | Needed for partner alignment and did not previously exist in a usable form. |

## Touched Files
- components/coach-shell.tsx
- components/demo-access-gate.tsx
- app/page.tsx
- app/api/demo/access/route.ts
- app/api/demo/logout/route.ts
- lib/domain/demo-contracts.ts
- lib/domain/demo-state.ts
- lib/domain/personas.ts
- lib/server/persistence.ts
- lib/server/demo-access.ts
- tests/domain/demo-state.test.ts
- tests/api/demo-routes.test.ts
- tests/components/coach-shell.test.tsx
- tests/app/home-page.test.tsx
- tests/auth/demo-access.test.ts
- docs/superpowers/specs/2026-03-24-deadline-loop-design.md
- docs/superpowers/plans/2026-03-24-deadline-loop-plan.md
- docs/superpowers/specs/2026-03-25-onboarding-closure-design.md
- docs/superpowers/plans/2026-03-25-onboarding-closure-plan.md
- docs/product/founder-alignment-checklist-zh.md
- .task-archive/current.md
- .task-archive/snapshots/20260323-221748-admitgenie-slice3-conversation-loops.md

## Verification
| Check | Status | Details |
|-------|--------|---------|
| `pnpm test` | passed | 82/82 tests passed after onboarding closure, workspace isolation, and shared demo access updates. |
| `pnpm build` | passed | Local production build succeeded with `next build --webpack` after the expanded shared-demo and conversation flows. |
