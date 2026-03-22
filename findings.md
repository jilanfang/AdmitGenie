<!-- task-archive metadata -->
<!-- snapshot_id: 20260322-154119-admitgenie-mvp-persistence-routes -->
<!-- project_path: /Users/jilanfang/ai college-apply-helper -->
<!-- saved_at: 2026-03-22T15:41:19.119753+00:00 -->

# Findings & Decisions

## Requirements
- Product and technical docs exist for the AI-native MVP
- Next.js Coach Inbox demo renders and updates from material changes
- Demo API routes exist for state, conversation, and materials
- Persistence boundary supports memory mode and drizzle mode
- First SQL migration exists for the core MVP tables
- Fresh tests and production build pass

## Scope Notes
- North America admissions coach MVP scaffold
- AI-native guided interview plus persistent material inbox
- Demo routes and persistence boundary
- Drizzle schema and initial migration
- No Auth.js wiring yet
- No real household/student entities yet

## Research Findings
- Workspace is not a git repo
- Demo API routes now share in-process persistence in memory mode
- Drizzle schema currently covers conversation_turns, material_items, profile_patches, and weekly_briefs
- First migration has been generated successfully
- The UI still reads local component state directly and has not yet been switched to the API boundary

## Technical Decisions
| Decision | Rationale |
|----------|-----------|
| Use AI-native conversation-first UX instead of heavy form onboarding | Matches product direction and differentiates from CollegeVine-like flows |
| Keep MVP Vercel-first with Next.js and TypeScript | Fast demo path and single deployable surface |
| Use webpack for production build script in this environment | Fresh verification showed Turbopack failed here due to process/port restriction while webpack succeeded |
| Add persistence as a boundary with memory fallback before full auth/entity wiring | Lets the app evolve from demo state to real data without blocking local demos |

## Issues / Blockers
- No blockers recorded.

## Next Actions
- Refactor Coach Inbox UI to load from /api/demo/state and mutate via /api/demo/materials and /api/demo/conversation
- Introduce households and student_profiles tables and wire them into persistence
- Keep full verification after each step
