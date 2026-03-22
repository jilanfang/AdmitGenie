# ADR 0004: AI-Native Onboarding

## Status

Accepted

## Decision

AdmitGenie will not use a heavy structured onboarding wizard as the primary first-run experience.

It will use:

- guided interview
- persistent material inbox
- progressive enrichment of structured profile state

## Why

- a heavy form front-loads user effort before value
- the product promise is coaching, not profile data entry
- structured data is still needed, but can be maintained behind the scenes

## Consequences

- the system must support extraction, confirmation, and profile patches
- onboarding design and technical design become tightly connected
- materials become a first-class part of profile growth
