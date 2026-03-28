export const DEFAULT_LOCALE = "en";
export const LOCALE_STORAGE_KEY = "nautilus-admin-locale";

export type SupportedLocale = "en" | "zh-CN";

export type LocaleStorage = Pick<Storage, "getItem" | "setItem">;

export type ResolveInitialLocaleOptions = {
  persistedLocale: string | null;
  navigatorLanguages: readonly string[];
};

let activeLocale: SupportedLocale = DEFAULT_LOCALE;

export function normalizeLocale(locale: string | null | undefined): SupportedLocale | null {
  if (!locale) {
    return null;
  }

  const normalizedLocale = locale.trim().toLowerCase();
  if (normalizedLocale.startsWith("zh")) {
    return "zh-CN";
  }

  if (normalizedLocale.startsWith("en")) {
    return "en";
  }

  return null;
}

export function resolveInitialLocale({ persistedLocale, navigatorLanguages }: ResolveInitialLocaleOptions): SupportedLocale {
  const normalizedPersistedLocale = normalizeLocale(persistedLocale);
  if (normalizedPersistedLocale) {
    return normalizedPersistedLocale;
  }

  for (const navigatorLanguage of navigatorLanguages) {
    const normalizedNavigatorLocale = normalizeLocale(navigatorLanguage);
    if (normalizedNavigatorLocale) {
      return normalizedNavigatorLocale;
    }
  }

  return DEFAULT_LOCALE;
}

export function getNavigatorLanguages(
  currentNavigator: Pick<Navigator, "language" | "languages"> | undefined = typeof navigator === "undefined"
    ? undefined
    : navigator
): string[] {
  if (!currentNavigator) {
    return [];
  }

  if (currentNavigator.languages.length > 0) {
    return [...currentNavigator.languages];
  }

  return currentNavigator.language ? [currentNavigator.language] : [];
}

export function getActiveLocale(): SupportedLocale {
  return activeLocale;
}

export function setActiveLocale(locale: SupportedLocale) {
  activeLocale = locale;
}
