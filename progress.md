<!-- task-archive metadata -->
<!-- snapshot_id: 20260329-221625-admitgenie-blank-user-entry-design -->
<!-- project_path: /Users/jilanfang/ai college-apply-helper -->
<!-- saved_at: 2026-03-29 22:16 CST -->

# Progress Log

## Checkpoint Summary
- Snapshot ID: 20260329-221625-admitgenie-blank-user-entry-design
- Saved At: 2026-03-29 22:16 CST
- Project Path: /Users/jilanfang/ai college-apply-helper
- Current Phase: blank-user entry is in design mode; core product choices are locked, but implementation has not started.

## Actions Completed
- Restored the latest project checkpoint and reviewed current product constraints.
- Confirmed the live product still uses invite-based access and does not expose a true blank-user create flow.
- Confirmed the current persistence seed path hydrates a persona-backed starter case instead of a blank case.
- Locked the first implementation direction with the user:
  - user-facing formal entry
  - no-account path first
  - one-click `Start a new plan`
  - blank case with coach opening plus suggested starters
  - copyable private return link
- Chose the minimal architecture path:
  - extend the current access card rather than add a separate `/start` route
  - add one backend start-session endpoint
  - reuse the current session and token-return model

## Next Actions
- Finish the remaining design sections for:
  - testing strategy
  - implementation risks
  - strict v1 scope boundaries
- Then turn the design into an implementation plan and start coding.

## Files Created/Modified
- app/page.tsx
- components/demo-access-gate.tsx
- components/coach-shell.tsx
- lib/server/persistence.ts
- docs/product/onboarding-v1.md
- AGENTS.md
- SKILLS.md
- task_plan.md
- progress.md
- findings.md
- .task-archive/current.md
- .task-archive/snapshots/20260329-221625-admitgenie-blank-user-entry-design.md

## Verification Results
| Check | Status | Details |
|-------|--------|---------|
| Current entry-path inspection | passed | Verified the live product currently requires invite access and does not expose blank-user case creation. |
| Persistence inspection | passed | Verified the current seed path is persona-backed rather than blank. |
| Product direction lock | passed | Core v1 design choices were explicitly selected with the user during brainstorming. |

## Reboot Check
| Question | Answer |
|----------|--------|
| Where am I? | At a design checkpoint for blank-user entry on top of the existing live POC. |
| Where am I going? | Finish the design, then convert it into an implementation plan and code change. |
| What's the goal? | Let a true new user create a fresh case without an existing invite and still get a private return path. |
| What have I learned? | The current product only feels “non-demo” once inside; the entry path and seeded case still prevent a truly blank-user experience. |
| What have I done? | Inspected the current live entry and seed path, then locked the product direction for a no-account blank-user create flow. |
