# Scra Atlas Foundation and Home Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` to implement this plan task-by-task. Each task requires spec review and code-quality review before the next task. Steps use checkbox syntax for tracking.

**Goal:** Build a production-ready, extensible Next.js foundation and complete the Entry + Home experience from the approved Scra Atlas visual direction.

**Architecture:** Server-render semantic content by default. Isolate interactive Home choreography in a client feature boundary, place reusable motion primitives under `src/effects`, and keep the SVG kinetic field replaceable without changing content or routing. Future modules receive real route boundaries and honest reserved states, not fake completed content.

**Tech Stack:** Next.js App Router, React, TypeScript, Tailwind CSS, CSS custom properties, Motion for React, semantic DOM, SVG.

## Global Constraints

- Work in the current checkout. Do not create a branch, worktree, commit, or push.
- Do not create unit-test files without explicit user approval.
- Verification uses TypeScript, production build, browser inspection, keyboard navigation, responsive screenshots, reduced-motion emulation, and console checks.
- Preserve the current user-owned `AGENTS.md` and all documentation changes.
- Use [the approved Home north star](../design/references/2026-07-10-home-north-star.png) for composition and [the approved palette board](../design/references/2026-07-10-home-palette.png) for color relationships.
- The Home surface is bone white with a near-black kinetic field and sparse terracotta orange signals. Do not use green, cyan, neon, gradient text, glassmorphism, terminal windows, or repeated bordered panels.
- Ordinary text, navigation, metadata, and project lines remain unboxed. Borders are reserved for actual focus or bounded interactive states.
- Final content is readable without animation. `prefers-reduced-motion` and a manual static mode must keep navigation and content complete.
- Do not add Canvas, WebGL, Three.js, GSAP, Lenis, Monaco, a CMS, or a second animation library in this phase.

---

## File Map

```text
package.json                         scripts and dependency contract
next.config.ts                      Next.js configuration
postcss.config.mjs                  Tailwind PostCSS integration
eslint.config.mjs                  ESLint flat config for Next.js and TypeScript
tsconfig.json                       strict TypeScript and path aliases
src/app/layout.tsx                  document shell, fonts, metadata
src/app/page.tsx                    Home server composition
src/app/globals.css                 reset and global imports
src/app/projects/page.tsx           honest reserved module route
src/app/blog/page.tsx               honest reserved module route
src/app/timeline/page.tsx           honest reserved module route
src/app/lab/page.tsx                honest reserved module route
src/assets/fonts/*.woff2            local League Gothic and Manrope Latin fonts
src/assets/fonts/OFL-*.txt          upstream SIL OFL 1.1 license copies
src/content/site.ts                 Home copy, navigation, status, index data
src/core/effect-mode.ts             effect-mode types and persistence rules
src/effects/runtime/EffectMode.tsx   system preference and user mode provider
src/effects/primitives/ScrambleText.tsx
src/features/entry/EntryGate.tsx
src/features/home/HomeExperience.tsx
src/features/home/KineticTypeField.tsx
src/features/home/CurrentIndex.tsx
src/features/home/home.css
src/ui/SiteHeader.tsx
src/ui/ModuleReserved.tsx
src/ui/EffectModeControl.tsx
src/styles/tokens.css                color, type, spacing, motion and layers
src/styles/base.css                  typography, focus and document defaults
docs/credits/2026-07-10-interaction-references.md
docs/DESIGN.md                       extracted implementation design system
```

## Task 1: Scaffold the Next.js Foundation

**Files:**

- Create: `package.json`
- Create: `next.config.ts`
- Create: `postcss.config.mjs`
- Create: `eslint.config.mjs`
- Create: `tsconfig.json`
- Create: `next-env.d.ts`
- Create: `src/app/layout.tsx`
- Create: `src/app/page.tsx`
- Create: `src/app/globals.css`
- Modify: `.gitignore`

**Interfaces:**

- Produces `@/*` mapped to `src/*`.
- Produces scripts `dev`, `build`, `start`, `typecheck`, and `lint`.
- Produces a minimal App Router page that later tasks replace without changing the route contract.

- [ ] **Step 1: Create the minimal package contract**

```json
{
  "name": "scra-atlas",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "typecheck": "tsc --noEmit",
    "lint": "eslint ."
  }
}
```

- [ ] **Step 2: Install only the approved baseline dependencies**

Run:

```bash
pnpm add next react react-dom motion
pnpm add -D typescript @types/node @types/react @types/react-dom tailwindcss @tailwindcss/postcss eslint eslint-config-next
```

Expected: `package.json` and `pnpm-lock.yaml` pin the installed versions; no GSAP, Lenis, Three.js, Canvas helper, or component kit is added.

- [ ] **Step 3: Add strict framework configuration**

`tsconfig.json` must enable `strict`, `noUncheckedIndexedAccess`, `jsx: react-jsx`, Next.js plugins, the `.next/dev/types/**/*.ts` include, and the `@/*` alias. `react-jsx` is the mandatory Next.js 16 contract and prevents `next build` from rewriting the configuration. `next.config.ts` remains minimal. `postcss.config.mjs` loads `@tailwindcss/postcss`. `eslint.config.mjs` uses the ESLint flat config with `eslint-config-next/core-web-vitals` and `eslint-config-next/typescript`.

- [ ] **Step 4: Add the smallest valid App Router shell**

`layout.tsx` exports metadata for `Scra Atlas`, imports `globals.css`, and renders children. `page.tsx` renders a semantic `<main><h1>Scra Atlas</h1></main>` baseline.

- [ ] **Step 5: Verify the scaffold**

Run:

```bash
pnpm run typecheck
pnpm run lint
pnpm run build
```

Expected: all commands exit 0, `next build` leaves `tsconfig.json` unchanged, and the build reports `/` as a valid route.

## Task 2: Establish the Visual System and Shared Shell

**Files:**

- Create: `src/styles/tokens.css`
- Create: `src/styles/base.css`
- Create: `src/content/site.ts`
- Create: `src/ui/SiteHeader.tsx`
- Create: `src/assets/fonts/league-gothic-latin.woff2`
- Create: `src/assets/fonts/manrope-latin-variable.woff2`
- Create: `src/assets/fonts/OFL-League-Gothic.txt`
- Create: `src/assets/fonts/OFL-Manrope.txt`
- Modify: `src/app/globals.css`
- Modify: `src/app/layout.tsx`
- Modify: `docs/credits/2026-07-10-interaction-references.md`

**Interfaces:**

- Produces `siteContent`, `siteNavigation`, `siteStatus`, and `currentIndex` immutable records.
- Produces CSS tokens such as `--color-void`, `--color-bone`, `--color-signal`, `--color-focus`, `--color-muted-text`, `--color-silver`, `--font-display`, `--font-body`, `--font-mono`, and semantic spacing/motion tokens.
- Produces `<SiteHeader />` with working links and no decorative container.

- [ ] **Step 1: Define the content contract**

```ts
export type NavigationItem = {
  label: string;
  href: `/${string}` | '/';
};

export type IndexItem = {
  id: string;
  title: string;
  meta: string;
  href: string;
};
```

Populate real Home copy, four module links, meaningful status fields, and three current-index items from the approved mock. Store the Chinese description as text plus `lang: 'zh-Hans'` so semantic renderers can preserve its language while metadata continues to consume the text value. Do not invent metrics or testimonials.

- [ ] **Step 2: Define the approved palette and type roles**

Use OKLCH tokens with this role structure:

```css
:root {
  --color-void: oklch(0.09 0.006 45);
  --color-bone: oklch(0.96 0.012 75);
  --color-ink: oklch(0.15 0.008 55);
  --color-signal: oklch(0.66 0.17 38);
  --color-focus: oklch(0.56 0.18 38);
  --color-muted-text: oklch(0.53 0.012 55);
  --color-silver: oklch(0.67 0.01 65);
  --color-line: oklch(0.31 0.01 55);
}
```

Store the official Google Fonts Latin WOFF2 files and their OFL 1.1 license copies under `src/assets/fonts/`, record their exact sources in the credits document, and load League Gothic plus Manrope through `next/font/local`. Use a system mono stack for metadata. Chinese body copy falls back to native CJK sans fonts. Builds must not contact Google Fonts.

- [ ] **Step 3: Implement the document and focus baseline**

Set bone as the document background, ink as text, readable selection colors, a dedicated high-contrast `--color-focus` token for visible `:focus-visible`, 44px by 44px minimum touch targets, safe-area padding, and a no-motion fallback. Provide a contrast-compliant `--color-muted-text` for readable secondary copy and reserve `--color-silver` for decoration only. Do not add global card, shadow, or rounded-panel styles.

- [ ] **Step 4: Build the shared header**

Use a semantic `<header>` and `<nav>`. Navigation labels remain ink on hover, focus, and active states; signal orange appears only on the thin locator marker. Exact route matches receive `aria-current="page"`, while nested routes retain only the visual active marker. On narrow screens, wrap or collapse to a simple native disclosure without introducing an oversized drawer UI.

- [ ] **Step 5: Verify the shared shell**

Run `pnpm run lint`, `pnpm run typecheck`, and `pnpm run build`. Also run `pnpm exec next build --webpack` in the default network-restricted sandbox as the explicit offline-font check when Turbopack cannot open its build port inside that sandbox.

Expected: all exit 0; the network-restricted build performs no Google Fonts request and reports no missing font or route errors.

## Task 3: Add the Effect Runtime and Accessible Primitives

**Files:**

- Create: `src/core/effect-mode.ts`
- Create: `src/effects/runtime/EffectMode.tsx`
- Create: `src/effects/primitives/ScrambleText.tsx`
- Create: `src/ui/EffectModeControl.tsx`
- Modify: `src/app/layout.tsx`

**Interfaces:**

- Produces `EffectMode = 'full' | 'reduced' | 'static'`.
- Produces `useEffectMode(): { mode; setMode; systemReduced }`.
- Produces `<ScrambleText text durationMs className />` that renders final accessible text and marks random visual glyphs as decorative.
- Produces `<EffectModeControl />` with explicit labels and persisted user choice.

- [ ] **Step 1: Define deterministic mode resolution**

System reduced motion selects `reduced` unless the user has explicitly selected `static` or `full`. Persist only explicit user choices under `scra-atlas:effect-mode`.

- [ ] **Step 2: Implement the provider with lifecycle cleanup**

Use `matchMedia('(prefers-reduced-motion: reduce)')`, subscribe to changes, and remove the listener on cleanup. Avoid reading `window` during server rendering.

- [ ] **Step 3: Implement accessible scramble text**

The final text must exist as a stable screen-reader string. Random glyphs are a separate `aria-hidden` visual layer, preserve whitespace and punctuation, finish within 300–700 ms, and skip entirely outside `full` mode.

- [ ] **Step 4: Implement the mode control**

Use a compact text control, not a boxed settings panel. Labels are `FULL`, `REDUCED`, and `STATIC`; focus and active state use a small orange marker.

- [ ] **Step 5: Verify mode behavior**

Run `pnpm run typecheck` and `pnpm run build`.

Expected: both exit 0; server rendering does not reference `window` or `localStorage` during build.

## Task 4: Build Entry and the Home Kinetic Scene

**Files:**

- Create: `src/core/entry.ts`
- Create: `src/features/entry/EntryGate.tsx`
- Create: `src/features/home/HomeExperience.tsx`
- Create: `src/features/home/KineticTypeField.tsx`
- Create: `src/features/home/home.css`
- Modify: `src/app/layout.tsx`
- Modify: `src/app/page.tsx`

**Interfaces:**

- Produces a shared Entry storage key and an inline server-page bootstrap that resolves first-visit visibility before first paint.
- Produces `<EntryGate onEnter focusTargetRef />` with a session-scoped first-visit ritual, immediate skip, idempotent completion, and conditional focus handoff.
- Produces `<KineticTypeField mode />` with decorative SVG path text and no semantic duplication.
- Produces `<HomeExperience />` as the only Home client-composition boundary.

- [ ] **Step 1: Build the non-blocking Entry state**

The Entry layer shows `SCRA ATLAS`, `ARCHIVE READY`, and `ENTER ARCHIVE`. It completes in at most 1400 ms, has a visible skip action, does not run on direct child routes, and stores completion in `sessionStorage`.

The root `<html>` defaults to `data-entry-ritual="skip"`. Before first paint, the Home server page runs a small inline bootstrap that reads the shared Entry session key and explicit effect-mode storage key. First visits outside static mode set `data-entry-ritual="show"`; return visits and static mode keep `skip`. When storage throws but JavaScript is available, treat the visit as a first visit. With JavaScript disabled, the default `skip` keeps Home readable and prevents a permanent overlay.

While Entry is shown, hide the shared header, semantic Home information, and effect control with `visibility: hidden` so only visible Entry actions participate in keyboard and accessibility navigation. Completion first restores the root to `skip`, persists the session, clears pending timers, and runs once. Transfer focus to the Home archive action only when focus was inside Entry at completion; otherwise preserve the user's current focus.

- [ ] **Step 2: Build semantic Home content first**

Render the stable title, English signature, Chinese supporting line, status metadata, navigation, and action before mounting the decorative scene. All text remains readable in static mode.

- [ ] **Step 3: Implement the SVG kinetic field**

Use an `aria-hidden` SVG with a small fixed number of paths and repeated archive terms. Animate path offset, local emphasis, and a single locator line using Motion values. Do not render thousands of DOM nodes or permanent requestAnimationFrame loops.

- [ ] **Step 4: Match the approved asymmetric composition**

Desktop uses a bone information plane and a large near-black field that curves or clips into the right side. Mobile stacks the dark field beneath the primary identity and reduces word density. Do not create framed status panels or project cards.

- [ ] **Step 5: Implement reduced and static compositions**

Reduced mode uses one short opacity/clip entrance and no continuous path movement. Static mode renders the approved final-frame composition immediately.

- [ ] **Step 6: Verify the Home build**

Run:

```bash
pnpm run typecheck
pnpm run build
```

Expected: both exit 0; `/` renders without hydration errors.

## Task 5: Add Current Index and Honest Future-Module Routes

**Files:**

- Create: `src/features/home/CurrentIndex.tsx`
- Create: `src/ui/ModuleReserved.tsx`
- Create: `src/app/projects/page.tsx`
- Create: `src/app/blog/page.tsx`
- Create: `src/app/timeline/page.tsx`
- Create: `src/app/lab/page.tsx`
- Modify: `src/content/site.ts`
- Modify: `src/features/home/HomeExperience.tsx`
- Modify: `src/features/home/home.css`
- Modify: `src/app/layout.tsx`
- Modify: `src/effects/runtime/EffectMode.tsx`
- Modify: `src/styles/base.css`
- Modify: `src/app/globals.css`

**Interfaces:**

- Produces `<CurrentIndex items />` as an unboxed ordered list.
- Produces `<ModuleReserved moduleName summary nextStep />` for truthful route states.
- Makes every Home navigation target valid at the module-route level without claiming unfinished entries or fragments are complete.
- Produces a root title template and distinct metadata for every reserved module route.
- Mirrors the resolved effect mode to the root element so manual reduced and static modes share the system reduced-motion scroll behavior.

- [ ] **Step 1: Build the Current Index**

Use semantic ordered-list markup. Each row contains index, title, and metadata separated through alignment and one-pixel rules. Hover/focus uses a short orange locator line, not a bordered card.

- [ ] **Step 2: Build the reserved-state primitive**

Each reserved route names the module, explains its purpose in one sentence, provides a link back to Home, and uses the shared shell. Do not add fake article counts, project data, terminal output, or disabled controls.

- [ ] **Step 3: Connect route navigation, metadata, and active states**

All header and index links must resolve. Until individual entries exist, Current Index rows link to their real module route and do not fabricate fragments or empty targets. Route-level active markers are derived from the current pathname, use the dedicated high-contrast focus color, and remain keyboard visible. The root metadata defines the site-name default and title template; each reserved route exports a distinct title and truthful description.

- [ ] **Step 4: Synchronize effect-mode document behavior**

Server-render the root with `data-effect-mode="reduced"`, then synchronize the resolved provider mode to that root dataset with guarded cleanup. Disable smooth scrolling for root reduced and static modes in addition to the system `prefers-reduced-motion` fallback.

- [ ] **Step 5: Verify all routes**

Run `pnpm run typecheck` and `pnpm run build`.

Expected: build output includes `/`, `/projects`, `/blog`, `/timeline`, and `/lab` with no errors.

## Task 6: Browser QA, Visual Iteration, and Design Documentation

**Files:**

- Modify as needed: `src/features/home/home.css`
- Modify as needed: `src/styles/tokens.css`
- Modify as needed: `src/styles/base.css`
- Create: `docs/DESIGN.md`
- Modify: `docs/README.md`

**Interfaces:**

- Produces a visually inspected Home implementation.
- Produces the implementation-derived design-system document without changing product direction.

- [ ] **Step 1: Start the app and inspect desktop**

Run `pnpm run dev`. Inspect at 1440×900 and 1280×800. Capture screenshots and read them back. Check hierarchy, curved field silhouette, orange dosage, type overflow, unboxed composition, hover, focus, Entry, and Current Index.

- [ ] **Step 2: Inspect responsive and input states**

Inspect at 390×844, 360×800, and one short landscape viewport. Verify keyboard-only navigation, touch-sized targets, no hover-only data, safe areas, and no horizontal overflow.

- [ ] **Step 3: Inspect motion modes and failure behavior**

Verify full, reduced, and static. Emulate `prefers-reduced-motion`, switch modes during animation, reload, and navigate away/back. Confirm no locked scroll, transparent content, stale animation frame, or console error.

- [ ] **Step 4: Run an honest design critique and patch material defects**

Compare the result against the approved north star. Patch only visible defects in composition, hierarchy, typography, contrast, timing, responsive behavior, and focus treatment. Reinspect every changed viewport.

- [ ] **Step 5: Write the extracted design system**

Create `docs/DESIGN.md` from the actual tokens and components. Document palette, typography, elevation strategy, navigation, mode control, Current Index, and strict do/don't rules. Link it from `docs/README.md`.

- [ ] **Step 6: Run final verification**

Run:

```bash
pnpm run typecheck
pnpm run lint
pnpm run build
```

Expected: all commands exit 0. Browser console has no errors at the inspected routes and modes.

## Plan Self-Review

- Spec coverage: foundation, Entry, Home, project index preview, route boundaries, effect modes, accessibility, performance isolation, and visual QA are each assigned to a task.
- Scope: Projects, Blog, Timeline, and Lab receive route contracts only; their full features are explicitly outside this plan.
- Type consistency: `EffectMode`, `SceneContext` responsibilities, content records, and component outputs have one owner each.
- Framework consistency: Task 1 uses the Next.js 16 mandatory `jsx: react-jsx` contract and includes generated development route types, so builds do not rewrite `tsconfig.json`.
- Constraint compliance: no unit tests, Git operations, Canvas/WebGL, duplicated motion libraries, fake content, or boxed text composition are introduced.
