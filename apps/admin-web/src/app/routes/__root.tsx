import { Outlet } from "@tanstack/react-router";

import { ConsoleShell } from "../layouts/console-shell";


export function RootRouteComponent() {
  return (
    <ConsoleShell>
      <Outlet />
    </ConsoleShell>
  );
}
