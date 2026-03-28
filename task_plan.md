<!-- task-archive metadata -->
<!-- snapshot_id: 20260328-003556-admitgenie-ai-native-desktop-ui-checkpoint -->
<!-- project_path: /Users/jilanfang/ai college-apply-helper -->
<!-- saved_at: 2026-03-28 00:35 CST -->

# Task Plan: admitgenie-ai-native-desktop-ui-checkpoint

## Goal
Push AdmitGenie toward an AI-native, conversation-first desktop experience that feels like a private admissions counselor rather than a multi-panel demo system.

## Success Criteria
- Main UI is visually centered on the conversation, with low-frequency controls hidden or visually subordinate.
- Access gate, coach shell, suggestions, decision cards, and inserts share one coherent desktop visual language.
- Desktop and Mac web experience feels intentional, quiet, and readable instead of mobile-first or SaaS-dashboard-like.
- Key demo flows still work after the UI cleanup.
- The next thread can resume from a clear checkpoint without re-discovering context.

## Scope
- Chat-first shell hierarchy and desktop layout
- Access gate tone and visual alignment
- Composer, suggestions, decision cards, inserts, and side-panel polish
- Product docs aligned to the simplified interaction model
- No real LLM integration and no major architecture rewrite

## Current Phase
Checkpoint after multiple rounds of AI-native UI convergence, desktop-first browser QA, and final polishing of the Mac/PC web experience.

## Completed Work
- Rewrote the main shell toward a stronger chat-first information hierarchy with low-frequency controls behind a hidden side panel.
- Updated access gate and coach copy to sound more like a private admissions counselor and less like a demo/system.
- Added and integrated `suggestedReplies` while keeping `decisionCard` as the in-chat structured confirmation surface.
- Reduced visual card/dashboard noise across conversation messages, inserts, composer, and suggested replies.
- Tuned desktop/Mac presentation:
  - wider shell rhythm
  - calmer opening hierarchy
  - lighter floating controls
  - clearer focus, hover, and pressed states
  - improved side-panel layering
- Hid dev-only local UI noise from the browser demo.
- Verified the current state with fresh `pnpm test`, `pnpm build`, and real browser QA against `http://127.0.0.1:3101`.

## Remaining Work
- Human-review the current desktop UI and decide whether any additional polish is worthwhile.
- If continuing design work, focus only on first-screen rhythm, composer weight on laptop screens, and side-panel density.
- Decide how to split or commit the broader working tree, which includes UI, doc, and domain changes from this phase.
- Real LLM integration remains future work.

## Next Actions
- Review the current desktop UI in browser and decide whether more polish is still needed.
- If continuing UI work, focus only on:
  - opening-line rhythm and spacing
  - composer weight on 13/14-inch laptop screens
  - right-side panel spacing and density
- If switching back to product or implementation work, keep the simplified chat-first interaction principle as the source of truth.
- Before shipping or handing off, decide how to split or commit the broader modified file set.

## Blockers
- None.
- The working tree is intentionally dirty because this checkpoint spans an ongoing product/UI iteration rather than a finalized commit boundary.

## Decisions Made
| Decision | Rationale |
|----------|-----------|
| Keep the UI chat-first and treat cards as in-chat confirmation only | This matches the founder direction and keeps the product usable for young families without system learning overhead. |
| Optimize this phase for desktop/Mac web feel | Current demo review and founder feedback prioritized PC web experience over mobile parity. |
| Use browser QA, not CSS intuition alone, to guide the last-mile polish | The remaining issues were about visual density and rhythm, which were easier to judge in a live browser than in code alone. |
| Keep the side panel as the only visible exception for low-frequency controls | This preserves demo/operator access without letting it dominate the user-facing surface. |
| Do not imply real LLM integration | The current pass is UI/interaction convergence only. |

## Touched Files
- app/globals.css
- components/coach-shell.tsx
- components/demo-access-gate.tsx
- tests/components/coach-shell.test.tsx
- tests/app/home-page.test.tsx
- docs/product/onboarding-v1.md
- docs/product/user-workflows.md
- docs/product/canonical-product-blueprint-zh.md
- docs/product/founder-priority-user-journeys-zh.md
- lib/domain/demo-contracts.ts
- lib/domain/demo-state.ts
- lib/server/persistence.ts
- tests/api/demo-routes.test.ts
- tests/domain/demo-state.test.ts
- AGENTS.md
- .gitignore
- app/icon.svg
- task_plan.md
- progress.md
- findings.md
- .task-archive/current.md
- .task-archive/snapshots/20260328-003556-admitgenie-ai-native-desktop-ui-checkpoint.md

## Verification
| Check | Status | Details |
|-------|--------|---------|
| `pnpm test` | passed | 84/84 tests passed on the current workspace on 2026-03-28. |
| `pnpm build` | passed | Production build succeeded with `next build --webpack` on 2026-03-28. |
| Local browser QA | passed | Verified desktop access gate, main chat view, and side panel using Playwright against `http://127.0.0.1:3101`. |
| Desktop visual polish | passed | Final browser review confirmed improved opening rhythm, calmer side-panel layering, and cleaner local demo presentation. |
