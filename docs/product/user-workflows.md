# User Workflows

## Overview

AdmitGenie MVP supports four primary workflows:

1. First-time guided onboarding
2. Ongoing chat-based enrichment
3. Add new material and update profile state
4. Review and act on the Weekly Brief

## Workflow 1: First-Time Guided Onboarding

```text
USER ARRIVES
    |
    v
COACH WELCOME
    |
    v
GUIDED INTERVIEW (4-6 high-value questions)
    |
    +--> USER ADDS MATERIAL EARLY
    |        |
    |        v
    |    MATERIAL PARSED
    |        |
    |        v
    |    PROFILE PATCH PROPOSED
    |
    v
INITIAL PROFILE SYNTHESIS
    |
    v
FIRST RECOMMENDATION + MISSING INFO PROMPT
    |
    v
ENTER COACH INBOX
```

### Success Condition

The user gets value before completing a large structured profile.

## Workflow 2: Ongoing Chat-Based Enrichment

```text
USER RETURNS
    |
    v
OPENS COACH INBOX
    |
    v
RESPONDS TO FOLLOW-UP QUESTION
    |
    v
SYSTEM EXTRACTS NEW FACTS
    |
    v
PROFILE PATCH CREATED
    |
    +--> CONFIRM NEEDED? -- yes --> USER CONFIRMS / CORRECTS
    |                         |
    |                         no
    v
PROFILE STATE UPDATED
    |
    v
NEXT BRIEF BECOMES MORE PRECISE
```

### Typical Examples

- user clarifies intended major direction
- user says they have started a new club project
- user corrects a previous score or timeline

## Workflow 3: Add New Material

```text
USER SUBMITS MATERIAL
    |
    v
ITEM STORED AS MATERIALITEM
    |
    v
CLASSIFY MATERIAL TYPE
    |
    v
EXTRACT FACTS
    |
    v
PROPOSE PROFILE PATCH
    |
    +--> LOW RISK ---------> APPLY + SUMMARIZE
    |
    +--> NEEDS CONFIRM ---> ASK USER
    |
    +--> CONFLICT --------> FLAG CONFLICT + ASK USER
    |
    v
TRIGGER BRIEF UPDATE OR HOLD FOR NEXT BRIEF
```

### Material Examples

- transcript update
- SAT score report
- activity summary
- new school shortlist
- essay brainstorm note

## Workflow 4: Weekly Brief Review

```text
WEEKLY BRIEF AVAILABLE
    |
    v
USER READS:
  - what changed
  - what matters now
  - top 3 actions
  - risks
  - why this advice
    |
    +--> USER ACTS ON TASK
    |
    +--> USER ASKS FOLLOW-UP
    |
    +--> USER ADDS NEW MATERIAL
    |
    v
COACH UPDATES PROFILE + NEXT RECOMMENDATION LOOP
```

### Success Condition

The brief creates action, not passive reading.

## Edge Cases

### Sparse User

- minimal responses
- no materials
- no school list yet

Desired behavior:
- provide a low-confidence brief
- ask for one next useful input

### Conflicting User Data

- transcript says one GPA
- user states another

Desired behavior:
- mark as conflicting
- do not silently overwrite

### No Meaningful Weekly Change

Desired behavior:
- still produce a lightweight brief
- focus on continuity and current priorities

## Product Takeaway

The app should feel continuous. Users should not experience a hard line between intake, profile management, and coaching.
