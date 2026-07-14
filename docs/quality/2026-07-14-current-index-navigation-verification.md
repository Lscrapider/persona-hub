# Current Index navigation verification

**Date:** 2026-07-14

## Browser checks

- Before the change, a Current Index click changed the root URL to `/#projects` and left Projects near the viewport top.
- After the change, a normal Current Index click kept the root URL hash empty, smoothly reached Projects, and selected the matching project.
- Reloading that root URL after the Current Index scroll returned to `scrollY = 0` with Projects below the Hero.
- A manually entered `/#projects` fragment still scrolls to Projects. Clicking Current Index afterwards clears that stale fragment and preserves the project scroll.

## Source checks

- `pnpm typecheck`
- `pnpm lint`
- `git diff --check`

No unit test was added because the project requires explicit user approval before creating one.
