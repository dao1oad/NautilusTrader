# Review Resolution

- PR: #6
- Review Type: remote Codex review
- Comment: `chatgpt-codex-connector` flagged two unresolved workflow issues on `.github/workflows/build.yml` and `.github/workflows/codeql-analysis.yml`
- Resolution: Updated `build.yml` to target `main` for push-triggered supply-chain checks and updated `codeql-analysis.yml` to run on PRs targeting `main`; synchronized the mapped truth docs and added smoke coverage for the branch targets
- Evidence: `powershell -ExecutionPolicy Bypass -File tests\smoke\test-github-templates.ps1`, `powershell -ExecutionPolicy Bypass -File tests\smoke\run-all.ps1`, and `powershell -ExecutionPolicy Bypass -File scripts\check-governance.ps1 -SkipRemoteChecks`
- Status: Resolved
