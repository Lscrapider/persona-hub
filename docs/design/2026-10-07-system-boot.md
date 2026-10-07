# Archive system boot

The approved direction is a full-screen system coming online: modules enter from opposing edges, archive records register, display resources settle, and the interface opens into the existing page. Black, bone and copper remain owned by the global tokens; League Gothic carries short system headings, Manrope carries record titles, and the existing mono face carries counts and status labels.

The desktop layout distributes activity across a three-column workspace and the top/bottom edges. On narrow screens the current operation spans the top, with archive/resource modules below. Framing consists of meaningful list separators and four discrete checkpoint marks. Actual record names and counts come from the selected, server-validated language package. The source manifests are not fetched again by the browser.

## Sequence and readiness

- Client mount claims the bootstrap fallback and installs a root-attribute observer.
- The interface connects; Timeline, Projects and Logs register in sequence.
- Fonts use `document.fonts.ready` plus availability checks for the two local families.
- The existing ArchiveWebGLStage prepares a single frame while the archive is inert. Its `ready`, `fallback` or `lost` state settles the scene check. Distant Timeline and Project scenes remain lazy and are not required for entry.
- Once the 2.4-second presentation interval and resource checks have settled, the ready state holds for 650ms. A 650ms handoff withdraws the modules and separates the two cover surfaces, exposing the page while keeping it inert until completion.

The normal sequence lasts about 3.7 seconds after mount. Resource waiting ends at 4.3 seconds, giving a maximum sequence of about 5.6 seconds. The bootstrap independently unlocks after 1.8 seconds if hydration never claims it; after the claim its 6.5-second watchdog remains bounded. React observes that unlock so CSS visibility and interaction state cannot diverge.

Skip, direct entry and Escape complete immediately. Tab stays inside the dialog, and dialog focus transfers to the archive action on completion. Every normal site entry or document refresh starts a new boot sequence, including after the previous visit was skipped. `/` and `/en` need no special query parameter, and session storage does not suppress playback. STATIC and system reduced motion bypass the intro.

The loader uses discrete React updates and CSS transform/opacity choreography. The prepared WebGL renderer resumes without recreating its context when the cover ends. Its existing hidden-document, resize, disposal and fallback behavior remains in charge of the scene.

## Visual reference provenance

The implementation is original DOM/CSS and project-owned rendering code. These original creators informed sequencing and visual organization; their footage, logos, graphics and source code are not shipped in the site.

- [José Carlos Martínez — Valkyrie HUD](https://jcmartinez.artstation.com/projects/68nJxW): module activation, distributed boot state and transition into an operating interface.
- [Matt Williams — Map Warpr](https://mattwilliams.design/mapwarpr): web boot sequence leading to a working content surface.
- [GMUNK — Oblivion GFX](https://gmunk.com/OBLIVION-GFX): purpose-led functional regions and consistent screen typography.
