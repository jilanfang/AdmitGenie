# AGENTS.md

## Purpose

- This file is the project index for AdmitGenie.
- Keep it lean: project intent, source of truth, current baseline, verification, and routing only.
- Project-specific product guardrails, demo behavior lessons, and implementation gotchas live in `SKILLS.md`.
- Cross-project defaults live in `/Users/jilanfang/.codex/AGENTS.md`, `/Users/jilanfang/.codex/SKILLS.md`, and `/Users/jilanfang/.codex/PORTS.md`.

## Project Intent

- AdmitGenie is an AI-native admissions coach for North America-focused 9th-11th grade families.
- The MVP is conversation-first, not form-first.
- The core loop is `Coach Inbox + Material Inbox + Monthly Brief`.
- The product is designed for progressive profile building instead of one-time intake completion.

## Source Of Truth

- Canonical product blueprint:
  - `docs/product/canonical-product-blueprint-zh.md`
- Derived product docs should follow the blueprint rather than redefine the product independently:
  - `docs/product/founder-priority-user-journeys-zh.md`
  - `docs/product/onboarding-v1.md`
  - `docs/product/user-workflows.md`
- Founder/partner alignment artifact:
  - `docs/product/founder-alignment-checklist-zh.md`

## Current Baseline

- Primary demo UI:
  - `components/coach-shell.tsx`
- Demo domain state:
  - `lib/domain/demo-state.ts`
  - `lib/domain/personas.ts`
- Persistence boundary:
  - `lib/server/persistence.ts`
- Demo API surface:
  - `app/api/demo/*`
- Default localhost app port comes from the global registry:
  - `3101`

## Verification

- Before closing work in this repo, run:
  - `pnpm test`
  - `pnpm build`
- When conversation or state shape changes, verify at all three layers when practical:
  - domain
  - API
  - component
- Do not claim a new user journey is done unless the whole path is covered end to end.
- Production build should use `next build --webpack`.

## Current Priorities

- Continue Slice 3 from bucketed school-list state into the next execution loop.
- Keep pushing vertical closed loops instead of broad infrastructure work.
- Only start Slice 4 workspace or auth work after Slice 3 feels convincingly real in the demo.

## Routing

- Project-specific triggered guidance and lessons: `SKILLS.md`
- Cross-project defaults: `/Users/jilanfang/.codex/AGENTS.md` and `/Users/jilanfang/.codex/SKILLS.md`
- Localhost port registry: `/Users/jilanfang/.codex/PORTS.md`
