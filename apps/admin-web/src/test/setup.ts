import { createElement, type PropsWithChildren, type ReactElement } from "react";
import "@testing-library/jest-dom/vitest";
import { Theme } from "@radix-ui/themes/components/theme";
import { render, type RenderOptions } from "@testing-library/react";
import { afterEach, vi } from "vitest";

import { queryClient } from "../shared/query/query-client";


export function TestThemeWrapper({ children }: PropsWithChildren) {
  return createElement(
    Theme,
    {
      accentColor: "amber",
      appearance: "dark",
      grayColor: "slate",
      panelBackground: "solid",
      radius: "medium",
      scaling: "95%"
    },
    children
  );
}

export function renderWithTheme(ui: ReactElement, options?: Omit<RenderOptions, "wrapper">) {
  return render(ui, {
    wrapper: TestThemeWrapper,
    ...options
  });
}

afterEach(() => {
  queryClient.clear();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
