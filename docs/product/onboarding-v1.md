# Onboarding v1

## Source Of Truth

This document derives from:

- `docs/product/canonical-product-blueprint-zh.md`
- `AGENTS.md`

If there is any conflict, the canonical blueprint wins.

## Objective

Replace heavy structured intake with an AI-native first-run experience that:

- feels like a coach-led conversation
- produces early value quickly
- captures structured profile data in the background
- keeps the door open for deeper enrichment later
- activates a real case instead of a disposable setup funnel

## Core Design Choice

AdmitGenie will not use a CollegeVine-style sequence of heavy steps such as:

- demographics
- test scores
- grades
- coursework
- extracurriculars

as the first-run primary interaction.

Instead, onboarding v1 uses:

`Guided Interview + Chat-Led Material Entry`

Inside the canonical blueprint, this is more precisely:

`case activation inside the active coach surface`

## Interaction Principle

The default interaction is one simple coach-led conversation.

- The user should be able to open the product and know to start talking immediately.
- Structured UI should not dominate the screen or require a manual.
- If the coach needs explicit confirmation, it should appear as an inline card inside the chat flow.
- Confirmation cards should be limited to:
  - `yes/no`
  - `single-select`
  - `multi-select`
- Material entry should remain available, but only as a lightweight attachment action beside the chat composer.
- The brief should appear as coach guidance first, with an expandable full brief only when needed.

Additional blueprint constraints:

- onboarding uses the same canonical intake pipeline as every later workflow
- imported or uploaded material becomes `raw source`, not a shortcut around state rules
- only confirmed information should promote into durable strategy state

## First-Run Experience

### What the User Sees

- they are already inside their current case
- a welcome message from the coach
- a short explanation of what the coach can help with
- a conversational prompt to get started
- a simple message box as the main interaction
- a lightweight way to attach or paste material beside the message box
- an optional way to expand the current brief after the coach has already summarized it in chat

### What the User Should Feel

- they are being helped immediately
- they do not need to prepare everything up front
- the system is already thinking and organizing for them
- they are not entering a separate onboarding product

## Minimum Information Needed

The coach should aim to collect this minimum starter set:

- current grade
- intended direction or areas of interest
- biggest concern right now
- whether the user already has a school list
- current level of academic / activity context
- rough testing status

This can usually be collected in 4-6 conversational turns.

The target output of this first run is not “a completed profile.”

It is:

- one trustworthy starter understanding
- one credible `one next move`
- one seed for the future case recap / returning opening

## First-Run Script Shape

### Opening

Example pattern:

> I can help you build a clearer admissions plan without making you fill out a giant form. Tell me what grade you're in, what you're aiming for, and what feels most unclear right now.

### Immediate Follow-Up Goals

The system should then:

1. reflect what it heard
2. identify one or two high-impact unknowns
3. ask the next best question
4. escalate into a card only when a real confirmation or choice is needed

### Early Summary

Before asking too many more questions, the system should give back:

- a short current understanding
- one likely top priority
- one likely blind spot or missing input
- one likely next move if the user stops here today

## Progressive Enrichment

After the first value moment, the system can progressively collect:

- GPA
- testing detail
- school list
- activity detail
- awards
- school constraints
- personal story fragments

This enrichment can happen via:

- explicit questions
- user-uploaded materials
- user-initiated corrections
- imported prior docs or counselor notes that still enter the same canonical intake pipeline

## Material Entry During Onboarding

Material entry must be available from the first screen onward, but it should feel like part of the conversation instead of a separate tool surface.

Supported entry actions:

- upload a file
- paste text
- add a score update

The main interaction remains conversational.

The coach can explicitly prompt for material when helpful, for example:

- "If you already have a school list, drop it here and I will sort it out."
- "If you have a new score report, send it and I will update the plan."
- "If you already have notes or a previous brief, send them and I will turn them into a clean starting point."

## Confirmation Rules

The system should distinguish:

- what the user explicitly said
- what the system inferred
- what still needs confirmation
- what can already influence strategy state versus what is still only a candidate signal

Critical fields should never silently jump from unknown to final truth without a visible explanation.

When confirmation is required:

- do not rely on freeform chat as the primary confirmation mechanism
- prefer inline cards with clear options
- keep the decision small, legible, and reversible when possible

Typical onboarding-time card moments:

- shortlist confirmation
- testing conflict resolution
- choosing the real top concern from several candidates
- confirming whether a proposed checkpoint should become a formal snapshot

## Failure Modes

### User gives sparse answers

The system should still provide a low-confidence initial brief and ask for one concrete next input.

### User uploads material before answering questions

The system should parse what it can, summarize it, and continue the interview with more context.

### User contradicts earlier information

The system should mark the field as conflicting and ask a direct clarification question.

### User imports a messy previous case

The system should:

- preserve the raw source
- extract candidate facts
- summarize the candidate understanding in chat
- only promote confirmed items into durable strategy state

## Explicit Differences From Heavy Structured Intake

What we are intentionally not doing:

- step-based demographic forms as the first-run backbone
- score-by-score mandatory completion before value
- course-count modeling before any guidance
- forced extracurricular entry before initial recommendations

What we are doing instead:

- gather the smallest useful set of facts
- deliver value early
- deepen accuracy over time
