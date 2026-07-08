# Scra Atlas Homepage Design

## Summary

Scra Atlas is a personal homepage presented as a small interactive star atlas. It collects projects, links, and a quiet credit note without exposing personal information. The page should feel cinematic and technical, but the writing should stay grounded: cool, not self-important.

The strongest references are:

- Trionn: dark technical atmosphere, mouse-reactive central object, scroll-driven scene changes.
- The Content Architecture: large-scale scroll narrative, cosmic text field, real system interface after the hero.
- Santioni Spirits: strong mode switch between an immersive experience and a focused collection view.
- Instorier is a negative reference: avoid text pasted over visuals without interaction logic.

## Goals

- Build a distinctive personal homepage with a strong first impression.
- Present current and future projects as celestial objects.
- Make GitHub a primary navigation target, not a footer afterthought.
- Keep the content anonymous and concise.
- Support future growth from 2 projects to a larger catalog.

## Non-Goals

- Do not present the user as an expert celebrity, studio, or public persona.
- Do not include personal identity details.
- Do not build a traditional blog layout for the first version.
- Do not make decorative animation that has no effect on discovery or navigation.
- Do not require project screenshots for the first version.

## Voice

Primary language: English and codenames.

Chinese appears only in project detail text where it is useful for clarity.

Tone examples:

- `Scra Atlas`
- `A small atlas for projects, ideas, and links.`
- `Signals collected. Orbits still forming.`

Avoid grandiose copy such as claiming the page is world-class, revolutionary, or built by a top-tier expert.

## Content Model

### Identity

- Name: `Scra Atlas`
- Description: `A small atlas for projects, ideas, and links.`

### GitHub

- Label: `OBSERVATORY / GITHUB`
- URL: `https://github.com/Lscrapider`
- Behavior: primary external link.
- Hover copy: `source signals / public repositories / active work`

### Project 1

- Codename: `MINT-01`
- Chinese detail name: `理财投资AI知识库`
- One-line description: `一个整理理财投资相关内容的 AI 知识库入口。`
- Celestial type: `Knowledge Planet`
- Celestial description: `A stable knowledge planet collecting finance-related signals.`
- URL: `http://152.136.174.90/finance/`
- Future note: URL may later be replaced by a domain.

### Project 2

- Codename: `DARK NODE`
- Chinese detail name: `开发中项目`
- One-line description: `还在构建中，暂时只保留一个轨道位置。`
- Celestial type: `Under Construction`
- Celestial description: `A dim node with an orbit still being calibrated.`
- URL state: `Coming soon`

### Credits

- Label: `THANKS`
- Text: `Codex / Claude`
- Hover copy: `helped shape this atlas.`
- Placement: low-emphasis node in the Index view, or small satellite nodes at the edge of the Orbit view.

## Information Architecture

The homepage has two primary modes.

### Orbit Mode

The default immersive view.

- Central celestial object, inspired by a star, planet, or compact nebula.
- Project nodes orbit around the central object.
- GitHub appears as a fixed observatory node.
- Mouse movement gently affects orbital lines, particles, and node emphasis.
- Scroll advances the scene rather than simply moving to the next static section.

### Index Mode

A clear catalog view for links and future growth.

- Lists projects in a compact, readable structure.
- Includes GitHub as a primary action.
- Includes the low-emphasis thanks note.
- Supports more projects later without redesigning the whole site.

## Main Interaction Flow

1. Landing
   - The page opens on a dark cosmic field.
   - `SCRA ATLAS` and a short description appear.
   - The central celestial object is visible but not overwhelming.
   - GitHub is available immediately.

2. Mouse movement
   - Cursor proximity pulls or brightens nearby orbit lines.
   - Project nodes respond with a subtle glow or label reveal.
   - The response must help identify clickable elements.

3. Scroll progression
   - Scroll gradually shifts the scene from distant atlas to project orbit.
   - Project nodes become clearer as the user scrolls.
   - The motion should feel like moving through the same system, not jumping between unrelated sections.

4. Project selection
   - Clicking a project opens Collection Stage.
   - The chosen project becomes the center object.
   - Large background text shows the codename or celestial type.
   - The detail panel shows Chinese project name, one-line description, and link.

5. Mode switch
   - A top-right or top-level segmented control switches between `Orbit` and `Index`.
   - Switching modes changes the browsing model, similar to Santioni's Experience / Collection split.

## Visual Direction

- Dark spatial base, close to black, with controlled highlights.
- Avoid a single-hue blue/purple-only theme.
- Use one strong accent for active nodes, such as electric cyan, acidic green, or signal red.
- Use a second restrained accent only for project state or hover.
- Typography should mix clean interface text with one expressive display treatment for `Scra Atlas` and project codenames.
- Do not use gradient text.
- Do not use decorative glass cards.
- Do not rely on huge blocks of overlaid text on top of visuals.

## Motion Direction

- Use scroll as a camera and state driver.
- Use mouse movement for local reaction, not random decoration.
- Use click to commit to a project or external link.
- Provide reduced-motion behavior:
  - Static star field.
  - Simple fades for project selection.
  - No required parallax or continuous camera movement.

## Responsive Behavior

Desktop:

- Full interactive Orbit Mode.
- Mouse-driven line and node response.
- Collection Stage can use side controls or large project typography.

Mobile:

- Touch-friendly orbit with simplified motion.
- Project nodes become a vertical orbital list or carousel.
- Index Mode remains easy to reach.
- No text should depend on hover-only discovery.

## Implementation Notes

This spec does not require a specific stack yet. The likely implementation should use:

- A modern frontend app scaffold.
- Three.js or a canvas/WebGL layer for the star atlas if the implementation budget allows it.
- GSAP or a similar animation system for scroll-driven state.
- Plain data objects for projects and links so future items are easy to add.

If the first implementation needs to ship faster, use CSS/canvas for the first version and keep the data and interaction model compatible with a later Three.js upgrade.

## Acceptance Criteria

- The first viewport clearly says `Scra Atlas`.
- GitHub is visible as a primary action.
- The two current projects exist as celestial nodes.
- `MINT-01` links to `http://152.136.174.90/finance/`.
- `DARK NODE` is clearly marked as coming soon.
- Project detail includes Chinese text only inside detail content.
- Orbit and Index modes both exist.
- Mouse, scroll, and click interactions each serve a navigation or discovery purpose.
- The page does not feel like a generic landing page with static text over a background.
- The credits to Codex and Claude are present but low-emphasis.
