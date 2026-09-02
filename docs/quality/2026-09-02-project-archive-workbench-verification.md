# Project Archive Workbench Verification

**Date:** 2026-09-02  
**Scope:** `src/features/projects`, localized project content, project WebGL anchors

## Outcome

The approved filesystem → document → projects desktop layout is implemented. All rendered files open a matching local document and exact GitHub source URL. Small screens use projects → filesystem → document natural flow.

## Static verification

- `pnpm typecheck`: exit `0`.
- `pnpm lint`: exit `0`, with `136` pre-existing warnings in `.claude/skills/impeccable` and `src/effects/physics/usePhysicalGesture.ts`; no warnings were reported for the changed Projects files.
- `pnpm build`: exit `0`; all eight static pages generated. Turbopack retains the existing NFT trace warning caused by filesystem access through `src/lib/content/archive.ts`.
- `git diff --check`: exit `0`.
- Impeccable layout detector for `src/features/projects`: `[]`.

The workspace Node version is `24.16.0`; the package requests `>=22.18 <23`, so pnpm prints the existing engine warning while all commands still exit successfully.

## Interaction verification

Browser automation opened every curated file and compared the active tab, selected tree row, document title, live-region announcement, and decoded GitHub URL.

- Financial Management AI: `7/7` files passed.
- Urban Sidequest: `7/7` files passed.
- Scrapider Guidelines: `8/8` files passed.
- Total: `22/22`, `0` failures.

Additional checks:

- changing from a non-default file in project `01` to project `02` opened `README.md`;
- all Urban Sidequest folders started open and the native `docs` disclosure closed correctly;
- English mode opened `references/java/spring-boot-backend.md`, rendered `Spring Boot Backend`, and produced the English source action;
- a fresh browser tab reported no console warnings or errors after project and file selection.

## Responsive geometry

All measurements reported zero positive page-level horizontal overflow and the expected visual order.

| Viewport | Pane order | Filesystem / document / projects widths | Header gap |
| --- | --- | --- | --- |
| `1440 × 900` | left / centre / right | `291 / 762 / 255` | `32px` |
| `1280 × 720` | left / centre / right | `258 / 676 / 226` | `32px` |
| `1024 × 768` | left / centre / right | `200 / 533 / 192` | `32px` |
| `768 × 1024` | projects / filesystem / document | `692 / 692 / 692` | `32px` |
| `390 × 844` | projects / filesystem / document | `343 / 343 / 343` | `32px` |

## Semantic WebGL mapping

At `1280 × 720`, the runtime reported `data-webgl-stage="ready"` and measured:

- `3` project-choice anchors;
- `1` active document-tab anchor;
- `7` active-project file anchors;
- selected project x-position `987.34`;
- document-tab x-position `361.61`;
- selected-file x-position `309.10`.

The ordered coordinates confirm the intended right → centre → left route. WebGL remains decorative; all required controls and content are native DOM.
