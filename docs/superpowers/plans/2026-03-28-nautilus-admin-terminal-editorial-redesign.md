# NautilusTrader Admin Terminal Editorial Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign `apps/admin-web` into a denser terminal-editorial workbench without changing the current route graph, backend contracts, or bounded local-admin behavior.

**Architecture:** Keep the existing TanStack Router + React Query structure and progressively replace the current light-card presentation with a darker workstation shell, shared terminal UI primitives, and page-specific compositions for overview, read-only tables, audit, risk, and config. Use a small shell-metadata context so route pages can push page title and last-updated signals into the runtime strip without inventing ad hoc cross-route plumbing. Use `@radix-ui/themes` as the default primitive layer, but keep all product identity in project-owned components and CSS tokens.

**Tech Stack:** React 19, TanStack Router, TanStack React Query, Vite, Vitest, CSS, `@radix-ui/themes`

---

## File Map

### Foundation and Shell

- Modify: `apps/admin-web/package.json`
- Modify: `apps/admin-web/package-lock.json`
- Modify: `apps/admin-web/src/main.tsx`
- Modify: `apps/admin-web/src/styles.css`
- Create: `apps/admin-web/src/app/workbench-shell-meta.tsx`
- Modify: `apps/admin-web/src/app/routes/__root.tsx`
- Modify: `apps/admin-web/src/app/layouts/console-shell.tsx`
- Modify: `apps/admin-web/src/app/layouts/workbench-shell.tsx`

### Shared UI Primitives

- Create: `apps/admin-web/src/shared/ui/workbench-header.tsx`
- Create: `apps/admin-web/src/shared/ui/signal-pill.tsx`
- Create: `apps/admin-web/src/shared/ui/metric-tile.tsx`
- Create: `apps/admin-web/src/shared/ui/section-panel.tsx`
- Create: `apps/admin-web/src/shared/ui/state-banner.tsx`
- Create: `apps/admin-web/src/shared/ui/activity-rail.tsx`
- Create: `apps/admin-web/src/shared/ui/filter-bar.tsx`
- Create: `apps/admin-web/src/shared/ui/terminal-table.tsx`
- Modify: `apps/admin-web/src/shared/ui/page-state.tsx`
- Modify: `apps/admin-web/src/shared/ui/last-updated-badge.tsx`
- Modify: `apps/admin-web/src/features/connection/connection-banner.tsx`

### Overview and High-Signal Pages

- Modify: `apps/admin-web/src/app/routes/overview.tsx`
- Modify: `apps/admin-web/src/features/overview/overview-page.tsx`
- Modify: `apps/admin-web/src/features/audit/audit-timeline.tsx`
- Modify: `apps/admin-web/src/features/risk/risk-page.tsx`
- Modify: `apps/admin-web/src/features/config/config-diff-page.tsx`

### Shared Data Surfaces

- Modify: `apps/admin-web/src/features/read-only/admin-list-page.tsx`
- Modify: `apps/admin-web/src/features/nodes/nodes-page.tsx`
- Modify: `apps/admin-web/src/features/strategies/strategies-page.tsx`
- Modify: `apps/admin-web/src/features/adapters/adapters-page.tsx`
- Modify: `apps/admin-web/src/features/orders/orders-page.tsx`
- Modify: `apps/admin-web/src/features/fills/fills-page.tsx`
- Modify: `apps/admin-web/src/features/positions/positions-page.tsx`
- Modify: `apps/admin-web/src/features/accounts/accounts-page.tsx`
- Modify: `apps/admin-web/src/features/logs/logs-page.tsx`
- Modify: `apps/admin-web/src/features/backtests/backtests-page.tsx`
- Modify: `apps/admin-web/src/features/reports/reports-page.tsx`
- Modify: `apps/admin-web/src/features/catalog/catalog-page.tsx`
- Modify: `apps/admin-web/src/features/playback/playback-page.tsx`
- Modify: `apps/admin-web/src/features/diagnostics/diagnostics-page.tsx`

### Tests

- Modify: `apps/admin-web/src/test/console-shell.test.tsx`
- Modify: `apps/admin-web/src/test/workbench-shell.test.tsx`
- Modify: `apps/admin-web/src/test/connection-banner.test.tsx`
- Modify: `apps/admin-web/src/test/app-connection-state.test.tsx`
- Modify: `apps/admin-web/src/test/page-state.test.tsx`
- Modify: `apps/admin-web/src/test/overview-page.test.tsx`
- Modify: `apps/admin-web/src/test/read-only-surfaces.test.tsx`
- Modify: `apps/admin-web/src/test/trading-read-only-surfaces.test.tsx`
- Modify: `apps/admin-web/src/test/audit-timeline.test.tsx`
- Modify: `apps/admin-web/src/test/backtest-report-surfaces.test.tsx`
- Modify: `apps/admin-web/src/test/catalog-diagnostics-surfaces.test.tsx`
- Modify: `apps/admin-web/src/test/setup.ts`

## Task 1: Add the Terminal Shell Foundation

**Files:**
- Modify: `apps/admin-web/package.json`
- Modify: `apps/admin-web/package-lock.json`
- Modify: `apps/admin-web/src/main.tsx`
- Modify: `apps/admin-web/src/app/layouts/console-shell.tsx`
- Modify: `apps/admin-web/src/app/layouts/workbench-shell.tsx`
- Create: `apps/admin-web/src/app/workbench-shell-meta.tsx`
- Modify: `apps/admin-web/src/app/routes/__root.tsx`
- Modify: `apps/admin-web/src/styles.css`
- Test: `apps/admin-web/src/test/console-shell.test.tsx`
- Test: `apps/admin-web/src/test/workbench-shell.test.tsx`
- Test: `apps/admin-web/src/test/setup.ts`

- [ ] **Step 1: Write failing shell tests for the workstation layout**

Add expectations that the shell exposes terminal-style landmarks such as:

```tsx
expect(await screen.findByText("Runtime status")).toBeInTheDocument();
expect(await screen.findByText("Recent views")).toBeInTheDocument();
expect(await screen.findByRole("link", { name: "Operations" })).toBeInTheDocument();
expect(await screen.findByRole("link", { name: "Analysis" })).toBeInTheDocument();
expect(await screen.findByRole("button", { name: "Open navigation" })).toBeInTheDocument();
```

- [ ] **Step 2: Run the shell tests to verify they fail for the new structure**

Run: `cd apps/admin-web && npm test -- --run src/test/console-shell.test.tsx src/test/workbench-shell.test.tsx`

Expected: FAIL because the current shell does not render the new workstation labels or runtime strip structure.

- [ ] **Step 3: Add Radix Themes and introduce shell metadata plumbing**

Install `@radix-ui/themes`, import its stylesheet in `src/main.tsx`, and wrap the application root in `Theme` there. Add a small shell-metadata provider in `src/app/workbench-shell-meta.tsx` and wire it into `src/app/routes/__root.tsx`. Update `src/test/setup.ts` so isolated component tests can render through a shared Radix `Theme` wrapper when they exercise components that consume Radix primitives.

Route pages can then publish:

- page title
- workbench copy
- last-updated timestamp
- optional status summary text

The shell-metadata owner should also clear or replace stale metadata on unmount and route change so the runtime strip never lingers on the previous page's state.

- [ ] **Step 4: Rebuild the shell around terminal layout primitives**

Update `console-shell.tsx` and `workbench-shell.tsx` so the shell renders:

- a fixed left workstation rail
- a top runtime strip
- stronger workbench grouping
- compact environment metadata
- a compact-navigation affordance for small screens

Have the runtime strip read from the shared shell-metadata context rather than from hard-coded pathname-only logic.

Keep the existing route data flow and local workspace state behavior unchanged.

- [ ] **Step 5: Replace the old light-card shell CSS with terminal tokens**

In `src/styles.css`, add the new token system for:

- graphite surface colors
- signal colors
- typography roles
- denser panel spacing
- workstation rail and runtime strip layout
- small-screen collapse behavior for the left rail while keeping runtime status visible

- [ ] **Step 6: Re-run the shell tests**

Run: `cd apps/admin-web && npm test -- --run src/test/console-shell.test.tsx src/test/workbench-shell.test.tsx`

Expected: PASS

- [ ] **Step 7: Commit the shell foundation**

```bash
git add apps/admin-web/package.json apps/admin-web/package-lock.json apps/admin-web/src/main.tsx apps/admin-web/src/app/workbench-shell-meta.tsx apps/admin-web/src/app/routes/__root.tsx apps/admin-web/src/app/layouts/console-shell.tsx apps/admin-web/src/app/layouts/workbench-shell.tsx apps/admin-web/src/styles.css apps/admin-web/src/test/console-shell.test.tsx apps/admin-web/src/test/workbench-shell.test.tsx apps/admin-web/src/test/setup.ts
git commit -m "feat: add terminal workbench shell foundation"
```

## Task 2: Standardize Shared Terminal UI and State Language

**Files:**
- Create: `apps/admin-web/src/shared/ui/workbench-header.tsx`
- Create: `apps/admin-web/src/shared/ui/signal-pill.tsx`
- Create: `apps/admin-web/src/shared/ui/metric-tile.tsx`
- Create: `apps/admin-web/src/shared/ui/section-panel.tsx`
- Create: `apps/admin-web/src/shared/ui/state-banner.tsx`
- Modify: `apps/admin-web/src/shared/ui/page-state.tsx`
- Modify: `apps/admin-web/src/shared/ui/last-updated-badge.tsx`
- Modify: `apps/admin-web/src/features/connection/connection-banner.tsx`
- Modify: `apps/admin-web/src/styles.css`
- Test: `apps/admin-web/src/test/connection-banner.test.tsx`
- Test: `apps/admin-web/src/test/app-connection-state.test.tsx`
- Test: `apps/admin-web/src/test/page-state.test.tsx`

- [ ] **Step 1: Write failing tests for terminal-style state copy and signals**

Extend tests to check that shared state components now use operational language such as stale snapshots, signal pills, and runtime labels instead of generic page placeholders.

Example assertions:

```tsx
expect(screen.getByText("Snapshot delayed")).toBeInTheDocument();
expect(screen.getByText("Link healthy")).toBeInTheDocument();
```

- [ ] **Step 2: Run the shared-state tests to verify they fail**

Run: `cd apps/admin-web && npm test -- --run src/test/connection-banner.test.tsx src/test/app-connection-state.test.tsx src/test/page-state.test.tsx`

Expected: FAIL because the current shared components still render the old generic language.

- [ ] **Step 3: Implement the shared terminal primitives**

Create small focused components for:

- section framing
- signal/status pills
- metric tiles
- workbench/page headers
- state banners

Keep them presentational and free of query logic.

- [ ] **Step 4: Refactor shared state surfaces onto the new primitives**

Update:

- `page-state.tsx`
- `last-updated-badge.tsx`
- `connection-banner.tsx`

so they align with the terminal-editorial tone and use clearer operational copy.

- [ ] **Step 5: Re-run the shared-state tests**

Run: `cd apps/admin-web && npm test -- --run src/test/connection-banner.test.tsx src/test/app-connection-state.test.tsx src/test/page-state.test.tsx`

Expected: PASS

- [ ] **Step 6: Commit the shared UI primitives**

```bash
git add apps/admin-web/src/shared/ui apps/admin-web/src/features/connection/connection-banner.tsx apps/admin-web/src/styles.css apps/admin-web/src/test/connection-banner.test.tsx apps/admin-web/src/test/app-connection-state.test.tsx apps/admin-web/src/test/page-state.test.tsx
git commit -m "feat: add shared terminal ui primitives"
```

## Task 3: Turn Overview into the Command Center

**Files:**
- Modify: `apps/admin-web/src/app/routes/overview.tsx`
- Modify: `apps/admin-web/src/features/overview/overview-page.tsx`
- Modify: `apps/admin-web/src/app/workbench-shell-meta.tsx`
- Create: `apps/admin-web/src/shared/ui/activity-rail.tsx`
- Modify: `apps/admin-web/src/shared/ui/metric-tile.tsx`
- Modify: `apps/admin-web/src/styles.css`
- Test: `apps/admin-web/src/test/overview-page.test.tsx`

- [ ] **Step 1: Write failing overview tests for the new command-center structure**

Add coverage for:

- a runtime summary section
- a risk snapshot panel
- a recent activity rail
- fallback activity sourced from local recent routes when no audit/log activity is available

Example assertions:

```tsx
expect(screen.getByRole("heading", { name: "Runtime" })).toBeInTheDocument();
expect(screen.getByRole("heading", { name: "Risk snapshot" })).toBeInTheDocument();
expect(screen.getByRole("heading", { name: "Recent activity" })).toBeInTheDocument();
```

- [ ] **Step 2: Run the overview tests to verify they fail**

Run: `cd apps/admin-web && npm test -- --run src/test/overview-page.test.tsx`

Expected: FAIL because the current overview only renders a minimal status card.

- [ ] **Step 3: Expand the overview route to use existing data sources only**

In `src/app/routes/overview.tsx`, add route-level queries that prefer:

1. overview snapshot
2. risk snapshot
3. audit snapshot for recent activity
4. local recent-route state as the fallback activity rail

Do not add backend endpoints or new mutating behavior.

- [ ] **Step 4: Rebuild the overview page as a multi-panel command center**

Update `overview-page.tsx` so it presents:

- runtime health
- execution summary
- risk summary
- recent activity

Use the new shared UI primitives instead of one-off cards.

- [ ] **Step 5: Publish overview metadata into the runtime strip**

Use the shell-metadata hook to set:

- the page title
- summary copy
- last-updated timestamp from the freshest available overview/risk/audit data

so the shell runtime strip stays synchronized with overview state.

- [ ] **Step 6: Re-run the overview tests**

Run: `cd apps/admin-web && npm test -- --run src/test/overview-page.test.tsx`

Expected: PASS

- [ ] **Step 7: Manually inspect the shell and overview direction**

Run the local dev server and check:

- desktop layout
- narrow-width layout with the compact navigation affordance
- focus visibility on navigation and top-strip controls
- dark-surface contrast for titles, table headers, and stale/error states

- [ ] **Step 8: Commit the overview redesign**

```bash
git add apps/admin-web/src/app/routes/overview.tsx apps/admin-web/src/features/overview/overview-page.tsx apps/admin-web/src/app/workbench-shell-meta.tsx apps/admin-web/src/shared/ui/activity-rail.tsx apps/admin-web/src/shared/ui/metric-tile.tsx apps/admin-web/src/styles.css apps/admin-web/src/test/overview-page.test.tsx
git commit -m "feat: redesign overview as terminal command center"
```

## Task 4: Redesign Shared List Surfaces as Terminal Tables

**Files:**
- Create: `apps/admin-web/src/shared/ui/filter-bar.tsx`
- Create: `apps/admin-web/src/shared/ui/terminal-table.tsx`
- Modify: `apps/admin-web/src/features/read-only/admin-list-page.tsx`
- Modify: `apps/admin-web/src/features/nodes/nodes-page.tsx`
- Modify: `apps/admin-web/src/features/strategies/strategies-page.tsx`
- Modify: `apps/admin-web/src/features/adapters/adapters-page.tsx`
- Modify: `apps/admin-web/src/features/orders/orders-page.tsx`
- Modify: `apps/admin-web/src/features/fills/fills-page.tsx`
- Modify: `apps/admin-web/src/features/positions/positions-page.tsx`
- Modify: `apps/admin-web/src/features/accounts/accounts-page.tsx`
- Modify: `apps/admin-web/src/features/logs/logs-page.tsx`
- Modify: `apps/admin-web/src/features/backtests/backtests-page.tsx`
- Modify: `apps/admin-web/src/features/reports/reports-page.tsx`
- Modify: `apps/admin-web/src/app/workbench-shell-meta.tsx`
- Modify: `apps/admin-web/src/styles.css`
- Test: `apps/admin-web/src/test/read-only-surfaces.test.tsx`
- Test: `apps/admin-web/src/test/trading-read-only-surfaces.test.tsx`
- Test: `apps/admin-web/src/test/backtest-report-surfaces.test.tsx`

- [ ] **Step 1: Write failing tests for denser list headers and table surfaces**

Add expectations that list pages expose:

- a structured page header
- a filter toolbar when filtering is available
- a denser table surface that preserves the same fetch and pagination behavior

Example:

```tsx
expect(await screen.findByText("Operator filter")).toBeInTheDocument();
expect(screen.getByText("Showing 1-25 of 26 rows")).toBeInTheDocument();
```

- [ ] **Step 2: Run the list-surface tests to verify they fail**

Run: `cd apps/admin-web && npm test -- --run src/test/read-only-surfaces.test.tsx src/test/trading-read-only-surfaces.test.tsx src/test/backtest-report-surfaces.test.tsx`

Expected: FAIL because the current list pages do not render the terminal-table structure or the new filter/header semantics.

- [ ] **Step 3: Build reusable filter and table components**

Create:

- `filter-bar.tsx`
- `terminal-table.tsx`

These should own the shared layout and semantics, not the route-specific copy.

- [ ] **Step 4: Refactor `AdminListPage` onto the new shared surface**

Preserve:

- query loading and stale handling
- filter behavior
- pagination behavior
- drill-down selection behavior

Only redesign the presentation and page composition.

While refactoring, have `AdminListPage` publish shell metadata through `workbench-shell-meta.tsx` using:

- the page title
- route-level summary copy
- the current snapshot `generated_at` when available

so list-driven routes automatically keep the runtime strip current.

- [ ] **Step 5: Update route-specific list pages only where needed**

Touch each route page only to provide improved labels, summaries, or column rendering that supports the denser terminal surface.

For `backtests` and `reports`, explicitly verify that they inherit metadata from `AdminListPage` or set it directly if they need route-specific copy beyond the shared default.

- [ ] **Step 6: Re-run the list-surface tests**

Run: `cd apps/admin-web && npm test -- --run src/test/read-only-surfaces.test.tsx src/test/trading-read-only-surfaces.test.tsx src/test/backtest-report-surfaces.test.tsx`

Expected: PASS

- [ ] **Step 7: Commit the shared data-surface redesign**

```bash
git add apps/admin-web/src/shared/ui/filter-bar.tsx apps/admin-web/src/shared/ui/terminal-table.tsx apps/admin-web/src/features/read-only/admin-list-page.tsx apps/admin-web/src/features/nodes/nodes-page.tsx apps/admin-web/src/features/strategies/strategies-page.tsx apps/admin-web/src/features/adapters/adapters-page.tsx apps/admin-web/src/features/orders/orders-page.tsx apps/admin-web/src/features/fills/fills-page.tsx apps/admin-web/src/features/positions/positions-page.tsx apps/admin-web/src/features/accounts/accounts-page.tsx apps/admin-web/src/features/logs/logs-page.tsx apps/admin-web/src/features/backtests/backtests-page.tsx apps/admin-web/src/features/reports/reports-page.tsx apps/admin-web/src/app/workbench-shell-meta.tsx apps/admin-web/src/styles.css apps/admin-web/src/test/read-only-surfaces.test.tsx apps/admin-web/src/test/trading-read-only-surfaces.test.tsx apps/admin-web/src/test/backtest-report-surfaces.test.tsx
git commit -m "feat: redesign admin tables as terminal surfaces"
```

## Task 5: Specialize Risk and Audit as High-Signal Operational Pages

**Files:**
- Modify: `apps/admin-web/src/features/audit/audit-timeline.tsx`
- Modify: `apps/admin-web/src/features/risk/risk-page.tsx`
- Modify: `apps/admin-web/src/features/config/config-diff-page.tsx`
- Modify: `apps/admin-web/src/app/workbench-shell-meta.tsx`
- Modify: `apps/admin-web/src/styles.css`
- Test: `apps/admin-web/src/test/audit-timeline.test.tsx`
- Test: `apps/admin-web/src/test/trading-read-only-surfaces.test.tsx`

- [ ] **Step 1: Write failing tests for the specialized audit and risk surfaces**

Add coverage that audit records render as receipt-like entries and that failure recovery remains guidance/navigation only.

Example:

```tsx
expect(await screen.findByText("Recovery guidance")).toBeInTheDocument();
expect(screen.getByRole("link", { name: "Open recovery runbook" })).toBeInTheDocument();
```

Also add risk expectations for stronger summary framing without changing the underlying data.
Extend the existing config-diff assertions in `src/test/audit-timeline.test.tsx` so the config page redesign remains explicitly covered.

- [ ] **Step 2: Run the audit and risk tests to verify they fail**

Run: `cd apps/admin-web && npm test -- --run src/test/audit-timeline.test.tsx src/test/trading-read-only-surfaces.test.tsx`

Expected: FAIL because the current pages still use generic cards and tables.

- [ ] **Step 3: Recompose `AuditTimeline` into an action receipt stream**

Keep the same snapshot fetch and recovery link behavior, but render:

- command
- target
- result state
- message
- guidance affordance

as terminal receipts rather than generic list items.

- [ ] **Step 4: Recompose `RiskPage` into a command-center guardrail page**

Keep the same data and sections, but change visual hierarchy so:

- high-priority risk summary leads
- events read as an alert stream
- active blocks read as hard constraints

- [ ] **Step 5: Restyle `ConfigDiffPage` as part of the same operations system**

Bring the config diff surface into the terminal-editorial system so it is not left behind as a light-card holdout. Keep all existing runbook and diff behavior unchanged.

- [ ] **Step 6: Publish audit/risk/config metadata into the runtime strip**

Use the shell-metadata hook so these pages can set titles and last-updated signals without route-specific shell hacks.

- [ ] **Step 7: Re-run the audit and risk tests**

Run: `cd apps/admin-web && npm test -- --run src/test/audit-timeline.test.tsx src/test/trading-read-only-surfaces.test.tsx`

Expected: PASS

- [ ] **Step 8: Commit the high-signal page redesign**

```bash
git add apps/admin-web/src/features/audit/audit-timeline.tsx apps/admin-web/src/features/risk/risk-page.tsx apps/admin-web/src/features/config/config-diff-page.tsx apps/admin-web/src/app/workbench-shell-meta.tsx apps/admin-web/src/styles.css apps/admin-web/src/test/audit-timeline.test.tsx apps/admin-web/src/test/trading-read-only-surfaces.test.tsx
git commit -m "feat: specialize audit and risk terminal pages"
```

## Task 6: Apply the Consistency Pass to Analysis Surfaces and Run Full Verification

**Files:**
- Modify: `apps/admin-web/src/features/catalog/catalog-page.tsx`
- Modify: `apps/admin-web/src/features/playback/playback-page.tsx`
- Modify: `apps/admin-web/src/features/diagnostics/diagnostics-page.tsx`
- Modify: `apps/admin-web/src/app/workbench-shell-meta.tsx`
- Modify: `apps/admin-web/src/styles.css`
- Test: `apps/admin-web/src/test/catalog-diagnostics-surfaces.test.tsx`
- Test: `apps/admin-web/src/test/app.test.tsx`

- [ ] **Step 1: Write failing tests for analysis-surface consistency**

Add assertions that analysis pages share the new terminal framing and preserve existing bounded-query feedback.

Example:

```tsx
expect(await screen.findByRole("heading", { name: "Catalog" })).toBeInTheDocument();
expect(screen.getByText("Analysis workbench")).toBeInTheDocument();
```

- [ ] **Step 2: Run the analysis consistency tests to verify they fail**

Run: `cd apps/admin-web && npm test -- --run src/test/catalog-diagnostics-surfaces.test.tsx src/test/app.test.tsx`

Expected: FAIL because the updated shell/frame language is not yet reflected across the analysis pages.

- [ ] **Step 3: Apply the final consistency pass**

Bring catalog, playback, diagnostics, and the shared analysis metadata into the same terminal-editorial system:

- consistent page headers
- consistent section framing
- preserved bounded-query explanatory copy

Do not add new backend-driven analytics or new interactions.

- [ ] **Step 4: Run the targeted analysis tests**

Run: `cd apps/admin-web && npm test -- --run src/test/catalog-diagnostics-surfaces.test.tsx src/test/app.test.tsx`

Expected: PASS

- [ ] **Step 5: Run the full admin-web test suite**

Run: `cd apps/admin-web && npm test -- --run`

Expected: PASS

- [ ] **Step 6: Run the production build**

Run: `cd apps/admin-web && npm run build`

Expected: PASS

- [ ] **Step 7: Check for whitespace and patch hygiene**

Run: `git diff --check`

Expected: no output

- [ ] **Step 8: Confirm keyboard focus and contrast one more time**

Manually tab through:

- shell navigation
- mobile navigation affordance
- filter inputs
- pagination buttons
- recovery links

Verify that focus rings remain visible and that text/state chips remain readable on dark surfaces.
Also verify that typography roles remain distinct and that any motion used for page entry or refresh stays restrained and non-decorative.

- [ ] **Step 9: Commit the consistency pass and verification-ready state**

```bash
git add apps/admin-web/src/features/catalog/catalog-page.tsx apps/admin-web/src/features/playback/playback-page.tsx apps/admin-web/src/features/diagnostics/diagnostics-page.tsx apps/admin-web/src/app/workbench-shell-meta.tsx apps/admin-web/src/styles.css apps/admin-web/src/test/catalog-diagnostics-surfaces.test.tsx apps/admin-web/src/test/app.test.tsx
git commit -m "feat: complete terminal editorial admin redesign"
```

## Execution Notes

- Treat `@radix-ui/themes` as the default primitive layer. Only back away from it if a concrete incompatibility appears, such as test-environment breakage that cannot be isolated, a conflict with the current React/Vite setup, or a clear inability to express the required layout primitives without heavier workarounds than the existing CSS approach.
- For overview activity sourcing, use this ranking:
  1. audit snapshot data
  2. log snapshot data if already available in the current page scope
  3. local recent-route summary from workspace state
- Recovery affordances in audit stay navigational or informational only. They must not introduce new mutating controls.
- Strategy, adapter, and other existing surfaces are in scope for visual restyling through the shared terminal components, but not for new command affordances or product-scope expansion.
- `ConfirmCommandDialog` and `CommandReceiptCard` stay out of scope unless they require a minimal cosmetic pass to avoid obviously clashing with the new shell; do not expand their behavior or workflow.
- Preserve current fetch URLs and query invalidation behavior unless a test proves a small compatibility change is required.
