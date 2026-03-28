import { DEFAULT_LOCALE, type SupportedLocale } from "./locale";
import { en } from "./messages/en";
import { zhCN } from "./messages/zh-cn";


export type MessageCatalog = typeof en;

type NestedMessageKey<TValue> = {
  [TKey in keyof TValue & string]: TValue[TKey] extends string
    ? TKey
    : `${TKey}.${NestedMessageKey<TValue[TKey]>}`;
}[keyof TValue & string];

export type MessageKey = NestedMessageKey<MessageCatalog>;

export type TranslationParams = Record<string, string | number>;

type DeepPartial<TValue> = {
  [TKey in keyof TValue]?: TValue[TKey] extends string ? string : DeepPartial<TValue[TKey]>;
};

export type PartialMessageCatalog = DeepPartial<MessageCatalog>;

export type CatalogCollection = {
  en: MessageCatalog;
  "zh-CN": PartialMessageCatalog;
};

export const catalogs = {
  en,
  "zh-CN": zhCN
} satisfies Record<SupportedLocale, MessageCatalog>;

type TranslateCatalogOptions = {
  catalogCollection?: CatalogCollection;
  mode?: "development" | "production";
  warn?: (message: string) => void;
};

type RuntimeImportMeta = ImportMeta & {
  readonly env?: {
    readonly MODE?: string;
  };
};

function resolveMode(mode: "development" | "production" | undefined): "development" | "production" {
  if (mode) {
    return mode;
  }

  const runtimeMode = (import.meta as RuntimeImportMeta).env?.MODE;

  return runtimeMode === "production" ? "production" : "development";
}

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
  const mode = resolveMode(options.mode);
  const localizedMessage = readCatalogMessage(catalogCollection[locale], key);

  if (localizedMessage) {
    return interpolateMessage(localizedMessage, params);
  }

  const fallbackMessage = readCatalogMessage(catalogCollection[DEFAULT_LOCALE], key);
  if (fallbackMessage) {
    if (mode !== "production" && locale !== DEFAULT_LOCALE) {
      (options.warn ?? console.warn)(`Missing i18n key "${key}" for locale "${locale}". Falling back to "${DEFAULT_LOCALE}".`);
    }

    return interpolateMessage(fallbackMessage, params);
  }

  if (mode !== "production") {
    (options.warn ?? console.warn)(`Missing i18n key "${key}" in the default locale catalog.`);
  }

  return key;
}
