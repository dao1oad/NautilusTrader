import { StrictMode } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { I18nProvider, resolveInitialLocale } from "../shared/i18n/i18n-provider";
import { LOCALE_STORAGE_KEY } from "../shared/i18n/locale";
import { en as englishCatalog } from "../shared/i18n/messages/en";
import { useI18n } from "../shared/i18n/use-i18n";
import * as localeModule from "../shared/i18n/locale";


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

function LocaleSetterProbe() {
  const { locale, setLocale, t } = useI18n();

  return (
    <>
      <button onClick={() => setLocale(locale === "en" ? "zh-CN" : "en")} type="button">
        Switch locale
      </button>
      <p data-testid="recent-views">{t("chrome.recentViews")}</p>
    </>
  );
}

function ThrowingProbe() {
  throw new Error("render exploded");
}

test("resolves the initial locale from persisted or navigator languages", () => {
  expect(resolveInitialLocale({ persistedLocale: "zh-CN", navigatorLanguages: ["en-US"] })).toBe("zh-CN");
  expect(resolveInitialLocale({ persistedLocale: null, navigatorLanguages: ["zh"] })).toBe("zh-CN");
  expect(resolveInitialLocale({ persistedLocale: null, navigatorLanguages: ["zh-CN"] })).toBe("zh-CN");
  expect(resolveInitialLocale({ persistedLocale: null, navigatorLanguages: ["zh-Hans"] })).toBe("zh-CN");
  expect(resolveInitialLocale({ persistedLocale: null, navigatorLanguages: ["zh-TW"] })).toBe("en");
  expect(resolveInitialLocale({ persistedLocale: null, navigatorLanguages: ["zh-HK"] })).toBe("en");
  expect(resolveInitialLocale({ persistedLocale: null, navigatorLanguages: ["zh-Hant"] })).toBe("en");
  expect(resolveInitialLocale({ persistedLocale: null, navigatorLanguages: ["fr-FR"] })).toBe("en");
  expect(resolveInitialLocale({ persistedLocale: null, navigatorLanguages: ["fr-FR", "zh-CN"] })).toBe("en");
  expect(resolveInitialLocale({ persistedLocale: "broken", navigatorLanguages: ["zh-Hans"] })).toBe("zh-CN");
});


test("repairs invalid persisted locales by writing the resolved value back to storage", async () => {
  const storage = createStorage("broken");
  const setActiveLocaleSpy = vi.spyOn(localeModule, "setActiveLocale");

  render(
    <StrictMode>
      <I18nProvider navigatorLanguages={["zh-Hans"]} storage={storage}>
        <I18nProbe />
      </I18nProvider>
    </StrictMode>
  );

  expect(screen.getByTestId("locale")).toHaveTextContent("zh-CN");
  await waitFor(() => {
    expect(storage.setItem).toHaveBeenCalledWith(LOCALE_STORAGE_KEY, "zh-CN");
    expect(storage.setItem).toHaveBeenCalledTimes(1);
    expect(setActiveLocaleSpy).toHaveBeenCalledWith("zh-CN");
    expect(setActiveLocaleSpy).toHaveBeenCalledTimes(1);
    expect(localeModule.getActiveLocale()).toBe("zh-CN");
  });
});


test("does not repair storage or mutate the active locale when render aborts before commit", () => {
  const storage = createStorage("broken");
  const setActiveLocaleSpy = vi.spyOn(localeModule, "setActiveLocale");
  const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

  expect(() =>
    render(
      <StrictMode>
        <I18nProvider navigatorLanguages={["zh-Hans"]} storage={storage}>
          <ThrowingProbe />
        </I18nProvider>
      </StrictMode>
    )
  ).toThrow("render exploded");

  expect(storage.setItem).not.toHaveBeenCalled();
  expect(setActiveLocaleSpy).not.toHaveBeenCalled();
  expect(localeModule.getActiveLocale()).toBe("en");

  consoleErrorSpy.mockRestore();
});


test("warns in development and falls back to English when a locale key is missing", () => {
  const warn = vi.fn();

  render(
    <I18nProvider
      catalogs={{
        en: englishCatalog,
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

test("updates translated shell chrome and persists when setLocale is called after mount", async () => {
  const storage = createStorage("en");

  render(
    <I18nProvider navigatorLanguages={["en-US"]} storage={storage}>
      <LocaleSetterProbe />
    </I18nProvider>
  );

  expect(screen.getByTestId("recent-views")).toHaveTextContent("Recent views");

  fireEvent.click(screen.getByRole("button", { name: "Switch locale" }));

  await waitFor(() => {
    expect(screen.getByTestId("recent-views")).toHaveTextContent("最近访问");
    expect(storage.setItem).toHaveBeenCalledWith(LOCALE_STORAGE_KEY, "zh-CN");
  });
});
