<!-- task-archive metadata -->
<!-- snapshot_id: 20260323-221748-admitgenie-slice3-conversation-loops -->
<!-- project_path: /Users/jilanfang/ai college-apply-helper -->
<!-- saved_at: 2026-03-23 22:17 CST -->

# Findings & Decisions

## Requirements
- Preserve the AI-native, conversation-first product thesis.
- Keep the center experience as chat + composer.
- Make every material update visible and explainable.
- Let users resolve uncertainty through conversation rather than forcing external flows.
- Keep the MVP Vercel-first and TypeScript-first.

## Scope Notes
- Slice 1 and Slice 2 are complete and verified.
- Slice 3 is meaningfully in progress, not just scaffolded.
- First-run onboarding closure is now implemented for the default MVP path.
- Current Slice 3 support now includes:
  - guided clarification
  - pending school-list confirmation
  - testing conflict resolution
  - bucketed shortlist execution
  - deadline-aware application timing follow-up
  - story/material priority
  - execution progress tracking
  - blocker resolution
  - ready-to-ship guidance
- Shared demo access gating and workspace isolation now exist as demo-support layers.
- Full product auth and multi-user workspace architecture have still not started as the next primary thread.

## Research Findings
- The product feels materially stronger when chat can change state, not just describe it.
- The first-run gap was real: without early understanding and one immediate priority, the demo felt stronger in the middle than at the beginning.
- Confirmation and conflict UX are central to trust in an AI admissions coach.
- The right next move after shortlist confirmation is not more intake; it is execution-oriented list strategy.
- After shortlist bucketing, application timing is the cleanest next loop because it sharpens the brief without requiring fake per-school deadline data.
- After timing is explicit, story/material priority and execution tracking create a much more believable admissions-coach loop than more generic questioning.
- Shared-demo needs introduced a practical support layer: access gating plus workspace-scoped state were worth adding before full auth.
- The current demo script lagged behind the product: it described material-to-brief value, but not the newer confirmation, bucketing, and timing loops.
- The partner alignment artifact needed to be written in Chinese and simplified into yes/no or single-choice questions to match the stakeholder context.
- Progress files drifted because they were treated as checkpoint artifacts and were not refreshed in the same pass as later code changes.

## Technical Decisions
| Decision | Rationale |
|----------|-----------|
| Use rule-driven orchestration for current Slice 3 loops | Fastest path to believable continuity without extra runtime complexity. |
| Keep material, conversation, and brief logic in the current TS domain layer | Supports fast iteration and testability inside the MVP boundary. |
| Update pending/conflict state through conversation turns | Aligns the product with the “AI coach” model rather than forcing separate modal flows. |
| Store timing as one readable `applicationTiming` field | This preserves product value while avoiding unsupported precision or schema sprawl. |
| Close first-run onboarding before more infrastructure | The credibility gap had shifted to the beginning of the journey. |
| Add demo access and workspace isolation as support utilities, not product auth | This makes the demo safer to share without committing to the wrong account architecture. |
| Save founder alignment as a repo doc under `docs/product` | Gives the team a persistent, editable decision artifact. |

## Issues / Blockers
- None.
- Clean commit hygiene still requires ignoring `.superpowers/`, `.DS_Store`, and other local-only artifacts.

## Next Actions
- If optimizing product depth, build the next school-execution conversation loop after `ready-to-ship`, with `testing policy` or calendarized execution ahead of broader architecture work.
- If optimizing external storytelling first, use the refreshed demo script to present onboarding, confirmation, bucketing, timing, and execution follow-through before adding another slice.
- Keep task/progress/findings docs updated in the same pass as shipped behavior changes.
- Keep validating each user journey at domain, API, and component level before claiming completion.
