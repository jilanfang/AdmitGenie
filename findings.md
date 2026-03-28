<!-- task-archive metadata -->
<!-- snapshot_id: 20260328-003556-admitgenie-ai-native-desktop-ui-checkpoint -->
<!-- project_path: /Users/jilanfang/ai college-apply-helper -->
<!-- saved_at: 2026-03-28 00:35 CST -->

# Findings & Decisions

## Requirements
- Preserve the AI-native, conversation-first product thesis.
- Keep the core MVP demoable and easy for young families to use without a learning curve.
- Keep structured confirmations in chat, not as separate dashboard flows.
- Keep desktop web, especially Mac, feeling intentional and calm.
- Keep docs/checkpoints trustworthy as active source-of-truth artifacts.
- Do not imply real model integration where it does not yet exist.

## Scope Notes
- This checkpoint is UI-convergence-focused rather than architecture-focused.
- The main task was interaction and visual simplification, not feature expansion.
- Browser QA was part of the work, not an optional afterthought.
- The working tree is intentionally still dirty because the checkpoint spans multiple related product, docs, and UI iterations.

## Research Findings
- The strongest remaining quality issues were about desktop composition, not missing features.
- On large screens, opening coach copy can easily become too narrow and feel like a skinny title column unless explicitly widened.
- Side-panel layering works better with a very light scrim and clear sheet separation than with strong blur over the whole app.
- Keyboard focus, hover, and pressed states matter a lot for perceived Mac web quality even in a chat-first product.
- Dev-only local overlays distort design review and should be hidden during browser QA.
- The product now reads much more coherently as one conversation surface, but any future additions should still be forced through the same “chat first, cards only when necessary” principle.

## Technical Decisions
| Decision | Rationale |
|----------|-----------|
| Keep the UI chat-first and treat cards as in-chat confirmation only | This matches founder direction and reduces cognitive load for families and students. |
| Optimize this phase for desktop/Mac web feel | Current review priorities favored PC web over mobile polish. |
| Use real browser QA to drive the last-mile changes | The important issues were visual density and rhythm, which were clearer in-browser than in static code review. |
| Keep the right panel as the only visible exception for low-frequency controls | This preserves operability without reintroducing a dashboard feel. |
| Hide dev-only local overlays during design QA | They corrupt perception of actual product quality in local review. |

## Issues / Blockers
- None.
- Working tree is not clean because this checkpoint intentionally spans continuing UI, docs, and domain work.

## Next Actions
- If continuing design work, keep the scope narrow:
  - first-screen rhythm
  - composer weight on laptop screens
  - side-panel density
- If switching back to implementation or product work, keep the current interaction principle as the source of truth.
- Before shipping or committing, decide how to group the current modified files into a sensible boundary.
