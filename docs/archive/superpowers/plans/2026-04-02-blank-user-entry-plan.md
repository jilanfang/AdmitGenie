# Blank User Entry Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a true blank-user entry path that creates a fresh private case, opens it in the current coach shell, and exposes a copyable private return link.

**Architecture:** Extend the existing `session/access` flow instead of adding a parallel auth system. Reuse the current pilot case/session pattern for both seeded invite access and user-created private cases, while introducing a lightweight blank-case starter state.

**Tech Stack:** Next.js App Router, React, Vitest, Drizzle, in-memory fallback persistence

---

### Task 1: Define the blank-case starter state and runtime case metadata

**Files:**
- Modify: `lib/domain/demo-state.ts`
- Modify: `lib/server/pilot-access.ts`
- Modify: `lib/server/persistence.ts`
- Test: `tests/data/persistence.test.ts`

- [ ] Add a blank-case starter state that does not prefill persona-backed profile facts.
- [ ] Teach runtime case lookup to distinguish static pilot cases from user-created blank cases.
- [ ] Make memory persistence initialize blank cases with blank starter state.
- [ ] Make durable hydration preserve blank-case metadata instead of falling back to seeded pilot case labels.

### Task 2: Add start-new-plan session creation

**Files:**
- Modify: `app/api/session/access/route.ts`
- Create: `lib/server/start-plan.ts`
- Modify: `db/schema.ts` usage through inserts
- Test: `tests/api/case-routes.test.ts`

- [ ] Write a failing API test for `action: "start_new_plan"`.
- [ ] Create a backend helper that creates a case, a return token, and a session in memory or durable mode.
- [ ] Return the session cookie plus a private return URL from the access route.

### Task 3: Update the entry UI and coach shell

**Files:**
- Modify: `components/demo-access-gate.tsx`
- Modify: `app/page.tsx`
- Modify: `components/coach-shell.tsx`
- Test: `tests/app/home-page.test.tsx`
- Test: `tests/components/coach-shell.test.tsx`

- [ ] Add the `Start a new plan` CTA to the access gate.
- [ ] Navigate successful blank-case creation into the private return URL.
- [ ] Pass the private return URL into the coach shell.
- [ ] Render a copyable private return link block in the case rail.

### Task 4: Verify the full repo baseline

**Files:**
- Test: `tests/api/case-routes.test.ts`
- Test: `tests/app/home-page.test.tsx`
- Test: `tests/components/coach-shell.test.tsx`

- [ ] Run targeted tests for the new access flow.
- [ ] Run full `pnpm test`.
- [ ] Run full `pnpm build`.
