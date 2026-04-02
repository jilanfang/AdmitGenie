<!-- task-archive metadata -->
<!-- snapshot_id: 20260329-221625-admitgenie-blank-user-entry-design -->
<!-- project_path: /Users/jilanfang/ai college-apply-helper -->
<!-- saved_at: 2026-03-29 22:16 CST -->

# Findings & Decisions

## Requirements
- A real new user must be able to create a fresh case without already holding an invite.
- The first version should not introduce account creation.
- The created case should feel blank and user-owned, not like a seeded demo case.
- The user must receive an explicit private return link.
- The existing invite-based pilot flow must keep working.

## Scope Notes
- This checkpoint is product/design-focused, not implementation-complete.
- The first version is a no-account blank-user entry path, not a full auth or dashboard system.
- The goal is one fresh case per click, not multi-case management.
- The current live POC remains the underlying production base.

## Research Findings
- The current live home page still routes unauthenticated users into an invite gate rather than a new-case create action.
- The current persistence seed path creates persona-backed starter cases with prefilled profile and coach history, so it is not a true blank-user experience.
- The existing product shell and session model are already good enough to host a blank-user entry path without introducing a separate onboarding app.
- The smallest viable path is to extend the current access surface and reuse the current `/?invite=<token>` return-link pattern.

## Technical Decisions
| Decision | Rationale |
|----------|-----------|
| Ship a formal user-facing blank-user entry, not an internal testing backdoor | Matches the user’s product goal. |
| Use no-account creation first | Fastest way to unlock a real first-run path in the current architecture. |
| Use one-click `Start a new plan` | Keeps first touch friction low. |
| Keep the new case blank but not dead-empty | A coach opening plus suggested starters is better than an empty screen. |
| Return link should be explicit and copyable | No-account users need a reliable way back. |
| Reuse the current home access page instead of adding a separate `/start` route first | Smallest viable change with least surface churn. |

## Issues / Blockers
- No blocker; the design direction is clear.
- Implementation has not started yet.

## Next Actions
- Finish the remaining design sections for testing, risks, and strict v1 boundaries.
- Then create an implementation plan and start coding the blank-user entry path.
