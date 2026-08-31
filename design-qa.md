# Design QA — Persona Hub “Card Throw”

Date: 2026-07-28  
final result: passed

## Source of truth

- Homepage direction: `docs/design/assets/homepage-direction-02.png` (`1487 × 1058`)
- Card transition direction: `docs/design/assets/card-transition-direction-03.png` (`1487 × 1058`)
- Product specification: `docs/superpowers/specs/2026-07-27-card-throw-portfolio-design.md`

The accepted direction is treated as art direction rather than a literal flattened
page: the character stage, Three.js card, DOM navigation, and route transition
remain independently controllable.

## Verification setup

- Runtime: Next.js 16 / React 19 development preview
- Browser: Codex in-app browser
- Primary desktop viewport: `1920 × 1080`
- Large desktop viewport: `2560 × 1440`
- Source-matching viewport: `1440 × 1024`
- Browser DPR during QA: `1`
- WebGL canvas at the 2K checkpoint: `2560 × 1440`
- Primary states: homepage ready, card throw at 640 ms, project route settled,
  About open, Contact open

## Visual evidence

### Full homepage comparison

- Combined source/implementation image:
  `/private/tmp/persona-hub-home-comparison-final.png`
- Source is on the left; implementation is on the right.
- Both sides were normalized to `1440 × 1024` before being placed into the
  same comparison image.
- Final standalone implementation:
  `/private/tmp/persona-hub-home-1440x1024-final.png`

Result: the black / crimson / warm-print hierarchy, reaching character pose,
single-project message, top navigation, and foreground project card match the
accepted composition. The runtime card stays independent from the character
image so it can move in real 3D.

### Focused transition comparison

- Combined source/implementation image:
  `/private/tmp/persona-hub-transition-comparison-final.png`
- Source is on the left; implementation is on the right.
- Both sides were normalized to `1440 × 1024`.
- Implementation frame captured 640 ms after the primary action:
  `/private/tmp/persona-hub-transition-1440x1024-final.png`

Result: the card reaches the intended dominant perspective scale before
becoming the project page. The route settles at `/work/urban-sidequest` after
the reveal without a black intermediate gap.

### Desktop responsive evidence

- `1920 × 1080`: `/private/tmp/persona-hub-home-1920x1080-final.png`
- `2560 × 1440`: `/private/tmp/persona-hub-home-2560x1440-final.png`

At `2560 × 1440`, `scrollWidth === clientWidth` and
`scrollHeight === clientHeight`; the hero produces no unintended page
overflow. The heading remains a deliberate two-line lockup at both desktop
targets.

## Interaction evidence

- Primary card / CTA is a real link with the accessible name
  `Throw the card to enter 城市副本`.
- Throwing the card lands on `/work/urban-sidequest`; the settled page exposes
  the `Urban Sidequest` heading and a normal semantic case-study document.
- About and Contact open as complementary panels.
- Contact exposes a real `OPEN GITHUB` link.
- Escape closes either information panel.
- The project page remains directly addressable and has a real return link.

## Iteration history

| Priority | Finding | Resolution |
| --- | --- | --- |
| P1 | WebGL background appeared as a shrunken rectangle with visible seams. | Moved the stage plane to its intended depth and sized it from the active R3F viewport. |
| P1 | The real Three.js card could disappear after the static fallback faded. | Delayed `sceneReady` until the loaded scene had committed a frame. |
| P1 | The transition briefly showed an empty black frame. | Started the DOM card visible and retimed the WebGL-to-DOM handoff. |
| P2 | The card felt too small and flat on desktop. | Increased its idle scale, perspective tilt, border backing, and throw scale. |
| P2 | The 2K heading could wrap into an unintended third line. | Locked each display line and recalibrated desktop width and type scale. |
| P2 | Text glyphs were used for interface arrows. | Replaced them with Phosphor icons. |

## Accepted residuals

- The prototype uses a generated, optimized character stage rather than the
  planned rigged GLB character. Character skeletal motion is the next model
  production pass, not a blocker for validating the card interaction.
- The card surface uses an abstract project texture so the homepage does not
  depend on photos from other projects.
- React Three Fiber currently emits Three.js's non-blocking `THREE.Clock`
  deprecation warning in development. No application errors were present in the
  fresh final browser session.

## Build verification

- `pnpm exec next typegen` — passed
- `pnpm typecheck` — passed
- `pnpm lint` — passed
- `pnpm build` — passed
- Browser DOM, route transition, panel interaction, console, and desktop
  overflow checks — passed
