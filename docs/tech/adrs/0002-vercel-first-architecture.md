# ADR 0002: Vercel-First Architecture

## Status

Accepted

## Decision

AdmitGenie MVP will use a Vercel-first TypeScript application stack rather than a polyglot architecture with Python as a first-class runtime.

## Why

- the MVP needs fast demo iteration
- front-end and API logic benefit from being in one deployable application
- founder velocity is more important than infrastructure breadth at this stage

## Consequences

- Next.js is the main application surface
- Neon, Blob, Cron, and related services become the default supporting stack
- Python-based workers are deferred to future extensions
