# User Workflows

## Source Of Truth

This document derives from:

- `docs/product/canonical-product-blueprint-zh.md`
- `AGENTS.md`

If there is a conflict, the canonical blueprint wins.

## Overview

AdmitGenie MVP should now be understood as one continuous active-case product, not four disconnected features.

The primary workflows are:

1. Activate an active case for the first time
2. Resume a returning case with recap and reopen logic
3. Ingest new source material through the canonical intake pipeline
4. Resolve decisions and promote trustworthy state
5. Act through the living brief and `one next move`
6. Publish a lightweight monthly checkpoint snapshot
7. Switch among multiple cases without becoming a dashboard

## Shared Interaction Rule

All workflows should feel like one continuous coach conversation.

- The main path is always the active case chat thread.
- Material entry is a lightweight attachment path beside the chat composer, not a separate operating surface.
- Imports and migrated notes still enter the same canonical intake pipeline as chat and uploads.
- When explicit confirmation is required, the system should branch into inline decision cards inside the chat flow.
- Decision cards are limited to:
  - `yes/no`
  - `single-select`
  - `multi-select`
- The coach should summarize the current brief in the conversation before asking the user to open the fuller brief.
- Source grounding should be available on demand, but never dominate the default surface.

## Workflow 1: First-Time Active Case Activation

```text
USER LOGS IN
    |
    v
ACTIVE CASE OPENS
    |
    v
COACH WELCOME
    |
    v
GUIDED INTERVIEW (4-6 high-value turns)
    |
    +--> USER ATTACHES OR IMPORTS MATERIAL
    |        |
    |        v
    |    RAW SOURCE STORED
    |        |
    |        v
    |    CANDIDATE FACTS EXTRACTED
    |
    v
STARTER UNDERSTANDING
    |
    v
ONE NEXT MOVE + FIRST BRIEF SUMMARY
    |
    v
CASE RECAP SEED CREATED
```

### Success Condition

The user gets value before completing a large structured profile, and the case now has enough state to support a strong returning opening.

## Workflow 2: Returning Case Resume And Reopen

```text
USER RETURNS TO ACTIVE CASE
    |
    v
CASE RECAP LOADED
    |
    v
COACH OPENS WITH:
  - since last time
  - confirmed changes
  - unresolved decisions
  - one next move
    |
    +--> CASE REOPENED BY RULE?
    |        |
    |        +--> yes: explain why now
    |
    v
USER RESPONDS / ACTS / UPLOADS
    |
    v
CASE PROGRESS UPDATED
```

### Success Condition

The user feels the coach remembers the case without rereading the whole history, and knows why the case is active again.

## Workflow 3: Source-Grounded Intake

```text
USER CHATS / UPLOADS / IMPORTS
    |
    v
RAW SOURCE STORED
    |
    v
CLASSIFY SOURCE
    |
    v
EXTRACT CANDIDATE FACTS
    |
    v
LINK CANDIDATES TO SOURCE SNIPPETS
    |
    +--> LOW RISK CANDIDATE ------+
    |                             |
    +--> NEEDS CONFIRM -----------> DECISION ITEM CREATED
    |                             |
    +--> CONFLICT ----------------+
    |
    v
CHAT SUMMARY OF WHAT THE SYSTEM FOUND
```

### Success Condition

Every meaningful input enters the same trustworthy chain:

`raw source -> candidate facts -> decision -> confirmed state`

## Workflow 4: Decision Resolution And State Promotion

```text
DECISION ITEM EXISTS
    |
    v
COACH EXPLAINS:
  - what needs confirmation
  - why it matters
    |
    v
INLINE CARD
    |
    +--> USER CONFIRMS / CHOOSES
    |        |
    |        v
    |    CONFIRMED FACTS WRITTEN
    |        |
    |        v
    |    STRATEGY STATE UPDATED
    |
    +--> USER DEFERS / BLOCKED
             |
             v
         BLOCKER TYPE STORED
```

### Success Condition

Important state changes are explicit, reversible, and auditable rather than silently inferred.

## Workflow 5: Living Brief And One Next Move

```text
STRATEGY STATE CHANGES
    |
    v
LIVING BRIEF UPDATED
    |
    v
COACH SUMMARIZES IN CHAT:
  - what changed
  - what matters now
  - one next move
  - why this move
    |
    +--> USER OPENS EXPANDED BRIEF IF NEEDED
    |
    +--> USER COMPLETES MOVE
    |
    +--> USER MARKS BLOCKED / DEFERRED
    |
    v
OUTCOME WRITTEN BACK TO CASE PROGRESS
```

### Success Condition

The brief creates action instead of becoming a passive report, and the system learns what happened to the recommended next move.

## Workflow 6: Monthly Checkpoint Snapshot

```text
LIVING BRIEF HAS ENOUGH MOVEMENT
    |
    v
COACH PROPOSES CHECKPOINT
    |
    v
LIGHTWEIGHT CARD CONFIRMATION
    |
    +--> CONFIRMED
    |      |
    |      v
    |   SNAPSHOT PUBLISHED
    |      |
    |      v
    |   ENDORSEMENT STATE STORED
    |
    +--> NOT YET
           |
           v
        LIVING BRIEF CONTINUES
```

### Success Condition

The product maintains a stable family-shared checkpoint without freezing the brief into a stale monthly document.

## Workflow 7: Multi-Case Attention Without A Dashboard

```text
USER HAS MULTIPLE CASES
    |
    v
ACTIVE CASE OPENS BY DEFAULT
    |
    v
LOW-EMPHASIS CASE SWITCHER
    |
    v
ATTENTION SIGNALS SHOWN:
  - needs decision
  - new source waiting
  - blocked next move
  - deadline-sensitive reopen
    |
    v
USER SWITCHES INTO NEXT ACTIVE CASE
```

### Success Condition

Counselor and multi-case users can navigate attention without the product becoming an inbox or task dashboard.

## Edge Cases

### Sparse User

Desired behavior:

- provide a low-confidence starter understanding
- still give one credible next move
- keep the case open for a strong returning recap later

### Conflicting User Data

Desired behavior:

- mark the candidate as conflicting
- do not silently overwrite
- resolve through an inline card when possible

### Imported Messy Case

Desired behavior:

- preserve raw sources
- extract candidate facts
- show a coach-led synthesis in chat
- require confirmation before durable promotion

### Stale School Knowledge

Desired behavior:

- degrade to general guidance
- avoid high-confidence school-specific writes
- explain when a school-sensitive claim needs refresh

### No Meaningful Monthly Movement

Desired behavior:

- keep the living brief current
- avoid forcing a formal snapshot
- focus on continuity, blockers, and the best next move

## Product Takeaway

The app should still feel singular. Users should not feel a hard line between intake, coaching, profile management, source review, and monthly planning.
