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
