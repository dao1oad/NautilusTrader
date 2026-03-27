import { render, screen } from "@testing-library/react";

import { ConnectionBanner } from "../features/connection/connection-banner";


test("shows disconnected state", () => {
  render(<ConnectionBanner state="disconnected" />);
  expect(screen.getByText("Link offline")).toBeInTheDocument();
});
