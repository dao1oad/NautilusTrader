import type { ReactNode } from "react";


const renderSpy = vi.fn();
const createRootSpy = vi.fn(() => ({
  render: renderSpy
}));

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

vi.mock("@radix-ui/themes/components/theme", () => ({
  Theme({ children }: { children: ReactNode }) {
    return <div data-testid="theme-root">{children}</div>;
  }
}));

afterEach(() => {
  vi.resetModules();
  renderSpy.mockClear();
  createRootSpy.mockClear();
  document.body.innerHTML = "";
});

test("bootstraps the application during main module evaluation", async () => {
  document.body.innerHTML = '<div id="root"></div>';

  await import("../main");

  expect(createRootSpy).toHaveBeenCalledWith(document.getElementById("root"));
  expect(renderSpy).toHaveBeenCalledTimes(1);
});
