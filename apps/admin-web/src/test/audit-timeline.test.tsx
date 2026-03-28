import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import type { ReactElement } from "react";

import { AdminRuntimeProvider } from "../app/admin-runtime";
import { WorkbenchShellMetaProvider, useCurrentWorkbenchShellMeta } from "../app/workbench-shell-meta";
import { AuditTimeline } from "../features/audit/audit-timeline";
import { ConfigDiffPage } from "../features/config/config-diff-page";


function WorkbenchShellMetaProbe() {
  const meta = useCurrentWorkbenchShellMeta();

  return (
    <section>
      <p>{`Page title: ${meta.pageTitle ?? "None"}`}</p>
      <p>{`Workbench copy: ${meta.workbenchCopy ?? "None"}`}</p>
      <p>{`Last updated: ${meta.lastUpdated ?? "None"}`}</p>
      <p>{`Status summary: ${meta.statusSummary ?? "None"}`}</p>
    </section>
  );
}

function renderWithRuntime(ui: ReactElement) {
  const client = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false
      }
    }
  });

  return render(
    <QueryClientProvider client={client}>
      <AdminRuntimeProvider
        value={{
          connectionState: "connected",
          error: null
        }}
      >
        <WorkbenchShellMetaProvider>
          <WorkbenchShellMetaProbe />
          {ui}
        </WorkbenchShellMetaProvider>
      </AdminRuntimeProvider>
    </QueryClientProvider>
  );
}


test("renders audit records newest first and exposes recovery affordances for failures", async () => {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      generated_at: "2026-03-26T00:00:00Z",
      partial: false,
      items: [
        {
          sequence_id: 2,
          command_id: "cmd-2",
          command: "adapter.connect",
          target: "adapters/ib",
          status: "failed",
          payload: { adapter_id: "ib" },
          recorded_at: "2026-03-26T00:00:02Z",
          message: "Adapter 'ib' was not found.",
          failure: {
            code: "not_found",
            message: "Adapter 'ib' was not found.",
            retryable: false,
            details: {}
          }
        },
        {
          sequence_id: 1,
          command_id: "cmd-1",
          command: "strategy.start",
          target: "strategies/demo",
          status: "completed",
          payload: { strategy_id: "demo" },
          recorded_at: "2026-03-26T00:00:01Z",
          message: "Command completed for local strategy.start.",
          failure: null
        }
      ],
      errors: []
    })
  });

  vi.stubGlobal("fetch", fetchMock);

  renderWithRuntime(<AuditTimeline />);

  expect(await screen.findByText("adapter.connect")).toBeInTheDocument();
  expect(screen.getByText("Action receipt stream")).toBeInTheDocument();
  expect(screen.getAllByText("Result state")).toHaveLength(2);
  expect(screen.getByText("strategy.start")).toBeInTheDocument();
  expect(screen.getByText("Adapter 'ib' was not found.")).toBeInTheDocument();
  expect(screen.getByText("Recovery guidance")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Open recovery runbook" })).toBeInTheDocument();
  expect(screen.getByText("Page title: Audit timeline")).toBeInTheDocument();
  expect(screen.getByText("Last updated: 2026-03-26T00:00:00Z")).toBeInTheDocument();
  expect(fetchMock).toHaveBeenCalledWith("/api/admin/audit");
});


test("renders config diff guardrails and recovery runbooks", async () => {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      generated_at: "2026-03-26T00:00:00Z",
      items: [
        {
          key: "command.confirmation.required",
          summary: "All low-risk commands require an explicit UI confirmation step.",
          desired: "enabled",
          actual: "enabled",
          status: "in_sync",
          runbook_id: null
        },
        {
          key: "high_risk_commands.enabled",
          summary: "High-risk trading commands stay disabled in Phase 2.",
          desired: "disabled",
          actual: "disabled",
          status: "in_sync",
          runbook_id: "verify-command-guardrails"
        }
      ],
      runbooks: [
        {
          runbook_id: "verify-command-guardrails",
          title: "Verify command guardrails",
          summary: "Confirm the local admin control plane still blocks high-risk actions.",
          steps: [
            "Check the config diff entries for confirmation and high-risk guardrails.",
            "Confirm the audit timeline shows the latest low-risk receipts."
          ]
        }
      ]
    })
  });

  vi.stubGlobal("fetch", fetchMock);

  renderWithRuntime(<ConfigDiffPage />);

  expect(await screen.findByText("command.confirmation.required")).toBeInTheDocument();
  expect(screen.getByText("Guardrail drift ledger")).toBeInTheDocument();
  expect(screen.getAllByText("in_sync").length).toBeGreaterThan(0);
  expect(screen.getByText("Verify command guardrails")).toBeInTheDocument();
  expect(screen.getByText("Page title: Config diff")).toBeInTheDocument();
  expect(screen.getByText("Last updated: 2026-03-26T00:00:00Z")).toBeInTheDocument();
  expect(fetchMock).toHaveBeenCalledWith("/api/admin/config/diff");
});
