import type { ReactNode } from "react";
import { render as renderIntoDom } from "@testing-library/react";


const renderSpy = vi.fn();
const createRootSpy = vi.fn((container: Element | DocumentFragment) => ({
  render(node: ReactNode) {
    renderSpy(node);
    renderIntoDom(node, {
      container: container as HTMLElement
    });
  }
}));
const i18nProviderSpy = vi.fn(({ children }: { children: ReactNode }) => (
  <div data-testid="i18n-provider">{children}</div>
));

vi.mock("react-dom/client", () => ({
  default: {
    createRoot: createRootSpy
  }
}));

vi.mock("../app", () => ({
  App() {
    return <div>Booted app</div>;
  }
}));

vi.mock("../shared/i18n/i18n-provider", () => ({
  I18nProvider: i18nProviderSpy
}));

vi.mock("@radix-ui/themes/components/theme", () => ({
  Theme({ children }: { children: ReactNode }) {
    return <div data-testid="theme-root">{children}</div>;
  }
}));

afterEach(() => {
  vi.resetModules();
  renderSpy.mockClear();
  createRootSpy.mockClear();
  i18nProviderSpy.mockClear();
  document.body.innerHTML = "";
});

test("bootstraps the application during main module evaluation", async () => {
  document.body.innerHTML = '<div id="root"></div>';

  await import("../main");

  expect(createRootSpy).toHaveBeenCalledWith(document.getElementById("root"));
  expect(i18nProviderSpy).toHaveBeenCalled();
  expect(renderSpy).toHaveBeenCalledTimes(1);
});
