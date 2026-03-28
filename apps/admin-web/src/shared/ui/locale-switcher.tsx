import { useI18n } from "../i18n/use-i18n";


export function LocaleSwitcher() {
  const { locale, setLocale, t } = useI18n();
  const activeLocaleLabel = locale === "en" ? t("chrome.locales.en") : t("chrome.locales.zhCN");

  return (
    <button
      aria-label={t("chrome.localeSwitcher.label")}
      className="console-nav-toggle"
      onClick={() => setLocale(locale === "en" ? "zh-CN" : "en")}
      style={{ display: "inline-flex" }}
      type="button"
    >
      {t("chrome.localeSwitcher.button")}
      {" · "}
      {activeLocaleLabel}
    </button>
  );
}
