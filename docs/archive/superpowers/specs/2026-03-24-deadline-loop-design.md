# AdmitGenie Deadline Follow-Up Loop Design

## Context

AdmitGenie can already do three meaningful conversation-driven state changes in the demo:

- confirm an ambiguous school list
- resolve conflicting testing updates
- turn a confirmed shortlist into `Reach / Target / Safer-fit` buckets

That is better than scaffoldware, but the experience still stalls after bucketing.

The next product lift should not be broader infrastructure.
It should be the next execution-oriented coach loop that naturally follows list bucketing.

## Product Goal

After the family buckets the current shortlist, the coach should immediately move into deadline strategy:

`bucketed school list -> clarify application rounds / timing -> update profile state -> refresh weekly brief`

The result should feel like the coach is moving the family from "list thinking" into "application pacing."

## Confirmed Scope

This slice is intentionally narrow.

It covers:

- post-bucketing conversation follow-up
- deadline or round-awareness capture through chat
- profile state update for the new timing signal
- weekly brief refresh that reflects timing urgency
- domain, API, and component coverage for the new loop

It does not cover:

- a full deadline database per college
- persistence schema expansion outside current demo state
- counselor workflows
- calendar sync
- general Slice 4 auth or workspace work

## Primary UX Decision

The coach should ask for application-round intent, not raw date entry.

The first useful signal is whether the family is thinking in terms such as:

- ED / EA / REA / RD
- "apply early where possible"
- "no early binding"
- "all regular decision for now"

That is easier to express conversationally than exact deadlines and is enough to materially change the brief.

## Interaction Design

### Trigger Point

Once the family has supplied school buckets and the coach has accepted them, the next coach turn should point toward timing:

> Good. I turned that into a working bucketed list. Next I want to know where you may want to apply early, where regular decision is fine, and whether any school is emotionally important enough to affect timing strategy.

### User Input Shape

The family can answer in plain language, for example:

- `Georgia Tech and Purdue are early action for us. UT Austin is regular decision.`
- `We do not want any binding early decision.`
- `Apply early anywhere non-binding, then regular for the rest.`

The system should support partial answers.
It does not need perfect normalization across every possible round label yet.

### Coach Response

After parsing a usable timing signal, the coach should:

- acknowledge the shift from list strategy to pacing
- store the timing strategy in profile state
- update the brief with execution-oriented actions
- surface new urgency and risk framing

## State Design

The leanest pattern-aligned option is to extend `DemoProfileFields` with one new field:

- `applicationTiming`

This field should follow the same shape as existing profile fields:

- `label`
- `value`
- `status`

This keeps the source of truth inside the existing demo state instead of introducing a parallel timing object.

`currentFocus` should also move forward once timing is known, shifting from generic list strategy toward deadline-aware application planning.

## Conversation Logic

### New Coach Prompt Type

Add a new prompt type for timing follow-up after bucket parsing succeeds, for example:

- `clarify_deadline_strategy`

### New Parsing Behavior

Add conservative parsing for conversation messages that mention:

- `EA`
- `ED`
- `REA`
- `regular decision`
- `RD`
- `early`
- `binding`
- `non-binding`

The parser should extract a readable summary string rather than over-structuring the state.

Example stored value:

`Early: Purdue, Georgia Tech | Regular: UT Austin | Constraint: no binding ED`

### Failure Behavior

If the user message does not contain timing intent, the current flow should stay unchanged.
Do not force a timing update from vague language.

## Weekly Brief Behavior

Once timing strategy is known, the brief should stop speaking only about bucket comparison and instead emphasize:

- early-round prioritization
- school-specific pacing
- materials that must be ready soonest

Top actions should become deadline-aware.
Risks should mention timing slippage where appropriate.

## Testing Strategy

Add one end-to-end behavioral slice across:

- domain: bucketed list followed by timing clarification updates the state and brief
- API: posting the follow-up conversation returns updated timing state
- component: the rendered coach conversation visibly advances from bucketing to timing strategy

Tests should remain stateful and aligned with the existing conversation-loop pattern.

## Simpler Alternatives Considered

### Option 1: Deadline loop by application rounds only

Pros:

- simplest parser
- easiest to explain conversationally
- enough signal to refresh the brief

Cons:

- does not capture exact date urgency

### Option 2: Exact per-school deadlines

Pros:

- more realistic long term

Cons:

- too much structure for the current demo
- invites fake precision without a real college deadline source

### Option 3: Story-priority loop instead of deadline loop

Pros:

- also execution-oriented

Cons:

- timing is the more natural next step immediately after school bucketing
- timing shifts the weekly brief more directly in this slice

## Recommendation

Use Option 1 now.

Store one readable `applicationTiming` profile field, parse conversational round intent conservatively, and refresh the brief around application pacing.

That gives AdmitGenie one more real closed loop without inventing infrastructure or fake precision.
