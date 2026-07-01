    # AGENTS.md

## Working Agreement

This repository is maintained as a professional product foundation, not a disposable prototype.

## Engineering Standards

- Use Next.js App Router and keep server/client boundaries explicit.
- Prefer small reusable components over large page files.
- Keep source under `src/` organized by concern.
- Use TypeScript with clear types and descriptive names.
- Avoid hardcoded values that belong in constants or configuration.
- Use environment variables for any sensitive or deployment-specific values.

## UI And UX Standards

- Maintain a modern SaaS visual system with strong hierarchy and clean density.
- Reuse primitives such as button, badge, card, and section heading.
- Preserve responsive behavior for mobile, tablet, and desktop.
- Include empty, loading, error, and success states when features become interactive.

## Documentation Standards

- Update `CHANGELOG_AI.md` for AI-assisted implementation changes.
- Log meaningful architectural choices in `DECISION_LOG.md`.
- Track work status in `TASK.md` and `TASK_QUEUE.md`.
- Record recurring failures or verification issues in `ERROR_LOG.md`.

## Safe Change Rules

- Do not commit secrets.
- Do not add dependencies without a clear reason.
- Do not introduce backend or auth assumptions as if they are final.
- Keep placeholders explicit when functionality is not yet implemented.

## Expected Near-Term Evolution

- Auth and workspace onboarding
- Knowledge base ingestion flow
- Live omnichannel inbox
- Channel connection settings
- Analytics and operational reports
