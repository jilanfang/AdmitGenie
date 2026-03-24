# Chat-First Shell Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor the AdmitGenie homepage from a result-style coach dashboard into a first-run AI-native chat shell with a left sidebar, center chat-first column, and thin desktop notebook rail.

**Architecture:** Keep the existing API-backed data model and route surface. Replace the current monolithic result/dashboard presentation inside `CoachShell` with a shell that prioritizes the conversation stream and bottom composer, while demoting profile memory and material affordances into a thin right rail. Preserve current demo interactions and persistence behavior.

**Tech Stack:** Next.js App Router, React client component, TypeScript, Testing Library, Vitest

---

### Task 1: Lock the first-run shell expectations in tests

**Files:**
- Modify: `tests/components/coach-shell.test.tsx`
- Reference: `docs/superpowers/specs/2026-03-23-ai-native-chat-shell-design.md`

- [ ] **Step 1: Write or update failing assertions for the new shell**

Add assertions that verify:
- the main heading is no longer `Coach Inbox`
- the first-run experience includes a chat-first coach opening
- the center area exposes a message composer
- the right rail shows `What I know`, `What’s missing`, and `Add material`
- the first-run shell no longer renders `Weekly Brief` as the dominant right-rail heading

- [ ] **Step 2: Run the focused component test to verify it fails**

Run: `pnpm test tests/components/coach-shell.test.tsx`
Expected: FAIL because the current UI still renders the dashboard-oriented shell.

- [ ] **Step 3: Tighten existing assertions to remove dashboard assumptions**

Remove or rewrite assertions that currently require:
- `Coach Inbox`
- `Weekly Brief` as the right rail title
- result-card-oriented structure as the first-run shell

- [ ] **Step 4: Run the focused component test again**

Run: `pnpm test tests/components/coach-shell.test.tsx`
Expected: still FAIL, but now against the new shell expectations only.

- [ ] **Step 5: Commit**

```bash
git add tests/components/coach-shell.test.tsx
git commit -m "test: redefine chat-first shell expectations"
```

### Task 2: Replace the current dashboard shell with a true chat-first layout

**Files:**
- Modify: `components/coach-shell.tsx`
- Reference: `docs/superpowers/specs/2026-03-23-ai-native-chat-shell-design.md`

- [ ] **Step 1: Introduce shell regions that match the spec**

Refactor the component structure into:
- left sidebar
- center chat column
- right notebook rail

Keep existing data fetching and action handlers intact for now.

- [ ] **Step 2: Make the coach speak first in the central conversation area**

Use the first conversation message as the dominant above-the-fold content.
Do not render summary cards above the chat stream.

- [ ] **Step 3: Move first-run summary/state out of the center dashboard area**

Remove or demote:
- large student summary hero
- household summary cards
- coach posture cards
- profile cards in the center

The center should read as a chat surface, not a dashboard.

- [ ] **Step 4: Build the thin notebook rail**

Render only:
- `What I know`
- `What’s missing`
- `Add material`

Do not render:
- weekly brief
- risks
- top actions
- why this advice

- [ ] **Step 5: Keep material submission accessible but subordinate**

Move material entry affordances into the notebook/composer flow so they support the chat rather than replacing it.

- [ ] **Step 6: Run the focused component test**

Run: `pnpm test tests/components/coach-shell.test.tsx`
Expected: PASS if the shell structure now matches the spec.

- [ ] **Step 7: Commit**

```bash
git add components/coach-shell.tsx tests/components/coach-shell.test.tsx
git commit -m "feat: refactor admitgenie into chat-first shell"
```

### Task 3: Make the shell responsive with desktop notebook and mobile chat priority

**Files:**
- Modify: `components/coach-shell.tsx`
- Modify: `app/globals.css`
- Test: `tests/components/coach-shell.test.tsx`

- [ ] **Step 1: Add responsive layout classes or styles for desktop vs mobile**

Implement:
- desktop: sidebar + center + thin notebook
- mobile: center-first layout with notebook hidden or collapsed

- [ ] **Step 2: Ensure the composer remains persistent and primary**

The input area should stay visually anchored to the chat workflow and remain usable on narrow screens.

- [ ] **Step 3: Add or update tests for responsive/semantic shell markers**

Use stable text and accessible labels rather than brittle style assertions.

- [ ] **Step 4: Run the focused component test**

Run: `pnpm test tests/components/coach-shell.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add components/coach-shell.tsx app/globals.css tests/components/coach-shell.test.tsx
git commit -m "feat: add responsive chat shell layout"
```

### Task 4: Reconcile material and conversation interactions with the new shell

**Files:**
- Modify: `components/coach-shell.tsx`
- Reference: `app/api/demo/conversation/route.ts`
- Reference: `app/api/demo/materials/route.ts`
- Test: `tests/components/coach-shell.test.tsx`

- [ ] **Step 1: Replace sample/dashboard-style CTA buttons with chat-native interaction affordances**

Keep the actual APIs the same, but present interactions in a way that fits the shell:
- message composer
- lightweight material controls
- optional helper chips only if they stay subordinate

- [ ] **Step 2: Preserve persona switching only where it does not dominate first run**

If retained, demote it into the sidebar or another clearly secondary location.

- [ ] **Step 3: Ensure submitting material still updates visible memory and conversation**

The rail and conversation should reflect changes without reintroducing a result-page layout.

- [ ] **Step 4: Run the focused component test**

Run: `pnpm test tests/components/coach-shell.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add components/coach-shell.tsx tests/components/coach-shell.test.tsx
git commit -m "feat: align demo interactions with chat-native shell"
```

### Task 5: Full verification and deployment readiness check

**Files:**
- Modify if needed: `README.md`
- Modify if needed: `progress.md`, `findings.md`, `task_plan.md`

- [ ] **Step 1: Run the full test suite**

Run: `pnpm test`
Expected: PASS

- [ ] **Step 2: Run the production build**

Run: `pnpm build`
Expected: PASS

- [ ] **Step 3: Sanity-check the homepage manually if needed**

Run: `pnpm dev`
Expected: homepage renders as chat-first shell locally

- [ ] **Step 4: Update planning/progress docs if scope or findings changed materially**

Capture any deviations, tradeoffs, or follow-up work.

- [ ] **Step 5: Commit**

```bash
git add components/coach-shell.tsx app/globals.css tests/components/coach-shell.test.tsx README.md progress.md findings.md task_plan.md
git commit -m "chore: verify chat-first shell refactor"
```
