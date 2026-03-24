# System Architecture

## Overview

AdmitGenie MVP is a Vercel-first web application with one core interaction loop:

`conversation + material ingestion + profile state + monthly brief`

## System Context

```text
USER
  |
  v
NEXT.JS APP (Coach Inbox UI)
  |
  +--> Conversation Orchestrator
  |
  +--> Material Ingestion Pipeline
  |
  +--> Profile State Manager
  |
  +--> Brief Generation Service
  |
  +--> Persistence Layer (Neon Postgres + Blob)
  |
  +--> External Adapters
          - school data
          - email
          - future crawler
```

## Core Modules

### 1. Coach Inbox UI

Responsibilities:

- conversation display
- material submission
- brief rendering
- profile update visibility
- action acknowledgment

### 2. Conversation Orchestrator

Responsibilities:

- manage guided interview flow
- decide next best question
- generate user-facing summaries
- route extracted facts into profile state

### 3. Material Ingestion Pipeline

Responsibilities:

- accept new material items
- classify them
- extract candidate facts
- create profile patches
- summarize effects to the user

### 4. Profile State Manager

Responsibilities:

- store profile fields and statuses
- apply or hold profile patches
- detect stale or conflicting fields
- maintain evidence links

### 5. Brief Generation Service

Responsibilities:

- combine profile state, school context, and recent changes
- produce Monthly Brief content
- trigger immediate updates when needed

## Main Data Flow

```text
USER MESSAGE / MATERIAL
        |
        v
INTAKE / PARSING
        |
        v
EXTRACTED FACTS
        |
        v
PROFILE PATCH
        |
   +----+----+
   |         |
   v         v
APPLY     CONFIRM / RESOLVE
   |         |
   +----+----+
        |
        v
PROFILE STATE
        |
        v
BRIEF GENERATION
        |
        v
COACH INBOX UPDATE
```

## Shadow Paths

### Nil Path

No meaningful user data yet.

System behavior:

- create minimal starter profile
- ask one high-value question
- produce low-confidence brief if possible

### Empty Path

User provides shallow or incomplete inputs.

System behavior:

- preserve uncertainty
- avoid pretending certainty
- ask for one useful follow-up or material upload

### Error Path

Material parsing or external adapter fails.

System behavior:

- keep raw material
- tell the user the material was received
- fall back to manual summary or delayed parsing

## State Strategy

The product is conversation-first, but the architecture is state-first behind the scenes.

This means:

- the user sees fluid AI interaction
- the system keeps durable structured state
- every important update can be traced to a source

## Deferred External Layer

```text
OPTIONAL FUTURE LAYER

External Crawling Worker
  - Scrapling candidate
  - OCR candidate
  - browser automation candidate
```

This layer is not part of MVP deployment.

## Deployment Model

### MVP Deployment

- one Next.js application on Vercel
- Neon for relational storage
- Blob for files
- Cron for scheduled brief generation
- optional shared-demo access gate plus workspace-scoped demo state for hosted walkthroughs

### MVP Constraint

Avoid any architecture that requires:

- separate always-on worker clusters
- a Python service as the main backbone
- live crawling infrastructure

## Rollout Principle

The architecture should support a convincing demo now without forcing a rewrite later.
