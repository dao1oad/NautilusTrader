# NautilusTrader Admin Web Internationalization Design

## Goal

Add frontend-only internationalization to `apps/admin-web` with initial support for `en` and `zh-CN`, while preserving the current route structure, backend contracts, query behavior, and recent editorial redesign.

## Context

The admin frontend currently has no i18n layer:

- human-visible UI copy is hard-coded across shell, shared components, feature pages, and tests
- `apps/admin-web/package.json` has no i18n dependency today
- route URLs such as `/orders`, `/risk`, and `/catalog` are already stable and should remain unchanged
- backend responses and business values are currently rendered directly and should not be reinterpreted in phase 1

This design is intentionally narrow. The first slice should make the interface bilingual without turning the frontend into a translation framework project.

## Scope

### In Scope

- `apps/admin-web` display-layer internationalization only
- two locales only: `en` and `zh-CN`
- browser-language detection with manual override
- persisted locale preference in browser storage
- translation of shell chrome, navigation, headings, buttons, banners, state copy, filter copy, dialog copy, and other UI-owned text
- message-catalog structure and test harness support needed to keep the feature maintainable

### Out of Scope

- backend API contract changes
- localization of backend error payloads or server-generated messages
- route-path localization
- localization of raw business values such as IDs, enum payloads, instrument symbols, or timestamps beyond their surrounding labels
- support for additional locales in this slice
- adoption of a heavier i18n framework unless implementation reveals a concrete blocker in the chosen direction

## Approaches Considered

### Recommended: Lightweight Project-Owned i18n Layer

Add a small typed i18n layer inside `apps/admin-web` with:

- a top-level provider
- a `t()` lookup function
- a typed English base catalog
- a matching `zh-CN` catalog
- a small locale detection and persistence module

Why this is the default choice:

- the app only needs two locales
- current copy is mostly fixed UI text, not rich ICU-style content
- the frontend already uses a project-owned composition style rather than a large framework abstraction stack
- this keeps the first implementation focused on product behavior, not library ceremony

### Alternative: `react-intl`

This would give stronger message formatting primitives and a well-known pattern for richer future localization. It is a valid fallback if implementation uncovers immediate needs for advanced formatting or message extraction, but it is heavier than required for the current scope.

### Alternative: `react-i18next`

This is the most expandable option for larger multilingual products, but it adds more runtime and conceptual overhead than the current admin frontend needs. It is not the preferred starting point for a two-locale UI-only rollout.

## Chosen Direction

Implement a lightweight project-owned i18n layer inside `apps/admin-web`.

The first phase should optimize for:

- low dependency weight
- explicit ownership of message keys and locale persistence
- easy retrofitting into existing page and shared-component patterns
- minimal disruption to current tests and runtime behavior

## Locale Model

### Supported Locales

- `en`
- `zh-CN`

### Fallback Locale

- `en`

### Locale Resolution Order

On app startup, resolve the active locale in this order:

1. previously persisted locale from browser storage, if it is valid
2. browser language preference
3. fallback locale `en`

If browser storage contains an unsupported locale value, treat it as absent for resolution purposes, continue to browser-language detection, and then repair storage by writing back the resolved supported locale.

### Browser Language Mapping

Map browser-language variants conservatively:

- `zh-CN`, `zh-Hans`, and generic `zh` resolve to `zh-CN`
- everything else resolves to `en`

### Manual Switching

Expose a language switcher in the global admin shell so the user can change locale without leaving the current route or reloading the page.

### Persistence

Persist the selected locale in a dedicated browser-storage key separate from workspace route memory.

## Architecture

### Top-Level Structure

Add a small i18n module under `apps/admin-web/src/shared/i18n/`.

Expected responsibilities:

- locale normalization and validation
- locale detection from browser APIs
- locale persistence to browser storage
- message-catalog typing
- `I18nProvider`
- `useI18n()` hook and `t()` lookup
- minimal formatting helpers required by this slice

The exact filenames can be refined during planning, but the module should remain centralized rather than distributing locale logic across page folders.

## App Wiring

Wrap the admin frontend in an i18n provider at the top of the React tree so that:

- the shell layout can translate global navigation and runtime labels
- shared UI components can translate component-owned copy
- route pages can translate page-owned headings and summaries

The provider should trigger a normal React re-render when the locale changes. No full-page reload is acceptable.

## Message Catalog Strategy

Use English as the canonical catalog shape.

The `zh-CN` catalog must satisfy the same structure as the English catalog so missing keys are caught during development instead of surfacing only at runtime.

Organize message keys by UI responsibility instead of by file path. Representative groups:

- `chrome.*`
- `navigation.*`
- `runtime.*`
- `state.*`
- `actions.*`
- `filters.*`
- `dialogs.*`
- `pages.overview.*`
- `pages.orders.*`
- `pages.risk.*`

Avoid a single flat catalog and avoid one-catalog-file-per-component fragmentation.

## Translation Boundaries

### Shared Components Translate Their Own Fixed Copy

Components with fixed UI-owned text should translate internally. Examples include:

- global shell labels in `console-shell`
- navigation group titles and workbench labels
- `ConnectionBanner`
- `StateBanner`
- `FilterBar` helper copy
- shared pagination controls
- generic drill-down action labels when they are truly reusable

### Pages Translate Page-Owned Copy

Feature pages should remain responsible for their own:

- page titles
- page summaries
- feature-specific empty/loading copy
- feature-specific action labels

This keeps the component APIs close to their current structure and avoids turning shared components into large copy-configuration surfaces.

### Raw Business Values Stay Raw

Do not translate:

- instrument IDs
- client order IDs
- backend status strings returned as data values
- server error payload text
- timestamps beyond their surrounding UI labels in this phase

This phase localizes the UI shell, not domain semantics.

## Navigation and Workspace Persistence

The current workspace store persists recent-route display labels directly. That creates stale-language behavior after a locale switch.

The design requirement for phase 1 is:

- persist stable route identity, not localized display text
- derive visible labels from the current locale at render time

This affects:

- recent views
- workbench destination labels
- any other persisted route-memory surfaces

Implementation should include a compatibility path for previously stored workspace data so existing browser state does not break if it still contains historical labels.

## Language Switcher Placement

Place the language switcher in the global shell toolbar, near other always-visible runtime controls.

Reasons:

- the setting is app-global, not page-local
- it must remain reachable on every route
- it should not require opening a settings page to change a basic accessibility and usability preference

The control should remain compact and should not force a shell-layout redesign.

## Formatting Rules

Phase 1 formatting support should stay minimal:

- string lookup
- simple variable interpolation when needed

Do not introduce ICU message formatting, plural rules, or a broader localization DSL unless implementation finds a concrete requirement that cannot be met otherwise.

## Error Handling and Fallbacks

### Missing Translation Keys

- in development: log a warning and fall back to English
- in production: fall back to English without blocking rendering

### Invalid Persisted Locale

If browser storage contains an unsupported locale, do not use it as the active locale. Treat it as missing, continue normal resolution through browser-language detection and fallback, then overwrite storage with the resolved supported locale.

### Backend and Runtime Errors

Frontend-owned wrapper text should be localized, but backend-provided error strings should be displayed as-is in this slice.

Examples:

- localize UI copy such as "Reconnect the admin API to refresh runtime state."
- do not translate a raw server error message returned by the backend

## Testing Expectations

### Test Harness

Introduce a shared frontend test helper that can render components with the i18n provider. Default the helper to `en` so the existing test suite remains stable unless a test explicitly needs another locale.

### Required Regression Coverage

Add or update tests for:

- shell rendering with localized navigation and runtime labels
- language switcher interaction
- locale persistence in browser storage
- browser-language fallback behavior
- shared state components such as connection and page-state banners
- recent views rendering after locale switching
- representative route pages in both default English and targeted Simplified Chinese assertions

### Test Strategy

Do not convert the suite into broad translation snapshots.

Prefer:

- explicit assertions for key visible copy
- a small number of targeted `zh-CN` tests
- preservation of existing behavioral tests around filtering, paging, routing, and connection state

The goal is to verify the i18n layer and integration points, not to duplicate the entire suite per locale.

## Implementation Constraints

- preserve current TanStack Router paths and route tree
- preserve React Query data flow and invalidation behavior
- preserve backend admin API contracts
- preserve current bounded local-admin runtime assumptions
- avoid broad refactors unrelated to frontend i18n adoption
- keep the implementation incremental so the app stays shippable between steps

## Documentation and Governance Considerations

Because `apps/admin-web/**` is governed by the admin-web truth-doc mapping, implementation planning must account for the required source-of-truth updates alongside code changes.

Expected planning impact:

- `architecture`: note the introduction of a frontend i18n layer
- `module-boundaries`: document the new shared i18n module ownership
- `runtime-flows`: document locale resolution and persistence behavior
- `data-model`: document browser-stored locale and route-memory implications if the persisted shape changes
- `api-contracts`: likely a clarification that backend contracts remain unchanged by the rollout
- `integrations`: document browser locale and browser storage usage if that is not already captured

The feature does not expand backend APIs, but governance still requires implementation to reconcile truth docs with the new frontend runtime behavior.

## Delivery Strategy

Recommended implementation order:

1. add the shared i18n module and provider wiring
2. localize shell chrome, language-switcher behavior, and recent-route label persistence together
3. localize shared state and list-surface components
4. localize page-level feature copy
5. update tests and truth docs

This order keeps risk low and exposes regression points early.

## Success Criteria

The work is successful when:

- a first-time visitor gets either English or Simplified Chinese according to browser preference
- a user can switch language manually from any route
- the selected language persists across reloads
- global shell chrome, page-owned copy, and shared state messages render in the selected locale
- recent views and other route-memory surfaces do not show stale-language labels after switching
- route URLs, backend responses, and core admin behavior remain unchanged
- the test suite continues to validate the app without doubling into full per-locale duplication
