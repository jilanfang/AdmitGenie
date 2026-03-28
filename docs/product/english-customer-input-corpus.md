# AdmitGenie English Customer Input Corpus

## Role Of This Document

This document is the human-readable companion to:

- `tests/fixtures/ai-routing-corpus.jsonl`

The JSONL fixture is the machine source of truth for automated routing tests.
This document explains what the corpus is for, how it should be extended, and how to interpret the expected routing fields.

The companion stateful journey fixture lives at:

- `tests/fixtures/ai-journey-scenarios.json`

That scenario fixture is used for multi-step regression and report generation.

## Why This Corpus Exists

AdmitGenie is not testing generic chatbot behavior.

It is testing whether a North America admissions coach can:

- understand messy real customer inputs
- classify them into the right interaction category
- choose the right response mode
- avoid unsafe state writes
- trigger confirmation cards only when needed
- preserve a calm, coach-led English interaction style

This corpus is therefore a routing-and-policy test artifact, not a copywriting library.

## Corpus Record Shape

Each JSONL row must include:

- `journey`
- `stage`
- `persona`
- `channel`
- `userInput`
- `expectedInputKind`
- `expectedResponseMode`
- `expectedWritePermission`
- `expectedCardType`
- `expectedActionProposal`
- `expectedFallbackBehavior`

## Response Mode Meaning

- `chat_only`
  - normal coach reply
  - no card required
  - state write may still be allowed through validated action proposals
- `yes_no`
  - use only for tightly scoped binary confirmations
- `single_select`
  - use only when one explicit choice must be made
- `multi_select`
  - use only when the customer must confirm or narrow a set of options
- `summarize_no_write`
  - the system may respond naturally
  - the system must not update durable state
  - the system must not invent a card unless current pending state already requires one

## Write Permission Meaning

- `proposal_allowed`
  - the response model may propose one validated action
  - policy still owns execution
- `none`
  - the system must not write durable state from this input

## Expected Fallback Meaning

- `none`
  - normal routing path
- `summarize_without_profile_write`
  - material or message should be kept visible, but not promoted into profile truth
- `coach_summary_only`
  - emotional or ambiguous input should receive a calm natural-language summary without state mutation

## Coverage Expectations

The corpus should keep growing across these realities:

- clean direct inputs
- partial or messy phrasing
- mixed-intent customer turns
- emotional uncertainty
- ambiguous shortlist language
- conflict-resolution language
- wrong-stage or premature strategy moves
- uploads that are visible but not yet trustworthy enough to write

## Current Journey Coverage

The current fixture rows cover:

- Journey 1 starter context and uncertainty
- Journey 2 first-gen confusion and affordability pressure
- Journey 3 material updates, ambiguous uploads, and no-write storage cases
- Journey 4 shortlist confirmation
- Journey 5 testing conflict resolution
- Journey 6 school bucketing
- Journey 7 timing strategy
- Journey 8 material priority
- Journey 9 progress, blocker, and blocker resolution

Journey 10 is intentionally not part of the customer routing corpus because it is an internal planning journey, not a customer-facing coach interaction.

The fixture now contains a broad enough spread to support recurring routing audits:

- at least 80 English customer utterances
- all five core personas
- both `chat` and `material` channels
- clean, messy, ambiguous, emotional, and wrong-stage phrasing
- deterministic-covered rows and future-model rows in the same source

## Extension Rules

When adding new rows:

- keep all customer-facing utterances in English
- write like a real North America family, student, or counselor
- prefer incomplete, natural phrasing over synthetic benchmark language
- do not add rows that only differ by one school name unless the routing expectation changes
- if a row exists only to test model failure or ambiguity, make the expected fallback explicit

## Validation Intent

For every corpus row, the system should be testable at four layers:

1. classifier output
2. policy-selected response mode
3. write permission and card permission
4. final execution or fallback behavior

The goal is not perfect semantic understanding.
The goal is safe, consistent, coach-like routing under real customer input conditions.

## Report Workflow

Use the current regression entry point:

- `pnpm test:routing-report`

This runs:

- corpus coverage assertions
- stateful journey replay through the demo API
- markdown and JSON report generation into `output/ai-routing/`

The current report artifacts are:

- `output/ai-routing/journey-report.md`
- `output/ai-routing/journey-report.json`
