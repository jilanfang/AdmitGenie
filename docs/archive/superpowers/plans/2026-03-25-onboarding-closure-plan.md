# Onboarding Closure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Close the first-run onboarding gap for the default `Strategic STEM Striver` persona so the coach can deliver an early understanding summary, one top priority, and one next-best missing-input prompt before handing off into the existing school-list / testing / material loops.

**Architecture:** Keep the current rule-driven TypeScript demo flow. Add one lightweight onboarding checkpoint inside conversation orchestration, derive starter context conservatively from first-run family messages, update the existing `weeklyBrief` and `currentFocus`, and reuse the existing chat shell instead of introducing a new onboarding surface.

**Tech Stack:** Next.js App Router, React client component, TypeScript, Vitest, Testing Library

---

### Task 1: Lock the onboarding checkpoint in domain tests

**Files:**
- Modify: `tests/domain/demo-state.test.ts`
- Reference: `docs/superpowers/specs/2026-03-25-onboarding-closure-design.md`

- [x] **Step 1: Write the failing domain tests**

Add focused tests that cover:
- a first-run family reply that gives enough starter context for an early summary
- the coach reply goal and prompt type for the onboarding checkpoint
- updated `weeklyBrief` and `profileFields.currentFocus`
- routing toward school list or testing as the next highest-leverage step

- [x] **Step 2: Run the focused domain test to verify it fails**

Run: `pnpm test tests/domain/demo-state.test.ts`
Expected: FAIL because the onboarding checkpoint behavior does not exist yet.

- [x] **Step 3: Keep the tests persona-anchored and minimal**

Use the default `Strategic STEM Striver` posture.
Do not introduce mocks or a second onboarding model.

- [x] **Step 4: Run the focused domain test again**

Run: `pnpm test tests/domain/demo-state.test.ts`
Expected: still FAIL, but only for the missing onboarding behavior.

### Task 2: Implement lightweight onboarding state updates in the domain

**Files:**
- Modify: `lib/domain/demo-state.ts`
- Test: `tests/domain/demo-state.test.ts`

- [x] **Step 1: Add a minimal helper for early onboarding guidance**

Implement one helper that updates:
- `profileFields.currentFocus`
- `weeklyBrief.whatChanged`
- `weeklyBrief.whatMatters`
- `weeklyBrief.topActions`
- `weeklyBrief.risks`
- `weeklyBrief.whyThisAdvice`

Keep the shape aligned with the existing helpers such as:
- `confirmPendingSchoolList`
- `applySchoolListBuckets`
- `applyApplicationTimingStrategy`

- [x] **Step 2: Keep starter-context inference conservative**

Only infer starter context from clear first-run signals such as:
- selective engineering direction
- missing school list
- unclear testing
- one major concern or profile signal

Do not add a heavy onboarding state machine or over-structured parser.

- [x] **Step 3: Run the focused domain test**

Run: `pnpm test tests/domain/demo-state.test.ts`
Expected: still FAIL because conversation wiring is not complete yet.

### Task 3: Implement the onboarding checkpoint in conversation logic

**Files:**
- Modify: `lib/domain/demo-contracts.ts`
- Test: `tests/domain/demo-state.test.ts`

- [x] **Step 1: Add a lightweight first-run starter-signal parser**

Support plain-language first-run inputs such as:
- grade / stage
- aiming for selective engineering or similar direction
- no school list yet
- testing not confirmed
- one concern like confusion, stress, or uncertainty

Use simple string matching, not LLM-style free inference.

- [x] **Step 2: Add the onboarding checkpoint reply path**

When the coach has enough starter context:
- return a dedicated reply such as `deliver_initial_guidance`
- generate the early summary in the coach reply
- route the next prompt toward `school list` or `testing`

- [x] **Step 3: Preserve existing loop priority**

Pending patch confirmation and conflict resolution must still outrank onboarding guidance.
Existing school-list, timing, and execution loops must continue to work unchanged after onboarding completes.

- [x] **Step 4: Run the focused domain test**

Run: `pnpm test tests/domain/demo-state.test.ts`
Expected: PASS

### Task 4: Lock the same onboarding checkpoint in API tests

**Files:**
- Modify: `tests/api/demo-routes.test.ts`
- Reference: `app/api/demo/conversation/route.ts`
- Reference: `lib/server/persistence.ts`

- [x] **Step 1: Write the failing API test**

Drive `/api/demo/conversation` with a first-run starter message and assert:
- reply goal / prompt type reflect onboarding guidance
- returned state updates `currentFocus`
- returned brief text reflects the early summary and top priority

- [x] **Step 2: Run the focused API test to verify it fails**

Run: `pnpm test tests/api/demo-routes.test.ts`
Expected: FAIL if the conversation route or persistence wiring does not expose the new state consistently.

- [x] **Step 3: Make the minimal production wiring changes needed**

Only touch persistence if the API test reveals a real state-roundtrip gap.
Do not expand persistence scope beyond what the onboarding checkpoint requires.

- [x] **Step 4: Run the focused API test**

Run: `pnpm test tests/api/demo-routes.test.ts`
Expected: PASS

### Task 5: Lock the onboarding checkpoint in the component test

**Files:**
- Modify: `tests/components/coach-shell.test.tsx`
- Modify if needed: `components/coach-shell.tsx`

- [x] **Step 1: Write the failing component test**

Simulate a first-run message and assert the rendered UI shows:
- the early guidance checkpoint in the chat stream
- updated `What I know` / `What’s missing` state where relevant
- access to the current brief or guidance without requiring a material submission

- [x] **Step 2: Run the focused component test to verify it fails**

Run: `pnpm test tests/components/coach-shell.test.tsx`
Expected: FAIL if the current shell only exposes the brief after a material update.

- [x] **Step 3: Make the minimal UI change needed**

Keep the shell chat-first.
Do not redesign the layout or introduce a dashboard-like onboarding summary card.

- [x] **Step 4: Run the focused component test**

Run: `pnpm test tests/components/coach-shell.test.tsx`
Expected: PASS

### Task 6: Full verification and checkpoint refresh

**Files:**
- Modify if needed: `task_plan.md`
- Modify if needed: `progress.md`
- Modify if needed: `findings.md`
- Modify if needed: `.task-archive/current.md`

- [x] **Step 1: Run the full test suite**

Run: `pnpm test`
Expected: PASS

- [x] **Step 2: Run the production build**

Run: `pnpm build`
Expected: PASS with `next build --webpack`

- [x] **Step 3: Refresh project checkpoint docs**

Capture:
- the new current phase
- that first-run onboarding now produces an early guidance checkpoint
- what the next highest-priority persona journey gap is after this slice

- [x] **Step 4: Summarize remaining risk**

Call out that onboarding guidance is still rule-driven and persona-anchored to the default path, not yet fully personalized across all personas.
