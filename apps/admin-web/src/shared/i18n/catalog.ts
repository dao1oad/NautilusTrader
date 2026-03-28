import { DEFAULT_LOCALE, type SupportedLocale } from "./locale";
import { en } from "./messages/en";
import { zhCN } from "./messages/zh-cn";


export type MessageCatalog = {
  chrome: {
    appName: string;
  };
  errors: {
    adminEventStream: string;
    adminRequestFailedWithStatus: string;
  };
};

type NestedMessageKey<TValue> = {
  [TKey in keyof TValue & string]: TValue[TKey] extends string
    ? TKey
    : `${TKey}.${NestedMessageKey<TValue[TKey]>}`;
}[keyof TValue & string];

export type MessageKey = NestedMessageKey<MessageCatalog>;

export type TranslationParams = Record<string, string | number>;

export type PartialMessageCatalog = {
  [TKey in keyof MessageCatalog]?: MessageCatalog[TKey] extends string
    ? string
    : {
        [TChildKey in keyof MessageCatalog[TKey]]?: MessageCatalog[TKey][TChildKey];
      };
};

export type CatalogCollection = Record<SupportedLocale, PartialMessageCatalog>;

export const catalogs = {
  en,
  "zh-CN": zhCN
} satisfies Record<SupportedLocale, MessageCatalog>;

type TranslateCatalogOptions = {
  catalogCollection?: CatalogCollection;
  mode?: "development" | "production";
  warn?: (message: string) => void;
};

function readCatalogMessage(catalog: PartialMessageCatalog | undefined, key: MessageKey): string | null {
  if (!catalog) {
    return null;
  }

  const path = key.split(".");
  let currentValue: unknown = catalog;

  for (const segment of path) {
    if (!currentValue || typeof currentValue !== "object" || !(segment in currentValue)) {
      return null;
    }

    currentValue = (currentValue as Record<string, unknown>)[segment];
  }

  return typeof currentValue === "string" ? currentValue : null;
}

function interpolateMessage(message: string, params?: TranslationParams): string {
  if (!params) {
    return message;
  }

  return message.replace(/\{(\w+)\}/g, (match, key: string) => {
    const value = params[key];

    return value == null ? match : String(value);
  });
}

export function translateCatalog(
  locale: SupportedLocale,
  key: MessageKey,
  params?: TranslationParams,
  options: TranslateCatalogOptions = {}
): string {
  const catalogCollection = options.catalogCollection ?? catalogs;
  const localizedMessage = readCatalogMessage(catalogCollection[locale], key);

  if (localizedMessage) {
    return interpolateMessage(localizedMessage, params);
  }

  const fallbackMessage = readCatalogMessage(catalogCollection[DEFAULT_LOCALE], key);
  if (fallbackMessage) {
    if ((options.mode ?? "development") !== "production" && locale !== DEFAULT_LOCALE) {
      (options.warn ?? console.warn)(`Missing i18n key "${key}" for locale "${locale}". Falling back to "${DEFAULT_LOCALE}".`);
    }

    return interpolateMessage(fallbackMessage, params);
  }

  if ((options.mode ?? "development") !== "production") {
    (options.warn ?? console.warn)(`Missing i18n key "${key}" in the default locale catalog.`);
  }

  return key;
}
