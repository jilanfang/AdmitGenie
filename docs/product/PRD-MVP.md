# AdmitGenie MVP PRD

## Document Status

- Status: Draft v1
- Scope: MVP baseline
- Audience: Founders, design, engineering
- Product mode: AI-native coach

## 1. Product Summary

AdmitGenie is an AI-native admissions coach for North America-focused 11th-grade families.

The MVP does not present the user with a large, multi-step intake form. Instead, it starts as a guided interview with a persistent material inbox. The user can talk to the coach, add new materials at any time, and receive an evolving set of recommendations through a weekly brief.

The core promise is simple:

> You do not have to know every field, deadline, or profile detail upfront. AdmitGenie helps you get moving now, then becomes more accurate as you keep talking and adding materials.

## 2. Problem Statement

Families navigating college admissions are overloaded by fragmented information and inconsistent follow-through.

Current pain points:

- They do not know what matters most this week.
- They accumulate information without turning it into a stable plan.
- They struggle to keep profile details, school context, and new updates in sync.
- They may have materials, but those materials do not automatically become better next-step guidance.

Existing tools often optimize for one of two things:

- large forms that create a static profile
- generic AI chat that does not maintain a trustworthy structured state

AdmitGenie MVP is meant to bridge that gap.

## 3. Target User

### Primary User

- North America-focused 11th-grade family
- usually student plus parent, with the student as the main actor and the parent as the main accountability partner
- moderately to highly engaged in the admissions process
- willing to talk to an AI coach and share incremental materials

### Explicitly Not Primary in MVP

- counselor-first workflows
- school district workflows
- transfer admissions
- senior-year emergency submissions
- essay ghostwriting use cases

## 4. Jobs To Be Done

### Functional Jobs

- Help me understand what matters right now.
- Help me turn scattered updates into a reliable current profile.
- Help me add new materials without redoing everything.
- Help me see how new information changes my next steps.

### Emotional Jobs

- Reduce the feeling of being behind.
- Make the process feel guided rather than chaotic.
- Replace uncertainty with a manageable next move.

### Social Jobs

- Help the student and parent align around the same priorities.
- Create a clear artifact that can be shared and discussed.

## 5. Product Principles

- AI-native, not form-native.
- Minimal first-run burden.
- Structured state behind the scenes.
- Explainability over false certainty.
- Every new material should have visible impact or visible non-impact.
- Guidance should be actionable, not decorative.

## 6. MVP Experience

### Core Experience Loop

1. User enters the app and sees a coach, not a form.
2. The coach runs a guided interview to collect minimal necessary information.
3. The user can add materials at any time.
4. The system extracts and proposes profile updates.
5. The system generates a Weekly Brief.
6. The user acts, replies, or adds more information.
7. The profile and next brief evolve over time.

### First-Run Goal

Within 3-5 minutes, a new user should receive:

- an initial understanding summary
- one working hook or profile synthesis
- one top priority for this week
- one or more missing-information prompts

## 7. Key Surfaces

### Coach Inbox

The main application surface. It includes:

- the conversation stream
- upload and add-material controls
- summaries of newly extracted information
- the latest Weekly Brief
- follow-up prompts and action items

### Material Inbox

A supporting surface where users can:

- upload files
- paste text
- add schools
- add activities
- add awards
- add score updates
- add freeform notes

### Profile Summary

A read-mostly system summary of what is currently known, inferred, missing, stale, or conflicting.

## 8. Weekly Brief Definition

Each brief should include:

1. What changed
2. What matters this week
3. Top 3 actions
4. Risks
5. Why this advice

The brief is not a generic motivational note. It is a compact decision artifact.

## 9. Material Types In MVP

MVP supports the concept of these material types, even if parsing depth varies:

- transcript or grade summary
- SAT / ACT / AP score update
- extracurricular update
- competition or award update
- school list
- essay note or freeform personal story fragment
- freeform status update

## 10. Confirmation Model

The system may infer profile fields, but it must not silently overwrite critical state.

When new material is processed, the user should see a summary like:

> I found a new SAT Math score of 760 and updated your testing profile. This strengthens your readiness for higher-selectivity targets and may change next week's recommendations.

If information is uncertain or conflicting, the system should explicitly ask for confirmation.

## 11. Non-Goals

The MVP does not attempt to do the following:

- replace a full counselor practice
- run full live school website crawling
- parse every possible admissions document format
- provide final chancing probabilities as the primary output
- generate full essays
- simulate interviews

## 12. Success Criteria

### Product Success

- A first-time user can receive useful initial guidance without filling a long form.
- A user can add new material at any time without losing conversation continuity.
- New material results in a visible update to profile understanding or recommendations.
- The Weekly Brief is understandable and actionable by both student and parent.

### Demo Success

The demo must show:

1. first-run guided interview
2. initial profile synthesis
3. new material submission
4. profile update summary
5. regenerated brief or updated guidance

## 13. Risks

- The experience could feel too vague if the interview is too open-ended.
- The system could feel untrustworthy if patches are applied opaquely.
- Material parsing could feel weak if the UI promises more automation than the MVP actually provides.
- Weekly Brief could become generic if profile state is too shallow.

## 14. Open Questions For Later Phases

- When should we introduce counselor-facing views?
- When does school monitoring become a real external worker system?
- How deep should OCR and document parsing go?
- When do we introduce richer school fit scoring or chancing?
