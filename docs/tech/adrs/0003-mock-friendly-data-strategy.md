# ADR 0003: Mock-Friendly Data Strategy

## Status

Accepted

## Decision

The MVP uses curated school data and mock or curated change events instead of live crawling and real-time school monitoring.

## Why

- the MVP needs to prove product value before infrastructure depth
- live crawling would add operational weight too early
- the product can still demonstrate changing recommendations with curated events

## Consequences

- school monitoring is represented in architecture but not fully implemented in MVP
- integration boundaries are designed now so the future crawler can be added later
- demo reliability is improved
