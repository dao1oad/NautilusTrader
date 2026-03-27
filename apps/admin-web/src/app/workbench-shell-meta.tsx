import type { Dispatch, ReactNode } from "react";
import { createContext, useContext, useLayoutEffect, useReducer, useRef } from "react";


export type WorkbenchShellMetaValue = {
  pageTitle: string | null;
  workbenchCopy: string | null;
  lastUpdated: string | null;
  statusSummary: string | null;
};

export type WorkbenchShellMetaInput = Partial<WorkbenchShellMetaValue> & {
  priority?: number;
};

type WorkbenchShellMetaEntry = {
  id: symbol;
  meta: WorkbenchShellMetaValue;
  priority: number;
};

type WorkbenchShellMetaAction =
  | {
    type: "upsert";
    entry: WorkbenchShellMetaEntry;
  }
  | {
    type: "remove";
    id: symbol;
  };

const EMPTY_WORKBENCH_SHELL_META: WorkbenchShellMetaValue = {
  pageTitle: null,
  workbenchCopy: null,
  lastUpdated: null,
  statusSummary: null
};

const WorkbenchShellMetaValueContext = createContext<WorkbenchShellMetaValue>(EMPTY_WORKBENCH_SHELL_META);
const WorkbenchShellMetaDispatchContext = createContext<Dispatch<WorkbenchShellMetaAction> | null>(null);

function normalizeWorkbenchShellMeta(meta: Partial<WorkbenchShellMetaValue> | null | undefined): WorkbenchShellMetaValue {
  return {
    pageTitle: meta?.pageTitle ?? null,
    workbenchCopy: meta?.workbenchCopy ?? null,
    lastUpdated: meta?.lastUpdated ?? null,
    statusSummary: meta?.statusSummary ?? null
  };
}

function workbenchShellMetaReducer(
  state: WorkbenchShellMetaEntry[],
  action: WorkbenchShellMetaAction,
): WorkbenchShellMetaEntry[] {
  if (action.type === "remove") {
    return state.filter((entry) => entry.id !== action.id);
  }

  const existingIndex = state.findIndex((entry) => entry.id === action.entry.id);
  if (existingIndex === -1) {
    return [...state, action.entry];
  }

  return state.map((entry, index) => (index === existingIndex ? action.entry : entry));
}

function resolveWorkbenchShellMetaValue(entries: WorkbenchShellMetaEntry[]): WorkbenchShellMetaValue {
  let activeEntry: WorkbenchShellMetaEntry | null = null;

  for (const entry of entries) {
    if (activeEntry == null || entry.priority >= activeEntry.priority) {
      activeEntry = entry;
    }
  }

  return activeEntry?.meta ?? EMPTY_WORKBENCH_SHELL_META;
}

export function WorkbenchShellMetaProvider({ children }: { children: ReactNode }) {
  const [entries, dispatch] = useReducer(workbenchShellMetaReducer, []);
  const value = resolveWorkbenchShellMetaValue(entries);

  return (
    <WorkbenchShellMetaDispatchContext.Provider value={dispatch}>
      <WorkbenchShellMetaValueContext.Provider value={value}>
        {children}
      </WorkbenchShellMetaValueContext.Provider>
    </WorkbenchShellMetaDispatchContext.Provider>
  );
}

export function useWorkbenchShellMeta(meta: WorkbenchShellMetaInput | null | undefined) {
  const dispatch = useContext(WorkbenchShellMetaDispatchContext);
  const entryIdRef = useRef(Symbol("workbench-shell-meta"));

  useLayoutEffect(() => {
    if (!dispatch || !meta) {
      return;
    }

    dispatch({
      type: "upsert",
      entry: {
        id: entryIdRef.current,
        meta: normalizeWorkbenchShellMeta(meta),
        priority: meta.priority ?? 1
      }
    });

    return () => {
      dispatch({
        type: "remove",
        id: entryIdRef.current
      });
    };
  }, [dispatch, meta?.lastUpdated, meta?.pageTitle, meta?.priority, meta?.statusSummary, meta?.workbenchCopy]);
}

export function useCurrentWorkbenchShellMeta(fallback?: Partial<WorkbenchShellMetaValue>): WorkbenchShellMetaValue {
  const value = useContext(WorkbenchShellMetaValueContext);
  const normalizedFallback = normalizeWorkbenchShellMeta(fallback);

  return {
    pageTitle: value.pageTitle ?? normalizedFallback.pageTitle,
    workbenchCopy: value.workbenchCopy ?? normalizedFallback.workbenchCopy,
    lastUpdated: value.lastUpdated ?? normalizedFallback.lastUpdated,
    statusSummary: value.statusSummary ?? normalizedFallback.statusSummary
  };
}

export function WorkbenchShellMeta(props: WorkbenchShellMetaInput) {
  useWorkbenchShellMeta(props);
  return null;
}
