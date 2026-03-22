<!-- task-archive metadata -->
<!-- snapshot_id: 20260322-154119-admitgenie-mvp-persistence-routes -->
<!-- project_path: /Users/jilanfang/ai college-apply-helper -->
<!-- saved_at: 2026-03-22T15:41:19.119753+00:00 -->

# Task Plan: admitgenie-mvp-persistence-routes

## Goal
Build the AdmitGenie MVP scaffold into a restorable, Vercel-first AI-native coach app with verified docs, UI, API routes, persistence boundary, and first database migration.

## Success Criteria
- Product and technical docs exist for the AI-native MVP
- Next.js Coach Inbox demo renders and updates from material changes
- Demo API routes exist for state, conversation, and materials
- Persistence boundary supports memory mode and drizzle mode
- First SQL migration exists for the core MVP tables
- Fresh tests and production build pass

## Scope
- North America admissions coach MVP scaffold
- AI-native guided interview plus persistent material inbox
- Demo routes and persistence boundary
- Drizzle schema and initial migration
- No Auth.js wiring yet
- No real household/student entities yet

## Current Phase
Checkpoint after shared persistence routes and first migration

## Completed Work
- Created docs scaffold under docs/product, docs/tech, docs/roadmap, and docs/glossary
- Built Next.js Coach Inbox demo UI
- Implemented demo material ingestion and weekly brief updates
- Added domain, component, API, build-script, and persistence tests
- Switched production build script to next build --webpack after verifying Turbopack environment failure
- Added demo API routes for state, conversation, and materials
- Added Drizzle ORM, Neon serverless, drizzle-kit, schema, config, and env example
- Implemented memory/drizzle persistence boundary
- Implemented seed payload, hydration helpers, and drizzle insert flow for core tables
- Connected demo API routes to shared persistence adapter so state persists across route calls
- Generated first migration at drizzle/0000_breezy_rafael_vega.sql
- Verified pnpm test and pnpm build both pass

## Remaining Work
- Switch the homepage Coach Inbox from local-only state to API-backed state/actions
- Add real household and student profile tables
- Replace demo constant ids with persisted entities
- Decide whether Auth.js or entity tables come first after UI/api integration

## Next Actions
- Refactor Coach Inbox UI to load from /api/demo/state and mutate via /api/demo/materials and /api/demo/conversation
- Introduce households and student_profiles tables and wire them into persistence
- Keep full verification after each step

## Blockers
- No blockers recorded.

## Decisions Made
| Decision | Rationale |
|----------|-----------|
| Use AI-native conversation-first UX instead of heavy form onboarding | Matches product direction and differentiates from CollegeVine-like flows |
| Keep MVP Vercel-first with Next.js and TypeScript | Fast demo path and single deployable surface |
| Use webpack for production build script in this environment | Fresh verification showed Turbopack failed here due to process/port restriction while webpack succeeded |
| Add persistence as a boundary with memory fallback before full auth/entity wiring | Lets the app evolve from demo state to real data without blocking local demos |

## Touched Files
- README.md
- .env.example
- .gitignore
- package.json
- pnpm-lock.yaml
- drizzle.config.ts
- db/index.ts
- db/schema.ts
- drizzle/0000_breezy_rafael_vega.sql
- drizzle/meta/0000_snapshot.json
- drizzle/meta/_journal.json
- app/api/demo/state/route.ts
- app/api/demo/materials/route.ts
- app/api/demo/conversation/route.ts
- app/layout.tsx
- app/page.tsx
- app/globals.css
- components/coach-shell.tsx
- lib/domain/demo-state.ts
- lib/domain/demo-contracts.ts
- lib/server/persistence.ts
- tests/domain/demo-state.test.ts
- tests/components/coach-shell.test.tsx
- tests/config/build-script.test.ts
- tests/api/demo-routes.test.ts
- tests/data/persistence.test.ts
- docs/README.md
- docs/glossary.md
- docs/product/PRD-MVP.md
- docs/product/onboarding-v1.md
- docs/product/material-inbox.md
- docs/product/user-workflows.md
- docs/product/demo-script.md
- docs/tech/stack-decision.md
- docs/tech/system-architecture.md
- docs/tech/data-models.md
- docs/tech/agent-architecture.md
- docs/tech/integration-boundaries.md
- docs/roadmap/mvp-scope.md

## Verification
| Check | Status | Details |
|-------|--------|---------|
| pnpm test | passed | 5 files, 18 tests passed on 2026-03-22 |
| pnpm build | passed | next build --webpack passed on 2026-03-22 |
| pnpm db:generate | passed | generated drizzle/0000_breezy_rafael_vega.sql on 2026-03-22 |
