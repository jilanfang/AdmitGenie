# Material Inbox

> Archived document.
> This was a standalone product explainer before the current blueprint and workflow docs became the mainline.
> For the current product truth, use `../../product/canonical-product-blueprint-zh.md` and `../../product/user-workflows.md`.

## Objective

The Material Inbox gives the user a persistent way to add new information without restarting intake or losing the conversational relationship with the coach.

It exists because admissions planning is not static. New scores, new activities, updated school lists, and new story fragments appear over time.

## Product Role

The Material Inbox is not just file storage.

Each material item should move through this pipeline:

1. intake
2. classification
3. extraction
4. profile patch proposal
5. summary to the user
6. downstream effect on brief or priorities

## Supported Material Types

MVP conceptually supports:

- transcript or grade document
- SAT / ACT / AP score update
- extracurricular update
- competition or award update
- school list
- essay note or personal story note
- freeform update

MVP implementation does not need deep parsing for all of them on day one, but the product contract must support them.

## User Entry Modes

The user should be able to:

- upload a file
- paste copied content
- type a short update
- add a school manually
- add an activity manually

## Required User Feedback

For every submitted material item, the system should visibly report:

- what it thinks the item is
- what facts it extracted
- what profile fields may change
- whether confirmation is needed
- whether this changes the Monthly Brief

## Example Update Pattern

> I read your latest SAT update and found a 760 in Math and a 730 in Reading and Writing. I can use this to refine your testing profile. This likely makes your academic positioning stronger at several current targets.

## Patch Behavior

Patches should not silently overwrite profile state.

There are three acceptable outcomes:

- auto-apply with explanation for low-risk additions
- request confirmation for critical changes
- flag conflict and ask the user to resolve it

## Inbox States

### Empty State

The user has not added any materials yet.

Show:

- simple explanation of what can be added
- examples
- one low-friction action

### Processing State

The material has been submitted and is being analyzed.

Show:

- progress state
- expected next step

### Needs Confirmation State

The system found something important but needs confirmation.

Show:

- what was found
- what field will change
- why confirmation matters

### Applied State

The patch has been applied and profile state has changed.

Show:

- what changed
- where the user can see the impact

### Conflict State

The new material disagrees with prior information.

Show:

- old value
- new candidate value
- source context

## MVP Parsing Strategy

The MVP should prefer:

- text and pasted-note parsing
- lightly structured uploads
- manual tagging when needed

The MVP should defer:

- robust OCR
- complex PDF table extraction
- universal transcript parsing
- advanced school document normalization

## Why This Matters

The Material Inbox is a product differentiator.

It allows the app to behave like a persistent admissions operating system rather than a one-time setup wizard.
