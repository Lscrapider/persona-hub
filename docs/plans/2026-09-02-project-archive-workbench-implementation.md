# Project Archive Workbench Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` when repository permissions allow it. In this workspace, execute inline because the project forbids unapproved branches, commits, and unit-test creation.

**Goal:** Build the approved three-column project workbench with an interactive filesystem, source-informed document reader, right-side project switcher, and semantic WebGL routing.

**Architecture:** Extend each localized `ProjectRecord` with curated `documents`, derive the visible filesystem from document paths, and keep selected-project ownership in `HomeExperience`. `ProjectExplorer` owns only the selected document for its currently mounted project; `ProjectsSection` keys it by project ID so a project change deterministically resets to the first README. The existing global WebGL Projects scene measures project, tab, and file DOM anchors and draws the right-to-centre-to-left relationship.

**Tech Stack:** Next.js 16.2, React 19.2, TypeScript 5.9, semantic HTML, CSS Grid, native `details`, existing WebGL2 runtime.

**Spec:** `docs/design/2026-09-02-project-archive-workbench.md`

## Global Constraints

- Desktop pane order is filesystem, document, projects.
- Every rendered file is an operable button with a corresponding document.
- Project changes open the new project's first README document.
- Use “Skill”, never “Codex Skill”, in site copy.
- Do not add dependencies, runtime GitHub requests, random decorative geometry, nested vertical scrolling, scroll lock, or forced paging.
- Preserve the current color and typography identity.
- Preserve STATIC, reduced-motion, keyboard, and screen-reader behavior.
- Do not create unit tests, branches, commits, or pushes without explicit user approval.
- Verification uses content validation, typecheck, lint, build, browser interaction, responsive measurements, and console inspection.

---

### Task 1: Add the localized project-document contract

**Files:**
- Modify: `src/lib/content/types.ts`
- Modify: `src/lib/content/archive.ts`
- Modify: `src/content/zh/projects.json`
- Modify: `src/content/en/projects.json`

**Interfaces:**
- Produces: `ProjectDocument`, `{ path, title, summary, blocks }`, and `ProjectRecord.documents`.
- Reuses: the existing `MarkdownBlock` union for headings, paragraphs, lists, quotes, code, and rules.

- [ ] **Step 1: Define the document type before `ProjectRecord`**

```ts
export type ProjectDocument = Readonly<{
  blocks: readonly MarkdownBlock[];
  path: string;
  summary: string;
  title: string;
}>;
```

Move `MarkdownBlock` above `ProjectDocument`, then add `documents: readonly ProjectDocument[]` to `ProjectRecord`.

- [ ] **Step 2: Validate every document field and block**

Add `validateProjectDocument()` beside `validateProjectRecord()`. Reuse the log block validation rules, require a non-empty `.md` path, and return validated `blocks`, `path`, `summary`, and `title`. Map `record.documents` through it inside `validateProjectRecord()`.

- [ ] **Step 3: Add the approved 22 localized documents**

Store the exact GitHub paths from the spec. Each document contains a concise summary plus at least one structured block. Architecture documents include code blocks for their data flow where useful.

- [ ] **Step 4: Verify content loading**

Run `pnpm typecheck`. Expected: no content validator or type errors.

---

### Task 2: Build the interactive filesystem and document reader

**Files:**
- Modify: `src/features/projects/ProjectTree.tsx`
- Create: `src/features/projects/ProjectDocument.tsx`
- Modify: `src/features/projects/ProjectExplorer.tsx`
- Modify: `src/features/projects/ProjectsSection.tsx`

**Interfaces:**
- `ProjectTree({ activePath, documents, onOpenDocument, projectId })`
- `ProjectDocumentView({ document, project, sourceUrl })`
- `ProjectExplorer` remains controlled by `selectedProjectId` and `onSelectProject`.

- [ ] **Step 1: Derive a nested tree from document paths**

Implement a local `FileTreeNode` union and `buildFileTree(documents)` in `ProjectTree.tsx`. Folder nodes render as open native `details`; file nodes render buttons with `aria-pressed`, `data-document-path`, `data-runtime-target`, and `data-webgl-anchor="project-node"`.

- [ ] **Step 2: Render the active document**

`ProjectDocument.tsx` maps every `MarkdownBlock` variant to semantic HTML. Its article is keyed by document path, the tab carries `data-webgl-anchor="project-detail"`, and its GitHub link targets the exact file path.

- [ ] **Step 3: Recompose `ProjectExplorer` in approved DOM order**

```tsx
<div className="project-explorer">
  <aside className="project-explorer__filesystem">...</aside>
  <ProjectDocumentView ... />
  <aside className="project-explorer__projects">...</aside>
</div>
```

Initialize local document state from `selectedProject.documents[0]`. Project buttons retain the parent-controlled selection contract and carry the project-choice WebGL anchor.

- [ ] **Step 4: Reset file state on project change without an effect**

Key `ProjectExplorer` by `selectedProjectId ?? "default-project"` in `ProjectsSection`. This remounts only the project workspace and opens the new default README.

- [ ] **Step 5: Verify compile contracts**

Run `pnpm typecheck` and `pnpm lint`. Expected: both exit 0.

---

### Task 3: Apply the workbench layout and semantic motion

**Files:**
- Modify: `src/features/projects/projects.css`
- Modify: `src/effects/webgl/useArchiveMotionController.ts`

**Interfaces:**
- Desktop grid: `minmax(14rem, .82fr) minmax(24rem, 2.15fr) minmax(12rem, .72fr)`.
- WebGL route: active project left edge → active tab centre → filesystem file right edges.

- [ ] **Step 1: Replace the oversized two-column CSS**

Use a compact section header followed by the three-pane grid. Left and right panes use the void panel surface and hairline borders; the centre pane uses the reading surface. Selected rows use the terracotta signal and never rely on color alone.

- [ ] **Step 2: Add meaningful transition states**

Project remount animates repository load once. File selection animates the active row, tab line, and document blocks. All animation uses transform, opacity, clip-path, or existing custom properties and is removed in STATIC/reduced-motion modes.

- [ ] **Step 3: Reorient WebGL anchor measurements**

In `measureSemantics()`, measure project choices from their left edge, the active document tab from its centre, and filesystem nodes from their right edge. The existing shader then represents repository → document → file relationships in the approved physical order.

- [ ] **Step 4: Add the mobile natural-flow layout**

At `52rem` and below, use one column with project switcher first, filesystem second, and document third. Remove equal-height assumptions and keep all panes in page flow.

- [ ] **Step 5: Run static verification**

Run `pnpm typecheck`, `pnpm lint`, `pnpm build`, and `git diff --check`. Expected: all exit 0.

---

### Task 4: Complete browser and responsive verification

**Files:**
- Create: `docs/quality/2026-09-02-project-archive-workbench-verification.md`

**Interfaces:**
- Records viewport, interaction, accessibility, console, and overflow evidence.

- [ ] **Step 1: Verify all documents**

At desktop width, select each of the three projects and open every visible file. Require 22/22 path, title, body, selected-state, live-region, and GitHub-link matches.

- [ ] **Step 2: Verify responsive geometry**

Inspect at `1440 × 900`, `1280 × 720`, `1024 × 768`, `768 × 1024`, and `390 × 844`. Require zero page-level horizontal overflow and no text collisions. At the two narrow widths, confirm project → filesystem → document order.

- [ ] **Step 3: Verify interaction modes**

Confirm keyboard focus, native folder disclosure, FULL motion, STATIC mode, reduced-motion fallback, text selection, and project/file state reset.

- [ ] **Step 4: Record final evidence**

Save the exact commands, viewport measurements, 22/22 interaction result, console result, and any known limitation in the quality document.

