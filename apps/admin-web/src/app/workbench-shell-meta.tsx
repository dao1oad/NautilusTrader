import type { Dispatch, ReactNode } from "react";
import { createContext, useContext, useLayoutEffect, useReducer, useRef } from "react";


export type WorkbenchShellMetaValue = {
  pageTitle: string | null;
  workbenchCopy: string | null;
  lastUpdated: string | null;
  statusSummary: string | null;
};

type WorkbenchShellMetaSelection = {
  [K in keyof WorkbenchShellMetaValue]?: WorkbenchShellMetaValue[K];
};

export type WorkbenchShellMetaInput = WorkbenchShellMetaSelection & {
  priority?: number;
};

type WorkbenchShellMetaEntry = {
  id: symbol;
  meta: WorkbenchShellMetaSelection;
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

const EMPTY_WORKBENCH_SHELL_META: WorkbenchShellMetaSelection = {};

const WorkbenchShellMetaValueContext = createContext<WorkbenchShellMetaSelection>(EMPTY_WORKBENCH_SHELL_META);
const WorkbenchShellMetaDispatchContext = createContext<Dispatch<WorkbenchShellMetaAction> | null>(null);

function hasMetaValue<Key extends keyof WorkbenchShellMetaSelection>(
  meta: WorkbenchShellMetaSelection,
  key: Key,
): meta is WorkbenchShellMetaSelection & Required<Pick<WorkbenchShellMetaSelection, Key>> {
  return Object.prototype.hasOwnProperty.call(meta, key);
}

function normalizeWorkbenchShellMeta(meta: WorkbenchShellMetaSelection | null | undefined): WorkbenchShellMetaSelection {
  if (!meta) {
    return EMPTY_WORKBENCH_SHELL_META;
  }

  const nextMeta: WorkbenchShellMetaSelection = {};

  if (hasMetaValue(meta, "pageTitle") && meta.pageTitle !== undefined) {
    nextMeta.pageTitle = meta.pageTitle;
  }

  if (hasMetaValue(meta, "workbenchCopy") && meta.workbenchCopy !== undefined) {
    nextMeta.workbenchCopy = meta.workbenchCopy;
  }

  if (hasMetaValue(meta, "lastUpdated") && meta.lastUpdated !== undefined) {
    nextMeta.lastUpdated = meta.lastUpdated;
  }

  if (hasMetaValue(meta, "statusSummary") && meta.statusSummary !== undefined) {
    nextMeta.statusSummary = meta.statusSummary;
  }

  return nextMeta;
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

function resolveWorkbenchShellMetaField<Key extends keyof WorkbenchShellMetaValue>(
  entries: WorkbenchShellMetaEntry[],
  key: Key,
): WorkbenchShellMetaSelection[Key] | undefined {
  let resolvedValue: WorkbenchShellMetaSelection[Key] | undefined;
  let resolvedPriority = Number.NEGATIVE_INFINITY;

  for (const entry of entries) {
    if (!hasMetaValue(entry.meta, key)) {
      continue;
    }

    if (entry.priority >= resolvedPriority) {
      resolvedPriority = entry.priority;
      resolvedValue = entry.meta[key];
    }
  }

  return resolvedValue;
}

function resolveWorkbenchShellMetaValue(entries: WorkbenchShellMetaEntry[]): WorkbenchShellMetaSelection {
  const pageTitle = resolveWorkbenchShellMetaField(entries, "pageTitle");
  const workbenchCopy = resolveWorkbenchShellMetaField(entries, "workbenchCopy");
  const lastUpdated = resolveWorkbenchShellMetaField(entries, "lastUpdated");
  const statusSummary = resolveWorkbenchShellMetaField(entries, "statusSummary");

  return {
    ...(pageTitle !== undefined ? { pageTitle } : null),
    ...(workbenchCopy !== undefined ? { workbenchCopy } : null),
    ...(lastUpdated !== undefined ? { lastUpdated } : null),
    ...(statusSummary !== undefined ? { statusSummary } : null)
  };
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
    pageTitle: hasMetaValue(value, "pageTitle") ? value.pageTitle ?? null : normalizedFallback.pageTitle ?? null,
    workbenchCopy: hasMetaValue(value, "workbenchCopy")
      ? value.workbenchCopy ?? null
      : normalizedFallback.workbenchCopy ?? null,
    lastUpdated: hasMetaValue(value, "lastUpdated") ? value.lastUpdated ?? null : normalizedFallback.lastUpdated ?? null,
    statusSummary: hasMetaValue(value, "statusSummary")
      ? value.statusSummary ?? null
      : normalizedFallback.statusSummary ?? null
  };
}

export function WorkbenchShellMeta(props: WorkbenchShellMetaInput) {
  useWorkbenchShellMeta(props);
  return null;
}
