# AdmitGenie Shell Hierarchy Cleanup Design

## Goal

Tighten the first-screen hierarchy of the AdmitGenie demo shell so the coach conversation becomes the dominant focus, while demo/operator controls and notebook context stay available but visually secondary.

## Approved Scope

- Keep the existing three-column shell and all current conversation/material workflows.
- Simplify the left rail so it reads as family context first, not demo operations first.
- Strengthen the center header with one immediate next-step cue.
- Reduce notebook density so it supports the conversation instead of competing with it.
- Fix the missing favicon asset that currently causes a `favicon.ico` 404 during review.

## Design Decisions

### 1. Left Rail Becomes Context-First

- Remove the fake recent-chat list from the primary rail.
- Promote the current student/family snapshot as the main sidebar content.
- Move persona switching, workspace code, and demo deployment state into a lower-emphasis `Demo controls` disclosure panel.

### 2. Center Column Owns The First Screen

- Keep the main heading and conversation-first thesis.
- Add a compact hero summary row that answers:
  - what the coach wants next
  - what is still uncertain
- Keep the monthly brief as an explicit secondary action instead of a persistent panel.

### 3. Notebook Becomes Lighter

- Replace the denser right rail stack with fewer, tighter cards.
- Keep only the most decision-useful context:
  - known anchors
  - open questions
  - current priorities / material actions
- Avoid reintroducing a heavy brief-style rail.

### 4. Favicon

- Add a small AdmitGenie icon asset under `app/` so the app stops generating a missing favicon request during local review.

## Testing Notes

- Update component tests to reflect the new labels and lower-emphasis demo controls.
- Preserve existing behavior tests for material updates, brief toggling, and conversation-driven state changes.
- Re-run the full test and build suite after the UI pass.
