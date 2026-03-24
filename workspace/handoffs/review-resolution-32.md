# Review Resolution

- PR: #32
- Review Type: remote Codex review
- Comment: `discussion_r2982551237` from `chatgpt-codex-connector[bot]` reported that `OverviewPage` hid refresh failures when a cached snapshot was still present; `discussion_r2982630031` from `chatgpt-codex-connector[bot]` reported that transient `server.error` runtime state was never cleared after fresh overview data arrived; `discussion_r2982855267` from `chatgpt-codex-connector[bot]` reported that the runtime error was being cleared too early on invalidation/background refetch start while cached overview data was still present.
- Resolution: `OverviewPage` now treats `error + snapshot` as a degraded stale state with last-updated metadata instead of rendering the normal overview card; `App` now keeps transient `server.error` events from forcing the socket banner into stale state, clears the runtime error when the overview query successfully receives fresh data again, and no longer clears it on `invalidate` / `fetch` cache updates before a real query success arrives.
- Evidence: `cd apps/admin-web && npm test -- --run src/test/overview-page.test.tsx`; `cd apps/admin-web && npm test -- --run src/test/app-connection-state.test.tsx`; `cd apps/admin-web && npm test -- --run`; `cd apps/admin-web && npm run lint`; `cd apps/admin-web && npm run build`; `git diff --check`
- Status: Fixed
