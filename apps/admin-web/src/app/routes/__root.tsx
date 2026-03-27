import { Outlet } from "@tanstack/react-router";

import { WorkbenchShell } from "../layouts/workbench-shell";
import { WorkbenchShellMetaProvider } from "../workbench-shell-meta";


export function RootRouteComponent() {
  return (
    <WorkbenchShellMetaProvider>
      <WorkbenchShell>
        <Outlet />
      </WorkbenchShell>
    </WorkbenchShellMetaProvider>
  );
}
