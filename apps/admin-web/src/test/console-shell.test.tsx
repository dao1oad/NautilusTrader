import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";

import { App } from "../app";
import { I18nProvider } from "../shared/i18n/i18n-provider";
import { LOCALE_STORAGE_KEY } from "../shared/i18n/locale";

function stubMatchMedia(matches: boolean) {
  vi.stubGlobal(
    "matchMedia",
    vi.fn().mockImplementation((query: string) => ({
      matches,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn()
    }))
  );
}

function renderLocalizedApp() {
  return render(
    <I18nProvider navigatorLanguages={["en-US"]} storage={window.localStorage}>
      <App />
    </I18nProvider>
  );
}

test("renders navigation entries for read-only operations routes", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(() => new Promise(() => {}))
  );

  render(<App />);

  expect(await screen.findByText("Runtime status")).toBeInTheDocument();
  expect(await screen.findByRole("button", { name: "Open navigation" })).toBeInTheDocument();
  expect(await screen.findByText("Recent views")).toBeInTheDocument();
  expect(await screen.findByRole("link", { name: "Operations" })).toBeInTheDocument();
  expect(await screen.findByRole("link", { name: "Analysis" })).toBeInTheDocument();
  expect(await screen.findByRole("link", { name: "Overview" })).toBeInTheDocument();
  expect(await screen.findByRole("link", { name: "Nodes" })).toBeInTheDocument();
  expect(await screen.findByRole("link", { name: "Strategies" })).toBeInTheDocument();
  expect(await screen.findByRole("link", { name: "Blotter" })).toBeInTheDocument();
  expect(await screen.findByRole("link", { name: "Fills" })).toBeInTheDocument();
  expect(await screen.findByRole("link", { name: "Risk Center" })).toBeInTheDocument();
  expect(await screen.findByRole("link", { name: "Catalog" })).toBeInTheDocument();
  expect(await screen.findByRole("link", { name: "Playback" })).toBeInTheDocument();
  expect(await screen.findByRole("link", { name: "Diagnostics" })).toBeInTheDocument();
  expect(await screen.findByRole("link", { name: "Backtests" })).toBeInTheDocument();
  expect(await screen.findByRole("link", { name: "Reports" })).toBeInTheDocument();
  expect(await screen.findByRole("link", { name: "Audit" })).toBeInTheDocument();
  expect(await screen.findByRole("link", { name: "Config" })).toBeInTheDocument();
});

test("mounts navigation routes only after opening the compact drawer", async () => {
  stubMatchMedia(true);
  vi.stubGlobal(
    "fetch",
    vi.fn(() => new Promise(() => {}))
  );

  render(<App />);

  expect(screen.queryByRole("link", { name: "Nodes" })).not.toBeInTheDocument();

  fireEvent.click(await screen.findByRole("button", { name: "Open navigation" }));

  expect(await screen.findByRole("dialog", { name: "Workbench navigation" })).toBeInTheDocument();
  expect(await screen.findByRole("link", { name: "Nodes" })).toBeInTheDocument();

  fireEvent.click(screen.getByText("Close navigation"));

  expect(screen.queryByRole("link", { name: "Nodes" })).not.toBeInTheDocument();
});

test("closes the compact drawer on escape and returns focus to the trigger", async () => {
  stubMatchMedia(true);
  vi.stubGlobal(
    "fetch",
    vi.fn(() => new Promise(() => {}))
  );

  render(<App />);

  const trigger = await screen.findByRole("button", { name: "Open navigation" });

  fireEvent.click(trigger);

  const dialog = await screen.findByRole("dialog", { name: "Workbench navigation" });
  const focusableLinks = within(dialog).getAllByRole("link");

  expect(dialog).toHaveAttribute("aria-modal", "true");
  expect(focusableLinks[0]).toHaveFocus();

  fireEvent.keyDown(document, { key: "Escape" });

  await waitFor(() => {
    expect(screen.queryByRole("dialog", { name: "Workbench navigation" })).not.toBeInTheDocument();
  });
  expect(screen.getByRole("button", { name: "Open navigation" })).toHaveFocus();
});

test("traps keyboard focus inside the compact drawer while it is open", async () => {
  stubMatchMedia(true);
  vi.stubGlobal(
    "fetch",
    vi.fn(() => new Promise(() => {}))
  );

  render(<App />);

  fireEvent.click(await screen.findByRole("button", { name: "Open navigation" }));

  const dialog = await screen.findByRole("dialog", { name: "Workbench navigation" });
  const focusableLinks = within(dialog).getAllByRole("link");
  const firstLink = focusableLinks[0];
  const lastLink = focusableLinks[focusableLinks.length - 1];

  lastLink.focus();
  fireEvent.keyDown(lastLink, { key: "Tab" });

  expect(firstLink).toHaveFocus();

  firstLink.focus();
  fireEvent.keyDown(firstLink, { key: "Tab", shiftKey: true });

  expect(lastLink).toHaveFocus();
});

test("returns focus to the trigger after compact-drawer link navigation", async () => {
  stubMatchMedia(true);
  vi.stubGlobal(
    "fetch",
    vi.fn(() => new Promise(() => {}))
  );

  render(<App />);

  fireEvent.click(await screen.findByRole("button", { name: "Open navigation" }));

  const nodesLink = await screen.findByRole("link", { name: "Nodes" });
  nodesLink.focus();

  expect(nodesLink).toHaveFocus();

  fireEvent.click(nodesLink);

  expect((await screen.findAllByRole("heading", { name: "Nodes" })).length).toBeGreaterThan(0);
  await waitFor(() => {
    expect(screen.queryByRole("dialog", { name: "Workbench navigation" })).not.toBeInTheDocument();
  });
  expect(screen.getByRole("button", { name: "Open navigation" })).toHaveFocus();
});

test("switches the shell locale from the toolbar and persists the selection", async () => {
  window.localStorage.clear();
  vi.stubGlobal(
    "fetch",
    vi.fn(() => new Promise(() => {}))
  );

  renderLocalizedApp();

  expect(await screen.findByRole("button", { name: "Language" })).toHaveTextContent("Language · English");
  expect(await screen.findByText("Recent views")).toBeInTheDocument();
  expect(screen.getByText("Workbench")).toBeInTheDocument();
  expect(screen.getByText("Awaiting page telemetry")).toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: "Language" }));

  expect(await screen.findByRole("button", { name: "语言" })).toHaveTextContent("语言 · 简体中文");
  expect(await screen.findByText("最近访问")).toBeInTheDocument();
  expect(screen.getByText("工作台")).toBeInTheDocument();
  expect(screen.getByText("等待页面遥测")).toBeInTheDocument();
  const workbenchCard = screen.getByText("工作台").closest("section");
  expect(workbenchCard).not.toBeNull();
  expect(within(workbenchCard as HTMLElement).getByText("操作")).toBeInTheDocument();
  expect(window.localStorage.getItem(LOCALE_STORAGE_KEY)).toBe("zh-CN");
});

test("localizes compact navigation labels and close affordances after switching locale", async () => {
  window.localStorage.clear();
  stubMatchMedia(true);
  vi.stubGlobal(
    "fetch",
    vi.fn(() => new Promise(() => {}))
  );

  renderLocalizedApp();

  fireEvent.click(await screen.findByRole("button", { name: "Language" }));

  const openNavigation = await screen.findByRole("button", { name: "打开导航" });
  fireEvent.click(openNavigation);

  expect(await screen.findByRole("dialog", { name: "工作台导航" })).toBeInTheDocument();
  expect(screen.getAllByRole("button", { name: "关闭导航" })).toHaveLength(2);
  expect(screen.getByText("操作台入口")).toBeInTheDocument();
});
