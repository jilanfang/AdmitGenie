# AdmitGenie Docs

This repository currently holds the product and technical documentation scaffold for AdmitGenie.

AdmitGenie is defined in this first phase as:

- an AI-native admissions coach for North America
- focused on 9th-11th grade families
- centered on a `Coach Inbox` experience
- driven by `guided interview + material inbox + monthly brief`
- built as a `Vercel-first MVP`

## Reading Order

Start here if you need the product definition:

1. [Glossary](./glossary.md)
2. [PRD MVP](./product/PRD-MVP.md)
3. [Onboarding v1](./product/onboarding-v1.md)
4. [User Workflows](./product/user-workflows.md)
5. [Material Inbox](./product/material-inbox.md)
6. [Demo Script](./product/demo-script.md)

Then read the technical baseline:

1. [Stack Decision](./tech/stack-decision.md)
2. [System Architecture](./tech/system-architecture.md)
3. [Data Models](./tech/data-models.md)
4. [Agent Architecture](./tech/agent-architecture.md)
5. [Integration Boundaries](./tech/integration-boundaries.md)
6. [ADRs](./tech/adrs/)

Finally read implementation framing:

1. [MVP Scope](./roadmap/mvp-scope.md)

## Directory Layout

- `docs/product/`
  Product requirements, onboarding, workflows, and demo framing.
- `docs/tech/`
  Technical decisions, architecture, data models, agent roles, and integration boundaries.
- `docs/tech/adrs/`
  Architecture decision records for baseline choices.
- `docs/roadmap/`
  MVP scope and deferred work.

## Documentation Principles

- The user-facing experience is AI-native, not form-native.
- Structured profile data still exists, but it is managed by the system instead of hand-entered through long forms.
- MVP chooses the minimum credible path that can be demoed and extended.
- Heavy crawling, OCR, and external worker systems are intentionally deferred.
- Every recommendation should be explainable to users and traceable by the team.
