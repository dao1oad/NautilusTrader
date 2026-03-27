import { Outlet } from "@tanstack/react-router";

import { WorkbenchShell } from "../layouts/workbench-shell";


export function RootRouteComponent() {
  return (
    <WorkbenchShell>
      <Outlet />
    </WorkbenchShell>
  );
}
