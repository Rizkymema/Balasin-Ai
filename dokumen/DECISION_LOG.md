# Decision Log

## 2026-06-12 - Use Next.js App Router as primary web architecture

### Decision

Use Next.js with App Router, React, and TypeScript as the main frontend architecture.

### Reason

- Matches the requested stack
- Strong fit for SaaS dashboard and public product pages
- Good long-term path for server components, route handlers, and future auth integration

### Consequence

- Source structure is organized around `src/app`
- Server/client boundaries should remain intentional

## 2026-06-12 - Start with MVP V1 framing

### Decision

Anchor the initial scaffold to MVP V1: dashboard foundation, AI setup visibility, unified inbox direction, and website chat plus WhatsApp readiness.

### Reason

- Reduces scope risk
- Aligns with the concept roadmap
- Makes future implementation increments clearer

### Consequence

- Current UI is a foundation, not a full feature-complete platform
- Backend integrations remain explicit placeholders

## 2026-06-12 - Use token-based styling with Tailwind CSS v4

### Decision

Use Tailwind CSS v4 plus CSS variables for design tokens.

### Reason

- Fast iteration
- Clear theme structure
- Easy reuse across components and pages

### Consequence

- Visual consistency should come from tokens and primitives
- Avoid scattered one-off styling patterns

## 2026-06-17 - Keep Inbox backend contract stable while upgrading the UI

### Decision

Refactor the Unified Inbox page into dedicated presentation components and keep all existing inbox route handlers and service contracts unchanged.

### Reason

- The inbox screen already had working reply and status actions that should not be destabilized.
- The requested revision focused on making the feature closer to the `dokumen/Inbox.md` operational model without rewriting backend behavior.
- Splitting the page reduces maintenance risk and makes future enhancements like assignment, snooze, and realtime sockets easier to add.

### Consequence

- UI now maps richer operational labels from the existing status model instead of introducing new backend enums immediately.
- Future backend enhancements can plug into the current panel structure without another large page rewrite.
