import { screen } from "@testing-library/react";

import { ConnectionBanner } from "../features/connection/connection-banner";
import { renderWithProviders } from "./setup";


test("shows disconnected state", () => {
  renderWithProviders(<ConnectionBanner state="disconnected" />);
  expect(screen.getByText("Link offline")).toBeInTheDocument();
});


test("shows disconnected state in Simplified Chinese", () => {
  renderWithProviders(<ConnectionBanner state="disconnected" />, { locale: "zh-CN" });

  expect(screen.getByText("连接已断开")).toBeInTheDocument();
});
