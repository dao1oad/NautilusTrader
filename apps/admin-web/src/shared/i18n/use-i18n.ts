import { useContext } from "react";

import { translateCatalog, type MessageKey, type TranslationParams } from "./catalog";
import { I18nContext } from "./i18n-provider";
import { getActiveLocale } from "./locale";


export function useI18n() {
  return useContext(I18nContext);
}

export function translate(key: MessageKey, params?: TranslationParams): string {
  return translateCatalog(getActiveLocale(), key, params);
}
