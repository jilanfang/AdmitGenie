# SKILLS.md

## Purpose

- This file holds AdmitGenie-specific product guardrails, demo behavior lessons, and implementation gotchas.
- Keep project-specific triggered guidance here instead of bloating `AGENTS.md`.

## Triggered Guidance

### Product Truths

- Do not drift back toward CollegeVine-style heavy structured onboarding.
- Structured profile state is still required, but it should stay behind the scenes.
- New material must visibly affect either profile understanding, monthly guidance, or both.
- The MVP is still a single-user front-end product, but the usage framing is joint student-plus-parent use, with the same core product also usable by individual counselors as a personal productivity tool.
- The strongest current loop is:
  - `material -> visible analysis -> confirmation or resolution -> profile update -> brief update`
- Chat should not only explain state. The coach must be able to change state through conversation when the user confirms or corrects something.
- After a shortlist is confirmed, the next move should be execution-oriented list strategy, not more generic intake.

### Persona And Journey Guardrail

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

### Implementation Lessons

- Keep `CoachSnapshot` and `DemoState` conceptually separate.
  - `CoachSnapshot` is the read model returned to UI and API consumers.
  - `DemoState` is the lean domain shape used by demo behavior helpers.
- Do not silently mix read-model entities into domain helpers.
- In `drizzle` mode, return hydrated snapshot data directly instead of wrapping it again with default snapshot values.
- Persona switching is a demo operator capability for `memory` mode only.
- Do not pretend persona switching works in durable `drizzle` mode unless true persistence for scenario changes is implemented.
- When state shape changes, keep domain, API, and component tests aligned in the same pass.
- Conversation tests should use stateful mocks, not static fetch payloads, or Slice 3 behavior will look broken even when domain logic is correct.
- `pendingPatch` is not just a display flag.
  - It must drive coach behavior.
  - It must be clearable through user chat turns.
- Material analysis and latest patch state should stay in sync after confirmation or conflict resolution.
- Bucket-style school-list parsing should be done conservatively so multi-sentence input does not over-capture school names.

### Verified Demo Baseline

- Shared state across `/api/demo/state`, `/api/demo/conversation`, and `/api/demo/materials`
- Household and student profile entities visible in the UI
- Persona fixture system with multiple North America family archetypes
- Demo persona switcher in memory mode
- Visible brief refresh after material updates
- Visible material update turns with patch status, affected fields, extracted facts, and profile impact
- Chat-driven confirmation of ambiguous school lists
- Chat-driven resolution of conflicting testing updates
- Chat-driven conversion of confirmed shortlists into `Reach / Target / Safer-fit` strategy state
- Brief updates that stay aligned with the latest trustworthy profile state

### Persona Notes

- Current seeded persona: `Strategic STEM Striver`
- Additional personas exist for:
  - first-gen ambition builder
  - story-rich humanities builder
  - balanced pre-med planner
  - trajectory rebounder
- If future work changes onboarding, brief tone, or demo flow, check whether it should become persona-aware instead of globally hardcoded.
