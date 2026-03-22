# Onboarding v1

## Objective

Replace heavy structured intake with an AI-native first-run experience that:

- feels like a coach-led conversation
- produces early value quickly
- captures structured profile data in the background
- keeps the door open for deeper enrichment later

## Core Design Choice

AdmitGenie will not use a CollegeVine-style sequence of heavy steps such as:

- demographics
- test scores
- grades
- coursework
- extracurriculars

as the first-run primary interaction.

Instead, onboarding v1 uses:

`Guided Interview + Persistent Material Inbox`

## First-Run Experience

### What the User Sees

- a welcome message from the coach
- a short explanation of what the coach can help with
- a conversational prompt to get started
- a visible material entry control:
  `Upload file`, `Paste update`, `Add school`, `Add activity`

### What the User Should Feel

- they are being helped immediately
- they do not need to prepare everything up front
- the system is already thinking and organizing for them

## Minimum Information Needed

The coach should aim to collect this minimum starter set:

- current grade
- intended direction or areas of interest
- biggest concern right now
- whether the user already has a school list
- current level of academic / activity context
- rough testing status

This can usually be collected in 4-6 conversational turns.

## First-Run Script Shape

### Opening

Example pattern:

> I can help you build a clearer admissions plan without making you fill out a giant form. Tell me what grade you're in, what you're aiming for, and what feels most unclear right now.

### Immediate Follow-Up Goals

The system should then:

1. reflect what it heard
2. identify one or two high-impact unknowns
3. ask the next best question

### Early Summary

Before asking too many more questions, the system should give back:

- a short current understanding
- one likely top priority
- one likely blind spot or missing input

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

## Material Entry During Onboarding

The material entry control must be available from the first screen onward.

Supported entry actions:

- upload a file
- paste text
- add a school list
- add an activity
- add a score update

The main interaction remains conversational. Material entry supports the conversation instead of replacing it.

## Confirmation Rules

The system should distinguish:

- what the user explicitly said
- what the system inferred
- what still needs confirmation

Critical fields should never silently jump from unknown to final truth without a visible explanation.

## Failure Modes

### User gives sparse answers

The system should still provide a low-confidence initial brief and ask for one concrete next input.

### User uploads material before answering questions

The system should parse what it can, summarize it, and continue the interview with more context.

### User contradicts earlier information

The system should mark the field as conflicting and ask a direct clarification question.

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
