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
  if (normalizedLocale === "zh-cn") {
    return "zh-CN";
  }

  if (normalizedLocale === "en") {
    return "en";
  }

  return null;
}

function resolveNavigatorLocale(locale: string | null | undefined): SupportedLocale {
  if (!locale) {
    return DEFAULT_LOCALE;
  }

  const normalizedLocale = locale.trim().toLowerCase();
  if (normalizedLocale === "zh" || normalizedLocale === "zh-cn" || normalizedLocale === "zh-hans") {
    return "zh-CN";
  }

  return DEFAULT_LOCALE;
}

export function resolveInitialLocale({ persistedLocale, navigatorLanguages }: ResolveInitialLocaleOptions): SupportedLocale {
  const normalizedPersistedLocale = normalizeLocale(persistedLocale);
  if (normalizedPersistedLocale) {
    return normalizedPersistedLocale;
  }

  return resolveNavigatorLocale(navigatorLanguages[0] ?? null);
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
