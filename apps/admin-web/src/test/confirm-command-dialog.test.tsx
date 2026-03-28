import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactElement } from "react";

import { AdminRuntimeProvider } from "../app/admin-runtime";
import { ConfirmCommandDialog } from "../features/commands/confirm-command-dialog";
import { StrategiesPage } from "../features/strategies/strategies-page";
import { publishCommandReceipt } from "../shared/realtime/command-receipt-bus";
import { TestProviders } from "./setup";


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
          {ui}
        </AdminRuntimeProvider>
      </QueryClientProvider>
    </TestProviders>
  );
}


test("requires explicit confirmation copy before executing a command", () => {
  const onConfirm = vi.fn();

  render(
    <ConfirmCommandDialog
      open
      commandLabel="Start strategy"
      targetLabel="strategies/demo"
      confirmationValue="START"
      isSubmitting={false}
      onClose={vi.fn()}
      onConfirm={onConfirm}
    />
  );

  expect(screen.getByText("Start strategy")).toBeInTheDocument();

  const executeButton = screen.getByRole("button", { name: "Execute command" });
  expect(executeButton).toBeDisabled();

  fireEvent.change(screen.getByLabelText("Type START to confirm"), {
    target: { value: "START" }
  });

  expect(executeButton).toBeEnabled();

  fireEvent.click(executeButton);

  expect(onConfirm).toHaveBeenCalledTimes(1);
});


test("renders localized confirmation chrome in Simplified Chinese", () => {
  renderWithRuntime(
    <ConfirmCommandDialog
      open
      commandLabel="Start strategy"
      targetLabel="strategies/demo"
      confirmationValue="START"
      isSubmitting={false}
      onClose={vi.fn()}
      onConfirm={vi.fn()}
    />,
    "zh-CN"
  );

  expect(screen.getByText("确认命令")).toBeInTheDocument();
  expect(screen.getByLabelText("输入 START 以确认")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "取消" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "执行命令" })).toBeInTheDocument();
});


test("surfaces accepted and completed receipts after a strategy control is confirmed", async () => {
  const fetchMock = vi.fn()
    .mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        generated_at: "2026-03-26T00:00:00Z",
        partial: false,
        items: [{ strategy_id: "demo", status: "stopped" }],
        errors: []
      })
    })
    .mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        command_id: "cmd-1",
        command: "strategy.start",
        target: "strategies/demo",
        status: "accepted",
        recorded_at: "2026-03-26T00:00:01Z",
        message: "Command queued for local strategy.start.",
        failure: null
      })
    });

  vi.stubGlobal("fetch", fetchMock);

  renderWithRuntime(<StrategiesPage />, "zh-CN");

  expect(await screen.findByText("demo")).toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: "Start strategy demo" }));
  fireEvent.change(screen.getByLabelText("输入 START 以确认"), {
    target: { value: "START" }
  });
  fireEvent.click(screen.getByRole("button", { name: "执行命令" }));

  expect(await screen.findByText("最新回执")).toBeInTheDocument();
  expect(await screen.findByText("accepted")).toBeInTheDocument();
  expect(screen.getByText("Command queued for local strategy.start.")).toBeInTheDocument();

  act(() => {
    publishCommandReceipt({
      type: "command.completed",
      receipt: {
        command_id: "cmd-1",
        command: "strategy.start",
        target: "strategies/demo",
        status: "completed",
        recorded_at: "2026-03-26T00:00:02Z",
        message: "Command completed for local strategy.start.",
        failure: null
      }
    });
  });

  await waitFor(() => {
    expect(screen.getByText("completed")).toBeInTheDocument();
  });

  expect(screen.getByText("Command completed for local strategy.start.")).toBeInTheDocument();
  expect(fetchMock).toHaveBeenNthCalledWith(2, "/api/admin/commands/strategies/demo/start", {
    method: "POST"
  });
});
