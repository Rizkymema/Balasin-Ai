# AI Changelog

## 2026-06-17

- Refactored `src/app/(dashboard)/inbox/page.tsx` into a smaller route entry backed by dedicated inbox components.
- Reworked Unified Inbox UI to follow the `dokumen/Inbox.md` three-panel operational layout with richer filters, SLA badges, context panel, and mobile panel switching.
- Added route-level `loading.tsx` and `error.tsx` for safer App Router behavior on the inbox module.
- Preserved existing inbox API actions for reply, notes, seen, status, ticket, and delete while adding safer success/error feedback in the client.

## 2026-06-12

- Created initial project governance documents.
- Defined MVP-first product specification and architecture context.
- Scaffolded Next.js App Router foundation with TypeScript and Tailwind CSS v4.
- Added reusable UI primitives and a responsive product starter page.
- Added setup, deployment, and testing guidance.

