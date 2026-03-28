import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import type { ReactElement } from "react";

import { AdminRuntimeProvider } from "../app/admin-runtime";
import { WorkbenchShellMetaProvider, useCurrentWorkbenchShellMeta } from "../app/workbench-shell-meta";
import { AuditTimeline } from "../features/audit/audit-timeline";
import { ConfigDiffPage } from "../features/config/config-diff-page";
import { TestProviders } from "./setup";


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

function renderWithRuntime(ui: ReactElement, locale: "en" | "zh-CN" = "en") {
  const client = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false
      }
    }
  });

  return render(
    <TestProviders locale={locale}>
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
    </TestProviders>
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

test("surfaces degraded audit snapshots when partial data or section errors are present", async () => {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      generated_at: "2026-03-26T01:00:00Z",
      partial: true,
      items: [
        {
          sequence_id: 3,
          command_id: "cmd-3",
          command: "node.refresh",
          target: "node/local",
          status: "completed",
          payload: {},
          recorded_at: "2026-03-26T01:00:00Z",
          message: "Node refresh completed.",
          failure: null
        }
      ],
      errors: [
        {
          section: "audit_projection",
          message: "One audit source is delayed by 18 seconds."
        }
      ]
    })
  });

  vi.stubGlobal("fetch", fetchMock);

  renderWithRuntime(<AuditTimeline />);

  expect(await screen.findByText("node.refresh")).toBeInTheDocument();
  expect(screen.getByText("Showing the latest partial audit snapshot.")).toBeInTheDocument();
  expect(screen.getByText("audit_projection")).toBeInTheDocument();
  expect(screen.getByText(/One audit source is delayed by 18 seconds/)).toBeInTheDocument();
  expect(screen.getByText("partial snapshot")).toBeInTheDocument();
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


test("localizes audit and config page-owned copy in Simplified Chinese", async () => {
  const fetchMock = vi
    .fn()
    .mockResolvedValueOnce({
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
          }
        ],
        errors: []
      })
    })
    .mockResolvedValueOnce({
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
          }
        ],
        runbooks: [
          {
            runbook_id: "verify-command-guardrails",
            title: "Verify command guardrails",
            summary: "Confirm the local admin control plane still blocks high-risk actions.",
            steps: ["Check the config diff entries."]
          }
        ]
      })
    });

  vi.stubGlobal("fetch", fetchMock);

  const { rerender } = renderWithRuntime(<AuditTimeline />, "zh-CN");

  expect(await screen.findByText("操作回执流")).toBeInTheDocument();
  expect(screen.getByText("结果状态")).toBeInTheDocument();
  expect(screen.getByText("恢复指引")).toBeInTheDocument();
  expect(screen.getByText("Page title: 审计时间线")).toBeInTheDocument();

  rerender(
    <TestProviders locale="zh-CN">
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <AdminRuntimeProvider value={{ connectionState: "connected", error: null }}>
          <WorkbenchShellMetaProvider>
            <WorkbenchShellMetaProbe />
            <ConfigDiffPage />
          </WorkbenchShellMetaProvider>
        </AdminRuntimeProvider>
      </QueryClientProvider>
    </TestProviders>
  );

  expect(await screen.findByText("护栏漂移账本")).toBeInTheDocument();
  expect(screen.getByRole("table", { name: "配置差异" })).toBeInTheDocument();
  expect(screen.getByText("Page title: 配置差异")).toBeInTheDocument();
});
