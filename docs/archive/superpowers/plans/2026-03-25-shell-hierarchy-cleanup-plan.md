# Shell Hierarchy Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the AdmitGenie shell feel more conversation-first by lowering demo-control noise, clarifying the first action, lightening the notebook rail, and fixing the favicon 404.

**Architecture:** Keep the current `CoachShell` data flow and API contracts intact. Limit the change to presentation structure in `components/coach-shell.tsx`, companion styling in `app/globals.css`, one small access-shell polish if needed, and a new app icon asset. Update tests first, then implement the minimum JSX/CSS changes to satisfy them.

**Tech Stack:** Next.js App Router, React client components, TypeScript, CSS, Vitest, Testing Library

---

### Task 1: Lock The New UI Contract In Tests

**Files:**
- Modify: `tests/components/coach-shell.test.tsx`

- [ ] **Step 1: Write failing tests**
- [ ] **Step 2: Run the targeted component test file and confirm the new expectations fail for the right reason**
- [ ] **Step 3: Keep all behavior assertions for chat/material flows intact**

### Task 2: Implement The Shell Hierarchy Cleanup

**Files:**
- Modify: `components/coach-shell.tsx`
- Modify: `app/globals.css`

- [ ] **Step 1: Restructure the left rail around family snapshot + secondary demo controls**
- [ ] **Step 2: Add a compact center hero summary that surfaces the next immediate step**
- [ ] **Step 3: Reduce notebook density without removing current-priority support**
- [ ] **Step 4: Keep existing API and state logic unchanged**

### Task 3: Fix The Missing Favicon

**Files:**
- Create: `app/icon.svg`

- [ ] **Step 1: Add a small AdmitGenie icon asset that Next can serve automatically**
- [ ] **Step 2: Confirm the app no longer relies on a missing favicon path**

### Task 4: Verify End To End For This Scope

**Files:**
- Modify if needed: `tests/app/home-page.test.tsx`

- [ ] **Step 1: Run the targeted `CoachShell` and homepage tests**
- [ ] **Step 2: Fix any regressions with minimal code**
- [ ] **Step 3: Run `pnpm test`**
- [ ] **Step 4: Run `pnpm build`**
