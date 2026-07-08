# Scra Atlas Cosmic Narrative

Status: current direction record.

## Direction

Scra Atlas uses a shader-led cosmic narrative:

- The homepage is a soft, blurred nebula field.
- Each project is shown as a concrete, irregular nebula scene occupying one side of the viewport.
- Project information occupies the opposite side.
- Project pages alternate left and right.
- Fast deep-space fly-through transitions connect the homepage, projects, and future placeholder.

## Visual Roles

- Shader: nebula field, project-specific irregular nebula concentration, dust, far-point arrival, low-level pointer response.
- Canvas: z-depth starfield fly-through. Stars project from x/y/z into screen space and draw previous-to-current positions as scroll-driven streaks.
- DOM/CSS: text hierarchy, links, project metadata, labels, layout, responsive behavior.
- Assets: optional boot, fallback, and overlay material.

## Implementation Rules

- Homepage shader state should read as distant, soft, low-contrast cosmic fog.
- Project shader state should create localized nebulae with domain warp, soft masks, broken edges, and per-project seed/palette.
- Transition state should behave like camera movement along the z axis: stars stretch outward with perspective from scroll progress, the old nebula falls away, and the next nebula appears from a far point before stabilizing.
- Transit stars should not animate as an autonomous data stream. Their apparent movement should come from scroll-driven z-depth projection.
- Project nebulae must not sit inside cards, glass containers, stroked boxes, or framed plates.
- Avoid circular wormholes, concentric tunnels, regular geometric tubes, horizontal light beams, cyberpunk neon treatment, and static-only backgrounds.

## Acceptance

- The page should visibly feel like a digital star atlas, not an empty black screen.
- Project sections should read as full pages, not small cards.
- The nebula area should be more specific on project pages than on the homepage.
- Transitions should feel fast and deep, with zoom push, distance, and depth-of-field rather than a fixed tunnel model.
- Reduced-motion mode should remove travel intensity while keeping readable static sections.
