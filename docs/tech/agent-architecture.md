# Agent Architecture

## Overview

AdmitGenie MVP uses a small set of explicit AI roles instead of a single monolithic chatbot.

These roles can be implemented within one application layer, but the responsibilities should remain distinct.

## Agent / Role Map

```text
USER
  |
  v
INTERVIEW COACH
  |
  v
PROFILE SYNTHESIZER
  |
  +--> MATERIAL PARSER
  |
  v
BRIEF COMPOSER
  |
  v
UPDATE NOTIFIER
```

## 1. Interview Coach

### Responsibility

- collect minimum viable profile context
- ask the next best question
- reflect current understanding back to the user
- keep the conversation feeling coach-like rather than form-like

### Inputs

- latest profile state
- known missing fields
- recent user messages
- active conversation goal

### Outputs

- user-facing coach response
- candidate extracted facts
- conversation goal transition

### Guardrails

- do not ask too many questions in one turn
- do not pretend certainty when context is thin
- keep questions tied to better guidance

## 2. Profile Synthesizer

### Responsibility

- turn messages and parsed materials into structured facts
- convert facts into proposed profile patches
- determine field status

### Inputs

- conversation turns
- extracted facts
- existing profile state

### Outputs

- updated or proposed `ProfileField`
- `ProfilePatch`
- conflict markers

### Guardrails

- do not overwrite critical fields silently
- preserve uncertainty state
- attach evidence links where possible

## 3. Material Parser

### Responsibility

- classify user-submitted material
- extract structured signals
- produce a user-readable summary of what was found

### Inputs

- `MaterialItem`
- optional user-provided labels

### Outputs

- `ExtractedFact[]`
- parsing summary
- patch trigger payload

### Guardrails

- prefer clear extraction over aggressive guessing
- degrade gracefully when parsing depth is limited
- never claim a deep parse when only a shallow parse happened

## 4. Brief Composer

### Responsibility

- generate the Monthly Brief
- prioritize actions
- explain why each recommendation matters now

### Inputs

- current profile state
- school context
- recent changes
- pending risks

### Outputs

- `MonthlyBrief`
- `ActionItem[]`
- possible follow-up prompts

### Guardrails

- be specific
- avoid generic motivational filler
- tie recommendations back to known evidence

## 5. Update Notifier

### Responsibility

- decide what should surface immediately
- decide what should wait for the next scheduled brief
- summarize profile changes after new materials

### Inputs

- patch status
- change severity
- brief schedule

### Outputs

- `InboxItem`
- immediate alert
- follow-up question

### Guardrails

- avoid noisy interruptions
- escalate only meaningful changes
- preserve continuity of the coach relationship

## Why This Split

This structure keeps the system:

- easier to debug
- easier to explain
- easier to evolve

without introducing a heavyweight agent runtime in the MVP.
