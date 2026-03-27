# NautilusTrader Admin Terminal Editorial Redesign

## Goal

Redesign the `apps/admin-web` experience into a dense, terminal-like control plane that feels purpose-built for live trading operations instead of a generic SaaS dashboard, while preserving the current route structure, query behavior, and bounded local-admin scope.

## Context

The current admin frontend works functionally but reads as a light, card-based admin template:

- the shell uses a conventional sidebar and page header pattern
- the overview page is visually sparse
- read-only surfaces are structurally consistent but low-density
- state handling is correct, but the interface language for stale, loading, and failure states is generic

The redesign should move the product toward a trading-terminal feel:

- higher information density
- stronger hierarchy and state signaling
- more editorial typography
- less glassmorphism and less generic "AI dashboard" styling

## Design Direction

### Chosen Direction

`Terminal Editorial`

This direction combines:

- the scanability of data-dense trading interfaces
- the restraint of modern product systems
- the typographic confidence of editorial layouts

The UI should feel like an operator workbench, not a marketing site, and not an AI copilot shell.

### Explicitly Avoid

- purple or blue glow-heavy AI styling
- oversized glass cards and soft floating surfaces
- oversized hero copy that pushes data below the fold
- ornamental charts or fake telemetry added only for atmosphere
- one-off page styles that break product consistency

## Current Ecosystem Guidance

For 2025-2026 frontend admin products, the relevant trend is not "make it futuristic." The stronger direction is:

- component-driven shells
- more disciplined typography
- stronger semantic states
- tighter tables and panels
- restrained motion
- interfaces that hide complexity in structure rather than decorating the surface

This redesign follows that direction without chasing trend noise.

## Component Library Recommendation

### Recommended

`Radix Themes`

Use Radix Themes as the base layer for layout and semantic UI primitives, then apply project-owned styling on top.

#### Why

- it gives stable primitives without imposing a dominant visual identity
- it fits the existing React + Vite stack cleanly
- it allows a custom terminal-like skin without adopting a utility-first or template-heavy look
- it is sufficient for the shell, panels, badges, buttons, tabs, separators, and scrollable regions needed here

#### Intended Scope

Use Radix Themes for:

- `Theme`
- layout primitives such as `Box`, `Flex`, `Grid`
- content primitives such as `Card`, `Badge`, `Tabs`, `Button`, `Separator`
- support primitives such as `ScrollArea`

Do not treat Radix Themes as the visual design itself. The project should still own:

- typography
- color tokens
- terminal-state styling
- dense table presentation
- shell composition

### Alternatives Considered

#### Mantine

Good for fast shipping and broad component coverage, but its default tone pulls the interface toward conventional SaaS dashboards. It is a valid fallback if implementation speed becomes more important than visual specificity.

#### MUI / Toolpad

Strong for enterprise admin systems with heavy form and grid needs, but too visually prescriptive for the desired terminal-editorial tone.

#### shadcn/ui

Useful for teams already leaning into Tailwind and hand-composed component kits, but it adds a styling model shift the current project does not need.

## Scope

### In Scope

- redesign the global app shell
- redesign the overview page into a real command-center landing surface
- redesign shared data surfaces used by read-only pages
- redesign state presentation for loading, stale, empty, and error flows
- redesign high-signal pages such as risk and audit so they read as specialized operational surfaces
- introduce a visual system that can scale across operations and analysis workbenches

### Out of Scope

- changing route structure or information architecture at the URL level
- changing backend contracts or query behavior
- introducing charts or analytics not already justified by current data
- broad feature additions unrelated to presentation or page composition
- converting the application into a chat-first or agent-first experience

## Information Architecture

### Workbench Model

Keep the existing two-workbench structure:

- `operations`
- `analysis`

But make the distinction clearer in the shell through labeling, tone, and navigation grouping.

### Shell Layout

The shell should be rebuilt as a permanent operator workstation:

- left rail: fixed workstation panel
- top bar: runtime strip
- content area: dense, grid-based work surface

#### Left Rail

Contains:

- product name and local environment identity
- workbench switcher
- grouped route navigation
- recent route history
- compact environment or runtime metadata

It should feel like a mounted control panel, not a soft SaaS sidebar.

#### Top Runtime Strip

Contains:

- current workbench label
- page title context
- connection state
- last updated signal
- room for future alert counts or environment flags

This strip should read as live operational context, not just page chrome.

## Page-Level Redesign

### Overview

The overview page should become the operational landing surface.

#### Structure

- runtime strip summary
- core metrics cluster
- execution health panel
- risk snapshot panel
- recent activity or event rail

#### Outcome

A user should be able to answer these questions within seconds:

- is the admin connection alive?
- is the node configured?
- is the system stale, degraded, or healthy?
- where should I look next?

This page should not rely on a large empty card with only a title and node state.

### Read-Only List Pages

All list-driven pages should share a common dense surface model:

- page header with title and short operational summary
- filter and pagination toolbar
- high-density table
- optional drill-down or selected-row detail area

#### Table Behavior

- tighter row height
- stronger table headers
- monospace numeric or timestamp cells where relevant
- clearer selected state
- more structured status chips

The goal is to resemble a trading work surface, not a default CRUD table.

### Risk Center

This page should feel like a command and guardrail surface.

#### Structure

- top summary cluster for high-priority risk fields
- risk event stream below
- active blocks table below that

#### Visual Priority

Risk level and blocked state should visually dominate neutral information.

### Audit Timeline

This page should read as an operation receipt stream.

#### Structure

- compact header
- vertically stacked action receipts
- each receipt shows command, target, status, message, and recovery affordance when relevant

It should feel like an append-only command log, not a generic list.

## Visual System

### Tone

- dark graphite base
- low-gloss surfaces
- crisp borders
- restrained contrast layering

### Color Tokens

- neutral surfaces: graphite, iron, slate, fog
- healthy state: cool cyan / electric blue
- warning state: amber
- error state: controlled red
- inactive or stale state: desaturated metal tones

The palette should emphasize state, not decoration.

### Typography

Use three roles:

- display/headline face with more character
- readable sans-serif for UI text
- monospace face for timestamps, numbers, identifiers, and system states

Typography should carry much of the product personality.

### Shape and Space

- reduce corner radius from the current soft-card feel
- use stronger edge definition
- use tighter spacing in data surfaces
- keep whitespace intentional, but avoid airy SaaS emptiness

## Interaction Rules

### Navigation

- active nav items should use a strong marker, not only a background tint
- hover states should be visible but restrained
- route grouping should read as system zones rather than brochure-style sections

### State Presentation

Unify state language across the app:

- `loading` should read as link establishment or snapshot acquisition
- `stale` should read as delayed or aged runtime data
- `error` should read as execution or connection failure
- `empty` should read as not configured or not yet projected

Prefer embedding these states inside page surfaces where possible rather than replacing the whole page with a generic full-page placeholder.

### Motion

Use minimal motion:

- subtle page entry
- small highlight on state refresh
- no decorative floating, glow bloom, or oversized transition choreography

## Responsive Behavior

This interface is desktop-first, but must still load and remain coherent on mobile.

### Desktop

The primary experience should preserve:

- persistent left rail
- dense content layout
- multi-panel overview

### Small Screens

On smaller widths:

- collapse the left rail into a top-level compact navigation affordance
- preserve the runtime strip and critical status indicators
- stack panels vertically
- keep the most important state visible first

The mobile layout does not need to recreate full terminal density, but it must remain operationally legible.

## Accessibility and Usability

The redesign must preserve or improve:

- keyboard navigation across shell and tables
- readable contrast for all state colors on dark surfaces
- semantic headings and labels
- clear focus treatment that remains visible on dense dark UI

The terminal aesthetic cannot come at the cost of legibility.

## Proposed UI Building Blocks

The redesign should introduce or refactor toward reusable presentation components such as:

- `WorkbenchHeader`
- `SignalPill`
- `MetricTile`
- `SectionPanel`
- `TerminalTable`
- `StateBanner`
- `ActivityRail`
- `FilterBar`

These names are conceptual at spec level. The implementation plan can refine naming and file structure based on existing patterns in `apps/admin-web`.

## Implementation Constraints

- preserve the existing TanStack Router structure
- preserve current React Query data flow and invalidation model
- preserve current admin API contracts
- avoid broad feature additions unrelated to redesign
- prefer incremental replacement over full rewrite

## Recommended Delivery Strategy

Implement in this order:

1. global shell and design tokens
2. overview page redesign
3. shared list-surface redesign
4. risk and audit specialization
5. consistency pass across remaining routes

This order delivers visible gains quickly without destabilizing behavior.

## Testing Expectations

The redesign should be implemented with behavior-preserving tests rather than appearance snapshots alone.

At planning time, cover:

- shell navigation behavior
- connection and state rendering behavior
- overview state transitions
- shared list interactions such as filter, paging, and selection
- route-level regressions for high-signal pages

Visual intent should be verified through targeted component tests and local manual inspection, not by introducing brittle screenshot-heavy requirements unless later requested.

## Success Criteria

The redesign is successful if:

- the app no longer reads as a generic admin template
- the shell feels purpose-built for operations
- overview gives immediate runtime understanding
- data pages are denser and easier to scan
- state handling feels like part of the product, not generic fallback UI
- the redesign remains compatible with the current bounded local-admin workflow
