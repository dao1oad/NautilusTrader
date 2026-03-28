import { createElement, type PropsWithChildren, type ReactElement } from "react";
import "@testing-library/jest-dom/vitest";
import { Theme } from "@radix-ui/themes/components/theme";
import { render, type RenderOptions } from "@testing-library/react";
import { afterEach, vi } from "vitest";

import { I18nProvider } from "../shared/i18n/i18n-provider";
import { queryClient } from "../shared/query/query-client";
import { DEFAULT_LOCALE, LOCALE_STORAGE_KEY, setActiveLocale, type SupportedLocale } from "../shared/i18n/locale";


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

type RenderWithProvidersOptions = Omit<RenderOptions, "wrapper"> & {
  locale?: SupportedLocale;
};

type TestProvidersProps = PropsWithChildren<{
  locale: SupportedLocale;
}>;

function createTestStorage(locale: SupportedLocale): Storage {
  return {
    getItem: vi.fn((key: string) => (key === LOCALE_STORAGE_KEY ? locale : null)),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
    key: vi.fn(() => null),
    length: 0
  };
}

export function TestProviders({ children, locale }: TestProvidersProps) {
  return createElement(
    I18nProvider,
    {
      navigatorLanguages: [locale],
      storage: createTestStorage(locale)
    },
    createElement(TestThemeWrapper, null, children)
  );
}

export function renderWithProviders(
  ui: ReactElement,
  { locale = DEFAULT_LOCALE, ...options }: RenderWithProvidersOptions = {}
) {
  function Wrapper({ children }: PropsWithChildren) {
    return createElement(TestProviders, { locale }, children);
  }

  return render(ui, {
    wrapper: Wrapper,
    ...options
  });
}

afterEach(() => {
  queryClient.clear();
  if (typeof window !== "undefined" && window.localStorage) {
    window.localStorage.removeItem(LOCALE_STORAGE_KEY);
  }
  setActiveLocale(DEFAULT_LOCALE);
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
