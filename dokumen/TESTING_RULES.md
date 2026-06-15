# Testing Rules

## Required Checks For This Repository

- `npm run lint`
- `npm run typecheck`
- `npm run build`

## Manual QA Baseline

- Verify the page loads without runtime errors.
- Verify layout remains readable on mobile width.
- Verify key sections have consistent spacing and hierarchy.
- Verify buttons and interactive-looking elements have visible focus treatment.
- Verify no placeholder secrets appear in source output.

## Future Testing Standards

- Add unit tests for utility functions and service helpers.
- Add component tests for reusable UI primitives.
- Add end-to-end tests for onboarding and dashboard workflows.
- Add accessibility checks for keyboard navigation and contrast.

## Regression Rules

- Do not merge structural UI changes without re-running lint, typecheck, and build.
- If a bug is fixed, add the scenario to manual QA or automated coverage where practical.
