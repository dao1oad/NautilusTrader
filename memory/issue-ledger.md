# Issue Ledger

| Issue | Title | Priority | Dependencies | State | Parallel | PR | Next |
| --- | --- | --- | --- | --- | --- | --- | --- |
| #5 | Sync NautilusTrader upstream snapshot and admin console design baseline | Medium | None | closed | No | #25 (draft) | Planning baseline PR open for merge to main |
| #8 | Phase 0: admin control plane foundation and read-only overview slice | High | #5 | in_progress | No | #26 (draft, stacked on #25); #27 (draft, stacked on #26) | Continue stacked review flow for Slice A/B |
| #9 | Phase 1: admin console read-only operations surfaces | High | #8 | planned | No | TBD | Start after #8 merges |
| #10 | Phase 2: admin control commands and audit loop | High | #9 | planned | No | TBD | Start after #9 merges |
| #11 | Phase 3: trading operations and diagnostics surfaces | High | #10 | planned | No | TBD | Start after #10 merges |
| #12 | Phase 4: unified workbench and delivery hardening | High | #11 | planned | No | TBD | Start after #11 merges |
| #13 | Phase 1A: console shell, routing, and shared page states | Medium | #9 | planned | No | TBD | Execute inside Phase 1 |
| #14 | Phase 1B: read-only nodes, strategies, and adapters surfaces | Medium | #13 | planned | No | TBD | Execute after shell lands |
| #15 | Phase 1C: read-only orders, positions, accounts, and logs surfaces | Medium | #13, #14 | planned | No | TBD | Execute after core read-only surfaces land |
| #16 | Phase 2A: command contract, error codes, and audit sink | Medium | #10 | planned | No | TBD | Execute first in Phase 2 |
| #17 | Phase 2B: low-risk strategy, adapter, and subscription controls | Medium | #16 | planned | No | TBD | Execute after command contract lands |
| #18 | Phase 2C: command confirmations, audit timeline, and recovery runbooks | Medium | #16, #17 | planned | No | TBD | Execute after core controls land |
| #19 | Phase 3A: blotter, fills, and position drill-down | Medium | #11 | planned | No | TBD | Execute first in Phase 3 |
| #20 | Phase 3B: accounts, margin, and risk center | Medium | #19 | planned | No | TBD | Execute after blotter baseline lands |
| #21 | Phase 3C: catalog, history, event playback, and diagnostics | Medium | #19, #20 | planned | No | TBD | Execute after ops core surfaces land |
| #22 | Phase 4A: backtest and report integration | Medium | #12 | planned | No | TBD | Execute first in Phase 4 |
| #23 | Phase 4B: unified workbench navigation and workspace model | Medium | #22 | planned | No | TBD | Execute after backtest/report surfaces land |
| #24 | Phase 4C: frontend hosting, packaging, E2E, and delivery hardening | Medium | #22, #23 | planned | No | TBD | Execute after workbench model lands |
