<!-- task-archive metadata -->
<!-- snapshot_id: 20260329-221625-admitgenie-blank-user-entry-design -->
<!-- project_path: /Users/jilanfang/ai college-apply-helper -->
<!-- saved_at: 2026-03-29 22:16 CST -->

# Task Plan: admitgenie-blank-user-entry-design

## Goal
Add a formal blank-user entry path so a real new user can create a fresh case without an existing invite, land directly inside the coach shell, and receive a private return link.

## Success Criteria
- A new user can click `Start a new plan` from the current home access surface.
- The backend creates a brand-new blank case instead of routing into a seeded pilot case.
- The created case opens inside the existing coach shell with:
  - one coach opening message
  - 2 to 3 suggested starter prompts
  - a copyable private return link
- The existing invite-based pilot flow still works unchanged.
- The new thread can resume implementation from the design decisions already locked.

## Scope
- Home access surface changes
- One new backend start-session endpoint
- Blank case creation path in current drizzle persistence model
- Reuse of current invite/session return-link pattern
- No account system, no email/phone auth, no workspace model, no multi-case dashboard

## Current Phase
Design phase. Product direction is locked for a no-account blank-user entry path, but implementation has not started.

## Completed Work
- Confirmed the current production entry is invite-based and not a true blank-user path.
- Confirmed the current case seed path hydrates from a persona-backed starter state rather than a blank state.
- Locked product choices for the first implementation:
  - formal user entry, not internal-only tooling
  - no-account version first
  - one-click `Start a new plan`
  - blank case with coach opening + suggested starters
  - copyable private return link
- Chose the minimal architecture direction:
  - reuse the current home access surface
  - add `Start a new plan` to the current access card
  - add one backend start-session endpoint
  - reuse the current token/session pattern instead of introducing auth

## Remaining Work
- Finalize the remaining design sections:
  - testing strategy
  - implementation risks
  - strict v1 scope boundaries
- Write the design into a dedicated design doc if continuing the full brainstorming flow.
- Then create the implementation plan and start code changes.

## Next Actions
- Continue from the design checkpoint and finish the remaining design sections for blank-user entry.
- After design approval, implement the home CTA, backend start endpoint, blank seed path, and return-link UI.

## Blockers
- None.

## Decisions Made
| Decision | Rationale |
|----------|-----------|
| Use a formal user-facing entry, not an internal test-only tool | Matches the user’s product intent. |
| Ship no-account blank-user entry before any light-auth variant | Fastest route to a true new-user path with current architecture. |
| Use one-click `Start a new plan` instead of a pre-create questionnaire | Keeps first touch friction minimal. |
| Blank case should still include coach opening + 2-3 suggested starters | Avoids a dead empty screen while staying meaningfully cleaner than the demo seed. |
| Return link should be explicit and copyable | Prevents no-account users from losing access to their case. |
| Reuse the current home access page instead of adding a separate `/start` route first | Smallest viable change for this repo and current production shape. |

## Touched Files
- app/page.tsx
- components/demo-access-gate.tsx
- components/coach-shell.tsx
- lib/server/persistence.ts
- docs/product/onboarding-v1.md
- AGENTS.md
- SKILLS.md
- .task-archive/current.md
- .task-archive/snapshots/20260329-221625-admitgenie-blank-user-entry-design.md
- task_plan.md
- progress.md
- findings.md

## Verification
| Check | Status | Details |
|-------|--------|---------|
| Current entry-path inspection | passed | Confirmed the live product currently requires invite access and does not expose a blank-user create flow. |
| Persistence inspection | passed | Confirmed the current drizzle seed path hydrates a starter persona-backed case rather than a blank case. |
| Product design alignment | passed | Locked v1 direction through explicit user choices during brainstorming. |
