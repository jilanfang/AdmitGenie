# Integration Boundaries

> Archived document.
> This was an earlier integration sketch. It is preserved for context, not as the current implementation contract.
> For the current deployed shape, read `../../deployment/vercel-demo.md` and `../../tech/system-architecture.md`.

## Objective

Define what the MVP integrates with directly, what sits behind adapters, and what is explicitly deferred.

## Integration Principle

Product logic must not depend directly on vendor-specific shapes.

Every external dependency should be wrapped behind a local interface.

## MVP External Interfaces

## 1. School Data Adapter

Purpose:

- provide baseline school metadata
- support school watch and brief context

MVP source candidates:

- curated school dataset
- selected public API sources

Interface shape:

- `getSchoolById`
- `searchSchools`
- `listTrackedSchoolMetadata`

Deferred:

- live website crawling
- real-time school change extraction

## 2. Material Storage Adapter

Purpose:

- store uploaded files and references

MVP target:

- Vercel Blob

Interface shape:

- `storeMaterial`
- `getMaterial`
- `deleteMaterialReference`

## 3. Parsing Adapter

Purpose:

- parse user-provided materials into candidate facts

MVP support:

- text and pasted content
- simple file metadata
- manually assisted parsing paths

Deferred:

- advanced OCR
- transcript table extraction
- robust PDF pipelines

Future candidate layer:

- external parser worker

## 4. LLM Adapter

Purpose:

- structured extraction
- response generation
- summarization
- brief composition

Interface shape:

- `generateCoachReply`
- `extractFacts`
- `summarizePatch`
- `composeBrief`

Rule:

- LLM outputs must be validated before entering durable profile state.

## 5. Notification Adapter

Purpose:

- send monthly brief emails or notifications

MVP candidate:

- Resend

Interface shape:

- `sendMonthlyBrief`
- `sendAlert`

## 6. Search / Research Adapter

Purpose:

- support future opportunity discovery and structured external lookups

MVP:

- not in critical path

Candidates:

- College Scorecard API
- OpenAlex
- Crossref

## Deferred Boundaries

## OCR Boundary

OCR is not MVP core.

Reason:

- complexity is high
- data quality varies
- it would distort MVP scope

## External Crawler Boundary

Live crawling is not MVP core.

Future candidate:

- Scrapling-based external worker

Expected future interface:

- `fetchSchoolPageChanges`
- `extractSchoolDeadlines`
- `extractPromptChanges`

## Browser Automation Boundary

Browser-based scraping is deferred.

If introduced later, it should sit in an external worker layer rather than the core Vercel application.

## Integration Failure Rules

- if storage fails, keep the user-visible submission attempt and surface a retry path
- if parsing fails, retain the material and fall back to manual clarification
- if external school data fails, do not block chat or profile updates
- if notification fails, preserve the brief in-app
