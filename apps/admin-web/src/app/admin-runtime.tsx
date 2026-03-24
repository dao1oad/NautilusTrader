import { createContext, useContext } from "react";
import type { ReactNode } from "react";

import type { ConnectionState } from "../shared/types/admin";


export type AdminRuntimeState = {
  connectionState: ConnectionState;
  error: string | null;
};

const DEFAULT_RUNTIME_STATE: AdminRuntimeState = {
  connectionState: "connecting",
  error: null
};

const AdminRuntimeContext = createContext<AdminRuntimeState>(DEFAULT_RUNTIME_STATE);

type ProviderProps = {
  value: AdminRuntimeState;
  children: ReactNode;
};

export function AdminRuntimeProvider({ value, children }: ProviderProps) {
  return <AdminRuntimeContext.Provider value={value}>{children}</AdminRuntimeContext.Provider>;
}

export function useAdminRuntime() {
  return useContext(AdminRuntimeContext);
}
