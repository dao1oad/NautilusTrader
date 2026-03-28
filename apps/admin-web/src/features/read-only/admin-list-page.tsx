import type { UseQueryResult } from "@tanstack/react-query";
import { useEffect, useId, useState, type ReactNode } from "react";

import { useWorkbenchShellMeta } from "../../app/workbench-shell-meta";
import type { AdminListSnapshot } from "../../shared/types/admin";
import { FilterBar } from "../../shared/ui/filter-bar";
import { LastUpdatedBadge } from "../../shared/ui/last-updated-badge";
import { SectionPanel } from "../../shared/ui/section-panel";
import { StateBanner } from "../../shared/ui/state-banner";
import { TerminalTable, type TerminalTableColumn } from "../../shared/ui/terminal-table";
import { useAdminRuntime } from "../../app/admin-runtime";


type Props<T> = {
  title: string;
  query: UseQueryResult<AdminListSnapshot<T>, Error>;
  emptyDescription: string;
  loadingDescription: string;
  summaryCopy?: string;
  tableLabel: string;
  columns: readonly TerminalTableColumn<T>[];
  getRowKey: (item: T, index: number) => string;
  summary?: ReactNode;
  pagination?: {
    pageSize: number;
  };
  drillDown?: {
    title: string;
    getButtonLabel: (item: T, index: number, expanded: boolean) => string;
    render: (item: T) => ReactNode;
  };
  filter?: {
    getSearchText: (item: T) => string;
    placeholder?: string;
  };
};

type SnapshotProps<T, TSnapshot extends AdminListSnapshot<T>> = Omit<Props<T>, "query"> & {
  query: UseQueryResult<TSnapshot, Error>;
};

function renderResourceErrors(errors: AdminListSnapshot<unknown>["errors"]) {
  if (errors.length === 0) {
    return null;
  }

  return (
    <ul className="resource-errors">
      {errors.map((resourceError) => (
        <li key={`${resourceError.section}:${resourceError.message}`}>
          <strong>{resourceError.section}</strong>
          {`: ${resourceError.message}`}
        </li>
      ))}
    </ul>
  );
}

export function AdminListPage<T, TSnapshot extends AdminListSnapshot<T>>({
  title,
  query,
  emptyDescription,
  loadingDescription,
  summaryCopy,
  tableLabel,
  columns,
  getRowKey,
  summary,
  pagination,
  drillDown,
  filter
}: SnapshotProps<T, TSnapshot>) {
  const { connectionState, error: runtimeError } = useAdminRuntime();
  const filterInputId = useId();
  const [pageIndex, setPageIndex] = useState(0);
  const [filterText, setFilterText] = useState("");
  const [selectedRowKey, setSelectedRowKey] = useState<string | null>(null);
  const snapshot = query.data ?? null;
  const error = query.error instanceof Error ? query.error.message : runtimeError;
  const hasCachedError = Boolean(error) && Boolean(snapshot);
  const isStale = connectionState === "stale" || hasCachedError;
  const lastUpdated = snapshot ? <LastUpdatedBadge stale={isStale} timestamp={snapshot.generated_at} /> : null;
  const pageSize = pagination?.pageSize ?? null;
  const normalizedFilterText = filterText.trim().toLowerCase();
  const filteredItems =
    snapshot == null
      ? []
      : normalizedFilterText === "" || filter == null
        ? snapshot.items
        : snapshot.items.filter((item) => filter.getSearchText(item).toLowerCase().includes(normalizedFilterText));
  const totalItems = filteredItems.length;
  const totalPages = pageSize === null || totalItems === 0 ? 1 : Math.ceil(totalItems / pageSize);
  const currentPage = Math.min(pageIndex, totalPages - 1);
  const startIndex = pageSize === null ? 0 : currentPage * pageSize;
  const endIndex = pageSize === null || !snapshot ? totalItems : Math.min(startIndex + pageSize, totalItems);
  const visibleItems = filteredItems.slice(startIndex, endIndex);
  const pageSummary = pageSize !== null && totalItems > 0 ? `Rows ${startIndex + 1}-${endIndex} of ${totalItems}` : null;

  useWorkbenchShellMeta({
    lastUpdated: snapshot?.generated_at ?? null,
    pageTitle: title,
    workbenchCopy: summaryCopy
  });

  useEffect(() => {
    setPageIndex(0);
  }, [normalizedFilterText]);

  useEffect(() => {
    if (pageIndex !== currentPage) {
      setPageIndex(currentPage);
    }
  }, [currentPage, pageIndex]);

  useEffect(() => {
    if (!snapshot || !selectedRowKey) {
      return;
    }

    const hasSelectedRow = visibleItems.some((item, index) => getRowKey(item, startIndex + index) === selectedRowKey);
    if (!hasSelectedRow) {
      setSelectedRowKey(null);
    }
  }, [getRowKey, selectedRowKey, startIndex, snapshot, visibleItems]);

  const filterToolbar = snapshot && filter ? (
    <FilterBar
      inputId={filterInputId}
      label="Operator filter"
      onChange={setFilterText}
      placeholder={filter.placeholder ?? `Search ${title.toLowerCase()} by keyword`}
      value={filterText}
    />
  ) : null;

  const paginationToolbar = pageSummary ? (
    <div
      style={{
        alignItems: "center",
        display: "flex",
        flexWrap: "wrap",
        gap: "12px",
        justifyContent: "space-between"
      }}
    >
      <p
        style={{
          color: "var(--text-body)",
          fontFamily: "\"IBM Plex Mono\", \"SFMono-Regular\", monospace",
          fontSize: "0.88rem",
          letterSpacing: "0.04em",
          margin: 0
        }}
      >
        {pageSummary}
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
        <button
          type="button"
          className="command-button command-button-secondary"
          disabled={currentPage === 0}
          onClick={() => {
            setPageIndex((current) => Math.max(current - 1, 0));
          }}
        >
          Previous page
        </button>
        <button
          type="button"
          className="command-button command-button-secondary"
          disabled={currentPage >= totalPages - 1}
          onClick={() => {
            setPageIndex((current) => Math.min(current + 1, totalPages - 1));
          }}
        >
          Next page
        </button>
      </div>
    </div>
  ) : null;

  let mainBody: ReactNode;

  if (query.isLoading && !snapshot) {
    mainBody = <StateBanner description={loadingDescription} kind="loading" title="Snapshot acquisition in progress" />;
  } else if (error && !snapshot) {
    mainBody = <StateBanner description={error} kind="error" title="Admin request failed" />;
  } else if (!snapshot && connectionState === "stale") {
    mainBody = (
      <StateBanner
        description="Waiting for a fresh admin snapshot."
        kind="stale"
        title="Runtime snapshot delayed"
      />
    );
  } else if (!snapshot && connectionState === "disconnected") {
    mainBody = (
      <StateBanner
        description="Reconnect the admin API to refresh runtime state."
        kind="stale"
        title="Admin connection unavailable"
      />
    );
  } else if (!snapshot) {
    mainBody = <StateBanner description={loadingDescription} kind="loading" title="Snapshot acquisition in progress" />;
  } else if (isStale) {
    mainBody = (
      <StateBanner
        description={error ?? "Showing the last successfully received admin snapshot."}
        kind="stale"
        meta={lastUpdated}
        title="Snapshot delayed"
      />
    );
  } else if (snapshot.items.length === 0) {
    mainBody = <StateBanner description={emptyDescription} kind="empty" meta={lastUpdated} title="No projected rows" />;
  } else if (filteredItems.length === 0) {
    mainBody = (
      <StateBanner
        description="No rows match the current operator filter."
        kind="empty"
        title="Filter returned no rows"
      />
    );
  } else {
    mainBody = (
      <TerminalTable
        actionColumn={
          drillDown
            ? {
              header: "Details",
              render: (item, rowIndex, rowKey) => {
                const isSelected = rowKey === selectedRowKey;

                return (
                  <button
                    type="button"
                    className="command-button command-button-secondary resource-table-action"
                    aria-pressed={isSelected}
                    aria-label={drillDown.getButtonLabel(item, rowIndex, isSelected)}
                    onClick={() => {
                      setSelectedRowKey(isSelected ? null : rowKey);
                    }}
                  >
                    {isSelected ? "Hide details" : "View details"}
                  </button>
                );
              }
            }
            : undefined
        }
        ariaLabel={tableLabel}
        columns={columns}
        getRowKey={getRowKey}
        items={visibleItems}
        rowIndexOffset={startIndex}
        selectedRowKey={selectedRowKey}
      />
    );
  }

  const selectedItem =
    snapshot && selectedRowKey !== null
      ? visibleItems.find((item, index) => getRowKey(item, startIndex + index) === selectedRowKey) ?? null
      : null;

  return (
    <div className="resource-stack">
      <SectionPanel
        actions={lastUpdated}
        description={summaryCopy}
        eyebrow="Live snapshot"
        meta={snapshot?.partial ? <p className="resource-alert">Showing the latest partial snapshot.</p> : null}
        title={title}
      >
        {snapshot ? renderResourceErrors(snapshot.errors) : null}
        {summary}
        {filterToolbar}
        {paginationToolbar}
        {mainBody}
      </SectionPanel>
      {drillDown && selectedItem ? (
        <SectionPanel eyebrow="Selected row" title={drillDown.title}>
          {drillDown.render(selectedItem)}
        </SectionPanel>
      ) : null}
    </div>
  );
}
