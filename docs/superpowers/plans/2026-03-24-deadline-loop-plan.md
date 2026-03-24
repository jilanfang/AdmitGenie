# Deadline Follow-Up Loop Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend Slice 3 so a bucketed shortlist naturally flows into a deadline/application-round clarification loop that updates demo state and refreshes the weekly brief.

**Architecture:** Keep the current rule-driven TypeScript domain flow. Add one new `applicationTiming` profile field, one conservative conversation parser for timing strategy, and one follow-up reply path after shortlist bucketing. Reuse the existing demo state, API route, and component rendering patterns instead of introducing a separate timing model.

**Tech Stack:** Next.js App Router, React client component, TypeScript, Vitest, Testing Library

---

### Task 1: Lock the new timing loop in domain tests

**Files:**
- Modify: `tests/domain/demo-state.test.ts`
- Reference: `docs/superpowers/specs/2026-03-24-deadline-loop-design.md`

- [ ] **Step 1: Write the failing domain test**

Add a test that starts from:
- ambiguous shortlist material
- confirmation through chat
- shortlist bucketing through chat
- timing clarification through chat

Assert that:
- `profileFields.applicationTiming.status === "known"`
- `profileFields.applicationTiming.value` contains early vs regular intent
- `weeklyBrief.whatChanged` and `topActions` become deadline-aware
- the coach reply references timing or application pacing

- [ ] **Step 2: Run the focused domain test to verify it fails**

Run: `pnpm test tests/domain/demo-state.test.ts`
Expected: FAIL because `applicationTiming` and the timing parser do not exist yet.

- [ ] **Step 3: Keep the new test minimal and aligned with current patterns**

Do not add mocks or helper layers.
Follow the existing conversation-loop test style already used for school-list confirmation and bucket parsing.

- [ ] **Step 4: Run the focused domain test again**

Run: `pnpm test tests/domain/demo-state.test.ts`
Expected: still FAIL, but only for the missing timing behavior.

### Task 2: Implement timing state in the domain model

**Files:**
- Modify: `lib/domain/demo-state.ts`
- Test: `tests/domain/demo-state.test.ts`

- [ ] **Step 1: Extend the demo profile field shape**

Add `applicationTiming` to `DemoProfileFields` and seed it in `createInitialDemoState()` with:
- label: `Application timing`
- value: `No confirmed early vs regular application strategy yet`
- status: `unconfirmed`

- [ ] **Step 2: Add a minimal state transition for timing strategy**

Implement a helper that accepts a readable timing summary string and updates:
- `profileFields.applicationTiming`
- `profileFields.currentFocus`
- `weeklyBrief`

Keep the update style consistent with `confirmPendingSchoolList`, `resolvePendingTestingConflict`, and `applySchoolListBuckets`.

- [ ] **Step 3: Run the focused domain test**

Run: `pnpm test tests/domain/demo-state.test.ts`
Expected: still FAIL because conversation parsing is not wired yet.

### Task 3: Implement the timing follow-up conversation path

**Files:**
- Modify: `lib/domain/demo-contracts.ts`
- Test: `tests/domain/demo-state.test.ts`

- [ ] **Step 1: Add a conservative parser for timing intent**

Support plain-language inputs such as:
- `Purdue and Georgia Tech are early action for us.`
- `UT Austin is regular decision.`
- `No binding early decision.`

Return a readable summary string rather than a highly structured object.

- [ ] **Step 2: Advance the reply flow after shortlist bucketing**

After bucket parsing succeeds:
- reply should point the family toward timing strategy
- `nextPromptType` should indicate deadline/timing clarification

When a later message contains timing intent:
- update the state using the new domain helper
- reply with the next execution-oriented guidance

- [ ] **Step 3: Run the focused domain test**

Run: `pnpm test tests/domain/demo-state.test.ts`
Expected: PASS

### Task 4: Lock the same loop in API tests

**Files:**
- Modify: `tests/api/demo-routes.test.ts`
- Reference: `app/api/demo/conversation/route.ts`

- [ ] **Step 1: Write the failing API test**

Drive the conversation route through:
- shortlist confirmation
- bucket classification
- timing clarification

Assert the API response exposes:
- updated `applicationTiming`
- deadline-aware brief changes
- reply content that acknowledges the timing strategy

- [ ] **Step 2: Run the focused API test to verify it fails**

Run: `pnpm test tests/api/demo-routes.test.ts`
Expected: FAIL if the route response shape or persistence does not yet expose the new field correctly.

- [ ] **Step 3: Make the minimal code changes needed for green**

Only touch production code if API tests reveal a real wiring gap beyond the domain changes.

- [ ] **Step 4: Run the focused API test**

Run: `pnpm test tests/api/demo-routes.test.ts`
Expected: PASS

### Task 5: Lock the user-visible loop in the component test

**Files:**
- Modify: `tests/components/coach-shell.test.tsx`
- Modify if needed: `components/coach-shell.tsx`

- [ ] **Step 1: Write the failing component assertion**

Simulate the same stateful conversation flow and assert the rendered UI shows:
- the timing follow-up coach turn after school bucketing
- the updated profile field / notebook state for application timing
- refreshed brief text or action language that mentions timing

- [ ] **Step 2: Run the focused component test to verify it fails**

Run: `pnpm test tests/components/coach-shell.test.tsx`
Expected: FAIL if the UI assumptions do not yet cover the new timing field or conversation step.

- [ ] **Step 3: Make the minimal UI changes needed**

Follow existing display patterns for profile fields and conversation turns.
Do not redesign the shell.

- [ ] **Step 4: Run the focused component test**

Run: `pnpm test tests/components/coach-shell.test.tsx`
Expected: PASS

### Task 6: Full verification and checkpoint refresh

**Files:**
- Modify if needed: `task_plan.md`
- Modify if needed: `progress.md`
- Modify if needed: `findings.md`
- Modify if needed: `.task-archive/current.md`

- [ ] **Step 1: Run the full test suite**

Run: `pnpm test`
Expected: PASS

- [ ] **Step 2: Run the production build**

Run: `pnpm build`
Expected: PASS with `next build --webpack`

- [ ] **Step 3: Refresh project checkpoint docs**

Capture:
- the new current phase
- what deadline loop behavior shipped
- what the next post-deadline execution loop should be

- [ ] **Step 4: Summarize remaining risk**

Call out that timing is still a readable summary field, not a real school deadline system.
