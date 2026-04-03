# Blank User Entry Design

## Goal

Let a real new user create a fresh case without an existing invite, land directly inside the existing coach shell, and receive a copyable private return link.

## Approved Constraints

- Reuse the current home access surface.
- Do not add accounts, auth, dashboards, or a separate onboarding app.
- Keep the existing invite-based pilot flow working.
- Keep the created case inside the current `CoachShell`.

## Chosen Approach

Add a second access path beside the existing pilot invite path:

1. `Start a new plan` creates a brand-new private case.
2. The backend returns:
   - a new case id
   - a session cookie
   - a private return link token
3. The client navigates to `/?invite=<token>&entry=private`.
4. The current home page sees the valid session cookie and opens the existing coach shell.
5. The coach shell shows the private return link inside the case rail so the user can copy it.

## State Design

The new case should not reuse a persona-backed seeded demo state.

The blank case starts with:

- one coach opening message
- one guided follow-up message
- no confirmed grade
- no confirmed testing state
- no confirmed school list
- a lightweight starter brief that explains what to share first

Suggested starter replies remain visible, but the blank case should feel user-owned rather than pre-filled.

## Data Model

The private return link reuses the existing session + invite pattern rather than introducing a second access system.

- Existing pilot invites keep using pre-seeded static cases.
- New user-created cases generate:
  - a new `pilot_cases` record in durable mode
  - a new `pilot_invites` token used as the private return link
  - a new `pilot_sessions` record for the current browser session
- Memory mode mirrors the same behavior with in-memory maps.

## UI Changes

### Access Gate

- Keep the existing pilot invite field and submit button.
- Add a second CTA: `Start a new plan`.
- Add a short explanation that this creates a private case and a return link.

### Coach Shell

- When the current URL is a private return URL, show a `Private return link` section in the case rail.
- The section should include:
  - short explanatory copy
  - a read-only text field
  - a copy button

## Verification

- API test for creating a blank plan session
- Home page test for rendering the new CTA
- Coach shell test for showing the private return link
- Full `pnpm test`
- Full `pnpm build`

## Out Of Scope

- user accounts
- multi-case dashboard
- email / phone verification
- case ownership transfer
- workspace/auth model changes
