import { render, screen, waitFor } from "@testing-library/react";

import { I18nProvider, resolveInitialLocale } from "../shared/i18n/i18n-provider";
import { LOCALE_STORAGE_KEY } from "../shared/i18n/locale";
import { useI18n } from "../shared/i18n/use-i18n";


function createStorage(initialLocale: string | null): Storage {
  let persistedLocale = initialLocale;

  return {
    getItem: vi.fn((key: string) => {
      if (key === LOCALE_STORAGE_KEY) {
        return persistedLocale;
      }

      return null;
    }),
    setItem: vi.fn((key: string, value: string) => {
      if (key === LOCALE_STORAGE_KEY) {
        persistedLocale = value;
      }
    }),
    removeItem: vi.fn((key: string) => {
      if (key === LOCALE_STORAGE_KEY) {
        persistedLocale = null;
      }
    }),
    clear: vi.fn(() => {
      persistedLocale = null;
    }),
    key: vi.fn(() => null),
    length: 0
  };
}

function I18nProbe() {
  const { locale, t } = useI18n();

  return (
    <>
      <p data-testid="locale">{locale}</p>
      <p data-testid="message">{t("chrome.appName")}</p>
    </>
  );
}

test("resolves the initial locale from persisted or navigator languages", () => {
  expect(resolveInitialLocale({ persistedLocale: "zh-CN", navigatorLanguages: ["en-US"] })).toBe("zh-CN");
  expect(resolveInitialLocale({ persistedLocale: null, navigatorLanguages: ["zh"] })).toBe("zh-CN");
  expect(resolveInitialLocale({ persistedLocale: null, navigatorLanguages: ["zh-CN"] })).toBe("zh-CN");
  expect(resolveInitialLocale({ persistedLocale: null, navigatorLanguages: ["fr-FR"] })).toBe("en");
  expect(resolveInitialLocale({ persistedLocale: "broken", navigatorLanguages: ["zh-Hans"] })).toBe("zh-CN");
});


test("repairs invalid persisted locales by writing the resolved value back to storage", async () => {
  const storage = createStorage("broken");

  render(
    <I18nProvider navigatorLanguages={["zh-Hans"]} storage={storage}>
      <I18nProbe />
    </I18nProvider>
  );

  expect(screen.getByTestId("locale")).toHaveTextContent("zh-CN");
  await waitFor(() => {
    expect(storage.setItem).toHaveBeenCalledWith(LOCALE_STORAGE_KEY, "zh-CN");
  });
});


test("warns in development and falls back to English when a locale key is missing", () => {
  const warn = vi.fn();

  render(
    <I18nProvider
      catalogs={{
        en: {
          chrome: {
            appName: "NautilusTrader Admin"
          },
          errors: {
            adminEventStream: "Admin event stream error",
            adminRequestFailedWithStatus: "Admin request failed with status {status}"
          }
        },
        "zh-CN": {
          chrome: {},
          errors: {
            adminEventStream: "管理端事件流错误",
            adminRequestFailedWithStatus: "管理端请求失败，状态码 {status}"
          }
        }
      }}
      navigatorLanguages={["zh-CN"]}
      storage={createStorage(null)}
      warn={warn}
      mode="development"
    >
      <I18nProbe />
    </I18nProvider>
  );

  expect(screen.getByTestId("message")).toHaveTextContent("NautilusTrader Admin");
  expect(warn).toHaveBeenCalledWith(expect.stringContaining('Missing i18n key "chrome.appName" for locale "zh-CN"'));
});


test('provides access to translated catalog entries through t("chrome.appName")', () => {
  render(
    <I18nProvider navigatorLanguages={["en-US"]} storage={createStorage(null)}>
      <I18nProbe />
    </I18nProvider>
  );

  expect(screen.getByTestId("message")).toHaveTextContent("NautilusTrader Admin");
});
