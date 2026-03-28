import { act, renderHook, waitFor } from "@testing-library/react";
import type { PropsWithChildren } from "react";

import { useCommandAction } from "../features/commands/use-command-action";
import { TestProviders } from "./setup";


function createWrapper(locale: "en" | "zh-CN") {
  return function Wrapper({ children }: PropsWithChildren) {
    return <TestProviders locale={locale}>{children}</TestProviders>;
  };
}


test("localizes frontend fallback command errors in Simplified Chinese", async () => {
  const { result } = renderHook(() => useCommandAction(), {
    wrapper: createWrapper("zh-CN")
  });

  act(() => {
    result.current.openIntent({
      commandLabel: "Start strategy",
      targetLabel: "strategies/demo",
      confirmationValue: "START",
      submit: async () => {
        throw "not-an-error";
      }
    });
  });

  await act(async () => {
    await result.current.confirmIntent();
  });

  await waitFor(() => {
    expect(result.current.actionError).toBe("命令执行失败。");
  });
});


test("preserves backend-provided command error messages", async () => {
  const { result } = renderHook(() => useCommandAction(), {
    wrapper: createWrapper("zh-CN")
  });

  act(() => {
    result.current.openIntent({
      commandLabel: "Start strategy",
      targetLabel: "strategies/demo",
      confirmationValue: "START",
      submit: async () => {
        throw new Error("Backend exploded");
      }
    });
  });

  await act(async () => {
    await result.current.confirmIntent();
  });

  await waitFor(() => {
    expect(result.current.actionError).toBe("Backend exploded");
  });
});
