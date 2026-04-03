# AdmitGenie MVP Personas

> Archived document.
> This file captured persona thinking at an earlier stage.
> The current executable persona source is `../../../lib/domain/personas.ts`.

## Purpose

These personas are not generic marketing archetypes. They are operating profiles for product design, onboarding prompts, monthly brief tone, and demo storytelling.

All personas below are:

- North America focused
- 9th-11th grade household journeys
- primarily joint student-plus-parent use on the front end, with the same core product also usable by individual counselors as a personal productivity tool
- good fits for the AI-native `Coach Inbox + Material Inbox` loop

## 1. Strategic STEM Striver

- Who: High-performing student and involved parent targeting selective engineering programs.
- Current state: Strong ambition, decent academic foundation, but still no real school list and no confirmed SAT / ACT context.
- Emotional reality: They are afraid of aiming too low and equally afraid of wasting time on unrealistic choices.
- What the coach should do first: lock testing status, force an initial engineering-heavy school list, then identify the strongest technical proof points.
- Best materials to collect early: SAT update, robotics/project update, competition results, initial school list.

## 2. First-Gen Ambition Builder

- Who: First-generation college-bound family with strong grades and limited process fluency.
- Current state: The student is motivated, but the family does not yet have a reliable model for selectivity, scholarships, affordability, or timeline tradeoffs.
- Emotional reality: They are not looking for hype. They need the process to become legible.
- What the coach should do first: create a first affordable school list, identify scholarship-sensitive constraints, and translate ambition into concrete next steps.
- Best materials to collect early: school brainstorm, awards, service or leadership updates, any budget-related constraints in free text.

## 3. Story-Rich Humanities Builder

- Who: Student with strong writing, debate, civic, or history-oriented interests.
- Current state: There is real narrative material, but it risks feeling scattered because the school list and supporting evidence are not yet organized.
- Emotional reality: They want to feel distinctive, not generic.
- What the coach should do first: identify the dominant humanities thread, connect it to schools, and pick the activities that actually support that story.
- Best materials to collect early: essay fragments, debate/civic updates, reading/research interests, first school ideas.

## 4. Balanced Pre-Med Planner

- Who: Science-oriented family aiming at biology, neuroscience, or pre-health pathways.
- Current state: Good grades and service, but unclear whether testing effort is worth the tradeoff and unclear how to differentiate a balanced profile.
- Emotional reality: They fear blending in.
- What the coach should do first: decide whether testing adds leverage, then build a list that respects science fit, rigor, and execution bandwidth.
- Best materials to collect early: service updates, research experiences, course rigor context, school list draft, testing decision note.

## 5. Trajectory Rebounder

- Who: Student whose profile improved sharply after an uneven earlier period.
- Current state: The upward trend is real, but it is not yet well packaged into evidence or a calibrated school strategy.
- Emotional reality: The family worries older weaker signals will dominate the story.
- What the coach should do first: document the rebound clearly, surface the strongest recent proof points, and de-romanticize the school list.
- Best materials to collect early: newest transcript, score updates, project or leadership wins from the stronger recent period.

## Product Implications

### Onboarding

- The first conversation should not ask every family the same sequence.
- Each persona benefits from slightly different early prompts:
  - STEM striver: testing + school list calibration
  - first-gen family: affordability + school list legibility
  - humanities builder: narrative + supporting evidence
  - pre-med planner: differentiation + list realism
  - rebounder: evidence of trajectory + calibrated targets

### Material Inbox

- Different personas naturally produce different early materials.
- The inbox should accept this variety without forcing users through rigid categories too early.

### Monthly Brief

- The brief should feel persona-aware:
  - some users need narrowing
  - some need confidence through structure
  - some need evidence packaging
  - some need realism and de-risking

## MVP Recommendation

For the live demo and first seeded product path, use:

- primary default persona: `Strategic STEM Striver`
- backup demo persona: `First-Gen Ambition Builder`
- narrative contrast persona for later demos: `Trajectory Rebounder`
