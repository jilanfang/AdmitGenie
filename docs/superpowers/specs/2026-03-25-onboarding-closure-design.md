# AdmitGenie Onboarding Closure Design

## Context

AdmitGenie already has a stronger mid-funnel demo loop than the top-level product docs imply.

The current demo can already:

- accept new materials
- surface applied, confirm-needed, and conflicting profile patches
- resolve ambiguous school-list and testing state through chat
- move from shortlist confirmation into school buckets, application timing, story/material priorities, execution progress, blockers, and ready-to-ship guidance

That means the biggest remaining MVP gap is no longer the middle of the journey.

The biggest gap is the beginning:

`first-run conversation -> initial understanding -> first useful priority -> next best missing input`

Without that first value moment, the product still feels like a strong demo shell with strong follow-up loops, rather than a complete MVP path.

## Product Goal

Close the first-run onboarding gap for the default MVP persona:

`Strategic STEM Striver`

The desired first-run loop is:

`coach opening -> 2-4 guided turns -> early summary -> first priority -> next best question -> handoff into existing school-list / testing / material loops`

The user should feel guided quickly, without being pushed into a heavy intake flow.

## Persona And Journey Anchor

This slice is intentionally anchored to one primary persona and one workflow.

Primary implementation target:

- `Strategic STEM Striver`

Reference-only secondary persona:

- `First-Gen Ambition Builder`

Primary workflow target:

- `Workflow 1: First-Time Guided Onboarding`

This slice should not try to make all personas fully first-run-personalized yet.
It should first make the default MVP journey complete and credible.

## Confirmed Scope

This slice covers:

- first-run guided interview behavior for the default persona
- lightweight onboarding state inside the existing demo domain
- an early summary that returns value before full profile completion
- one explicit first priority and one explicit missing-input prompt
- handoff from first-run summary into existing school-list, testing, and material loops
- domain, API, and component coverage for the onboarding checkpoint

This slice does not cover:

- heavy multi-step onboarding UI
- a new onboarding wizard
- generalized persona-specific orchestration for all personas
- new persistence architecture
- auth, access gating, or workspace expansion as the main scope
- counselor-first workflow expansion

## Primary UX Decision

The product should stay chat-first.

The onboarding improvement should happen through better conversational state and better summary behavior, not through a new panel-driven intake experience.

The user should still see:

- the coach opening
- the chat stream
- the persistent composer
- material entry controls available from the start

The user should not be moved into:

- step-based onboarding cards
- progress meters as the primary interaction
- large intake modules replacing the chat

## First-Run Interaction Design

### Opening

The current opening posture is directionally right and should remain lightweight:

> I can help you build your first admissions plan through conversation, not a giant intake form.

The coach should still ask for:

- grade
- intended direction
- what feels most unclear

### Guided Follow-Up

After the first user reply, the coach should not continue asking generic intake questions indefinitely.

Instead, it should:

1. reflect what it already heard
2. identify the highest-leverage unknown
3. ask one next best question

The system should aim to gather a minimum starter set across 2-4 turns:

- grade or school stage
- intended direction or interest area
- biggest current concern
- school-list presence or absence
- rough testing clarity
- one profile signal such as an activity, award, or academic context

### Early Summary Checkpoint

Once enough starter context exists, the coach should produce a structured early-value turn before continuing.

That summary should always include three parts:

1. `Current understanding`
2. `Top priority this month`
3. `What would sharpen the advice next`

Example shape:

> Current understanding: you are an 11th-grade student aiming at selective engineering programs, but your testing and school-list baseline are still incomplete.
>
> Top priority this month: lock your testing context and build a first realistic engineering-heavy shortlist.
>
> What would sharpen the advice next: your latest SAT/ACT status and the first 6-10 schools you are seriously considering.

This is the missing first-run value moment.

## State Design

The source of truth should stay inside the existing demo state.

Do not add a parallel onboarding state machine outside the current domain shape.

The lightest pattern-aligned approach is:

- keep `DemoState.profileFields` as the primary state surface
- keep `weeklyBrief` as the primary compact recommendation artifact
- add one lightweight onboarding checkpoint concept inside conversation orchestration

The onboarding checkpoint should answer:

- do we have enough starter context for an early summary?
- which core signals are still missing?
- what is the next best prompt?

This can be derived from existing and lightly extended profile fields rather than modeled as a heavyweight workflow object.

## Conversation Logic

### New Behavior

Add a first-run conversational path that can:

- infer starter signals from the first 2-4 family turns
- decide when the context is good enough for an early summary
- generate that early summary deterministically
- route the next follow-up toward:
  - `school list`
  - `testing`
  - `material upload / paste`

### New Prompt Shape

The coach should produce one dedicated onboarding checkpoint reply type, for example:

- `deliver_initial_guidance`

That reply should only fire when the system has enough context to stop collecting and start helping.

### Handoff Rules

After the onboarding checkpoint:

- if school list is missing, ask for the first shortlist or draft school range
- if testing is unclear, ask for current SAT / ACT status
- if both are weak, ask for whichever is more leverage for the default persona
- if the user adds material instead, continue through the existing patch and confirmation flow

This preserves continuity rather than creating a special onboarding-only dead end.

## Brief Behavior

The onboarding checkpoint should update the existing `weeklyBrief`, not create a second recommendation surface.

After the early summary:

- `whatChanged` should reflect that a starter understanding now exists
- `whatMatters` should name the immediate admissions bottleneck
- `topActions` should focus on the next one to three clarifying moves
- `risks` should stay explicit about low-confidence areas
- `whyThisAdvice` should explain why the current recommendation follows from the limited starter context

This keeps the brief useful from first run onward.

## UI Behavior

No major layout redesign is needed.

Only one meaningful UI adjustment is required:

- the user should be able to see the current brief or initial guidance even when it was not triggered by a material update

That can be done by exposing the current brief from the existing chat shell in a way that remains secondary to the chat stream.

The first-run screen must still feel like a conversation product, not a brief dashboard.

## Testing Strategy

Follow the current three-layer pattern.

Add coverage for:

- domain:
  - first-run messages produce an early summary after enough starter context
  - the summary updates `weeklyBrief` and `currentFocus`
  - the next prompt routes toward school list or testing instead of restarting generic intake
- API:
  - conversation route returns the onboarding checkpoint reply and updated state
- component:
  - the coach shell shows the early summary and the next prompt without requiring a material submission

Tests should stay stateful and persona-anchored to the default journey.

## Simpler Alternatives Considered

### Option 1: Add an onboarding summary card in the UI only

Pros:

- fast to implement
- visible progress immediately

Cons:

- treats the symptom, not the missing journey logic
- risks re-centering the product around cards instead of coaching

### Option 2: Build a dedicated multi-step onboarding flow

Pros:

- easier to reason about mechanically
- predictable data capture

Cons:

- directly conflicts with the product thesis
- encourages heavy form-first interaction

### Option 3: Improve conversation logic and reuse the existing brief

Pros:

- matches the AI-native product direction
- closes the actual MVP gap
- preserves current shell and source of truth

Cons:

- requires more careful conversation-state logic than a UI-only patch

## Recommendation

Use Option 3.

Close the first-run gap by teaching the existing conversation system to recognize when it has enough starter context, deliver an early guidance checkpoint, and hand the user into the already strong school-list / testing / material loops.

That keeps AdmitGenie anchored to the strongest current persona journey and moves the product closer to a real MVP, not just a stronger demo fragment.
