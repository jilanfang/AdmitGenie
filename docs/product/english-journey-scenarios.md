# AdmitGenie English Journey Scenarios

## Role Of This Document

This document describes the stateful journey fixture that powers multi-step regression:

- `tests/fixtures/ai-journey-scenarios.json`

Unlike the single-turn routing corpus, these scenarios replay full user progress through the demo API and verify that the product keeps moving like a calm admissions coach.

## What A Scenario Covers

Each scenario includes:

- a persona slug
- a concrete journey
- a sequence of real English customer turns
- expected routing mode at each step
- expected state-write behavior
- expected decision-card visibility when relevant
- expected profile and brief state after each step

## Why This Exists

The routing corpus tells us whether one input was classified safely.

The journey scenarios tell us whether the product can sustain a believable coaching flow across multiple turns, including:

- starter guidance
- material ingestion
- shortlist confirmation
- testing conflict resolution
- bucketing
- timing strategy
- material priority
- execution progress
- blocker handling
- ready-to-ship guidance

## Current Regression Entry Point

Run:

- `pnpm test:routing-report`

That command will:

- replay the journey scenarios through the demo API
- aggregate pass and failure counts
- write a human-readable report to `output/ai-routing/journey-report.md`
- write machine-readable details to `output/ai-routing/journey-report.json`

## Extension Rules

When adding scenarios:

- keep all customer-facing input in English
- prefer real family or student phrasing over benchmark wording
- reuse existing validated journey steps when extending a downstream stage
- add a new scenario when the sequence itself changes
- add a corpus row when only the single-turn phrasing changes
- keep expectations stable and observable from API responses, not from hidden internal assumptions
