# AdmitGenie AI-Native Chat Shell Design

## Context

The current `CoachShell` presentation reads like a results page or dashboard.

That is the wrong first-run posture for AdmitGenie.

The first-run experience must feel like a modern frontier-model product:

- left conversation sidebar
- center chat as the primary product surface
- persistent bottom input
- optional thin notebook rail on desktop only

The main interaction must stay conversational.

The center area must not be replaced by dashboard cards, result boxes, or button-heavy intake UI.

## Product Goal

Create a first-run shell that immediately feels like:

> a coach-led AI conversation that is quietly building the student profile in the background

not:

> a profile dashboard that happens to contain a chat widget

## Confirmed Constraints

- Reference modern LLM product shells.
- Coach sends the first message on login.
- Left sidebar is acceptable and useful.
- Center column must remain chat-first.
- Bottom input box is the main interaction control.
- Right rail is optional, lightweight, and secondary.
- Mobile must prioritize chat over any side rail.

## Primary UX Decision

AdmitGenie should use:

`Desktop: left sidebar + center chat + thin right notebook`

`Mobile: left navigation collapses, right notebook hidden by default, center chat dominates`

This is the working default until a later revision proves otherwise.

## Screen Modes

### 1. First-Run Onboarding Mode

This is the default for a newly logged-in user.

The coach already starts the conversation.

The user sees:

- left sidebar with conversations / new chat affordance
- center conversation stream
- persistent input composer at the bottom
- a thin desktop-only notebook rail

The user does **not** see:

- weekly brief as the primary hero
- profile dashboard cards in the center
- large action tiles replacing chat
- multi-panel “results first” layout

### 2. Ongoing Student Workspace Mode

This mode can appear later, after real history accumulates.

It may become more information-rich, but the chat surface still remains primary.

This later state is not the first redesign target.

The immediate project focus is:

`fix the first-run shell`

## Layout Definition

### Left Sidebar

Purpose:

- navigation
- conversation history
- new conversation entry

Contents:

- AdmitGenie brand or mark
- `New chat`
- recent conversations
- optionally pinned threads or student contexts later

Non-goals:

- no dense analytics
- no heavy profile cards
- no onboarding wizard steps

### Center Chat Column

Purpose:

- dominant interaction surface

Contents:

- coach opening message already present on first load
- short follow-up conversational prompts
- user replies
- material parsing acknowledgements as chat turns
- patch confirmations as chat turns

Rules:

- chat must visually dominate the page
- center width should feel like a model product, not a CRM
- avoid summary-card takeover above the fold
- early value should appear inside the conversation, not as a separate dashboard block

### Bottom Composer

Purpose:

- permanent main interaction control

Contents:

- text input
- send affordance
- light material actions integrated into or adjacent to the composer

Allowed lightweight affordances:

- upload
- paste update
- add school
- add activity

Rules:

- these affordances support the chat
- they cannot become the visual center of the page
- the composer should feel like the user’s primary way of moving the workflow forward

### Right Notebook Rail

Purpose:

- show AI memory formation without turning the experience into a dashboard

Desktop behavior:

- visible by default
- narrow
- secondary in visual hierarchy

Mobile behavior:

- hidden by default
- optionally reachable through a secondary toggle later

Allowed sections in first-run mode:

1. `What I know`
   - confirmed or tentatively captured profile fields
   - example: grade, intended direction, testing status, school list status

2. `What’s missing`
   - 2-3 highest leverage missing inputs
   - example: school list, latest score context, current biggest concern

3. `Add material`
   - lightweight entry affordances only

Forbidden sections in first-run mode:

- weekly brief
- risk dashboard
- action checklist block
- scorecard tiles
- profile completeness meter
- multi-card synthesis wall

## Conversation Design For First Load

The coach should open proactively.

The first coach message should communicate three things:

1. this is guided, not form-driven
2. the user can start with partial information
3. the next reply only needs a few high-leverage facts

The first-turn shape should feel like:

> I’ll help you build your first admissions plan through conversation, not a giant intake form. Start with your grade, what you’re aiming for, and what feels most unclear right now.

The first-run UI should therefore reinforce:

- forward motion
- low burden
- active coaching

not:

- profile review
- score interpretation
- weekly status dashboard

## Information Hierarchy

### Highest Priority

- coach message
- user reply area
- input composer

### Medium Priority

- thin notebook rail contents

### Lowest Priority

- historical or analytical surfaces not needed to start the conversation

If a user can visually ignore the chat because another block is louder, the hierarchy is wrong.

## Design Risks To Avoid

### Risk 1: Dashboard Regression

If the first screen highlights summaries, cards, or recommendations more strongly than the chat, the product will again feel like a results page.

### Risk 2: Faux AI-Native UI

If the center looks like chat but real workflow happens through boxed controls and canned actions, the experience will feel dishonest.

### Risk 3: Overexposed Structure

If profile state becomes too explicit too early, users will feel like they are filling invisible forms instead of talking to a coach.

## Implementation Direction

The first implementation pass should do these things only:

1. Reframe the shell around a true center chat layout
2. Move current result-style blocks out of the initial center presentation
3. Add a thin desktop notebook rail with only:
   - What I know
   - What’s missing
   - Add material
4. Ensure mobile collapses to chat-first
5. Keep the coach opening message as the default first-run entry

It should not yet attempt:

- advanced workspace dashboards
- richer long-term student panels
- counselor mode
- large redesign of persistence behavior

## Acceptance Criteria

- On first load, the center of the page is unmistakably a chat product.
- The coach speaks first.
- The user can respond via the bottom composer without interacting with cards or forms.
- The right rail remains visibly secondary on desktop.
- The right rail is hidden or collapsed on mobile.
- No weekly brief or dashboard block dominates the first-run viewport.
- Material actions are present but clearly subordinate to the composer and chat flow.

## Immediate Next Step

Write the implementation plan for refactoring `components/coach-shell.tsx` and related tests into this shell model, then execute it.
