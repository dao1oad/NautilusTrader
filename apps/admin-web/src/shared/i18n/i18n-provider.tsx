import { createContext, useLayoutEffect, useState } from "react";
import type { ReactNode } from "react";

import {
  catalogs as defaultCatalogs,
  translateCatalog,
  type CatalogCollection,
  type MessageKey,
  type TranslationParams
} from "./catalog";
import {
  DEFAULT_LOCALE,
  getActiveLocale,
  LOCALE_STORAGE_KEY,
  getNavigatorLanguages,
  normalizeLocale,
  resolveInitialLocale,
  setActiveLocale,
  type LocaleStorage,
  type SupportedLocale
} from "./locale";


export { resolveInitialLocale } from "./locale";

export type I18nContextValue = {
  locale: SupportedLocale;
  setLocale: (next: SupportedLocale) => void;
  t: (key: MessageKey, params?: TranslationParams) => string;
};

export const I18nContext = createContext<I18nContextValue>({
  locale: DEFAULT_LOCALE,
  setLocale: () => {},
  t: (key, params) => translateCatalog(DEFAULT_LOCALE, key, params)
});

type I18nProviderProps = {
  children: ReactNode;
  catalogs?: CatalogCollection;
  mode?: "development" | "production";
  navigatorLanguages?: readonly string[];
  storage?: LocaleStorage;
  warn?: (message: string) => void;
};

type InitialLocaleState = {
  locale: SupportedLocale;
  shouldRepairStorage: boolean;
};

function getDefaultStorage(): LocaleStorage | undefined {
  if (typeof window === "undefined" || !window.localStorage) {
    return undefined;
  }

  return window.localStorage;
}

function resolveInitialLocaleState(
  storage: LocaleStorage | undefined,
  navigatorLanguages: readonly string[]
): InitialLocaleState {
  const persistedLocale = storage?.getItem(LOCALE_STORAGE_KEY) ?? null;
  const locale = resolveInitialLocale({
    persistedLocale,
    navigatorLanguages
  });
  const normalizedPersistedLocale = normalizeLocale(persistedLocale);

  return {
    locale,
    shouldRepairStorage:
      persistedLocale !== null && (normalizedPersistedLocale === null || normalizedPersistedLocale !== persistedLocale)
  };
}

function resolveMode(mode: "development" | "production" | undefined): "development" | "production" {
  if (mode) {
    return mode;
  }

  return import.meta.env.MODE === "production" ? "production" : "development";
}

export function I18nProvider({
  children,
  catalogs = defaultCatalogs,
  mode,
  navigatorLanguages = getNavigatorLanguages(),
  storage = getDefaultStorage(),
  warn
}: I18nProviderProps) {
  const [state, setState] = useState(() => resolveInitialLocaleState(storage, navigatorLanguages));

  const currentMode = resolveMode(mode);

  useLayoutEffect(() => {
    if (getActiveLocale() !== state.locale) {
      setActiveLocale(state.locale);
    }

    if (state.shouldRepairStorage && storage?.getItem(LOCALE_STORAGE_KEY) !== state.locale) {
      storage?.setItem(LOCALE_STORAGE_KEY, state.locale);
    }
  }, [state.locale, state.shouldRepairStorage, storage]);

  function setLocale(next: SupportedLocale) {
    setActiveLocale(next);
    storage?.setItem(LOCALE_STORAGE_KEY, next);
    setState((currentState) => {
      if (currentState.locale === next && currentState.shouldRepairStorage === false) {
        return currentState;
      }

      return {
        locale: next,
        shouldRepairStorage: false
      };
    });
  }

  function t(key: MessageKey, params?: TranslationParams) {
    return translateCatalog(state.locale, key, params, {
      catalogCollection: catalogs,
      mode: currentMode,
      warn
    });
  }

  return (
    <I18nContext.Provider
      value={{
        locale: state.locale,
        setLocale,
        t
      }}
    >
      {children}
    </I18nContext.Provider>
  );
}
