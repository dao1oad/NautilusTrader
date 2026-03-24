# Review Resolution

- PR: #30
- Review Type: remote Codex review
- Comment: `discussion_r2980543889` requested a Vite proxy for `/api/admin/*` and `/ws/admin/*`; `discussion_r2980543892` requested that `scripts/sync-issues.sh` fail fast instead of converting `gh issue list` errors into an empty snapshot
- Resolution: Added a dev-server proxy in `apps/admin-web/vite.config.ts` with regression coverage in `apps/admin-web/src/test/vite-config.test.ts`; updated `scripts/sync-issues.sh` to fail fast on `gh` errors; extended `tests/smoke/test-issue-workset-scripts.ps1` to assert the shell sync path now exits non-zero without writing a bad snapshot; synced `docs/system-truth/api-contracts.md`; resolved both review threads on PR `#30`
- Evidence: `cd apps/admin-web && npm run lint`; `cd apps/admin-web && npm test -- --run`; `uvx --from pre-commit pre-commit run --files apps/admin-web/vite.config.ts apps/admin-web/src/test/vite-config.test.ts scripts/sync-issues.sh tests/smoke/test-issue-workset-scripts.ps1 docs/system-truth/api-contracts.md memory/issue-ledger.md`; `pwsh -File tests/smoke/test-issue-workset-scripts.ps1`
- Status: Resolved
