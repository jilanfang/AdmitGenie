# AdmitGenie MVP Scaffold

This repository contains the first working scaffold for the AdmitGenie AI-native admissions coach MVP.

## What is included

- `docs/`
  Product, workflow, and technical planning docs for the MVP.
- `app/`
  A minimal Next.js App Router experience for the `Coach Inbox`.
- `components/coach-shell.tsx`
  Demo UI showing guided interview, hidden profile state, material inbox, and weekly brief.
- `lib/domain/demo-state.ts`
  Mock domain logic for profile patches and weekly brief regeneration after new material arrives.
- `tests/`
  Basic domain, UI, and build-script regression coverage.

## Run locally

```bash
pnpm install
pnpm test
pnpm build
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Vercel Demo Deployment

For a stable shareable demo on Vercel, set `DATABASE_URL` before deploying.

- Without `DATABASE_URL`, the app falls back to in-memory demo mode.
- In-memory mode is useful for local iteration, but it is not stable for a shared Vercel demo.
- The UI now surfaces this directly as `Ephemeral demo mode`.

Recommended hosted demo path:

1. Create a Neon Postgres database.
2. Add `DATABASE_URL` in Vercel project environment variables.
3. Run `pnpm db:push` against that database before or during first deploy setup.
4. Deploy to Vercel.
5. Verify:
   - `/api/demo/state`
   - `/api/demo/readiness`
   - `/api/demo/materials`

See [docs/deployment/vercel-demo.md](./docs/deployment/vercel-demo.md).

## Notes

- The default production build uses `next build --webpack`.
- This is intentional for the current scaffold because the default Turbopack build path hit an environment-level process/port restriction during verification.
- The app is still a demo-state scaffold; Auth.js, Drizzle, Neon, Blob, and AI route handlers are documented but not wired yet.
