import type { UseQueryResult } from "@tanstack/react-query";
import { useEffect, useId, useState, type ReactNode } from "react";

import { useAdminRuntime } from "../../app/admin-runtime";
import type { AdminListSnapshot } from "../../shared/types/admin";
import { LastUpdatedBadge } from "../../shared/ui/last-updated-badge";
import { PageState } from "../../shared/ui/page-state";


type Column<T> = {
  header: string;
  render: (item: T) => ReactNode;
};

type Props<T> = {
  title: string;
  query: UseQueryResult<AdminListSnapshot<T>, Error>;
  emptyDescription: string;
  loadingDescription: string;
  tableLabel: string;
  columns: Column<T>[];
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
  };
};

type SnapshotProps<T, TSnapshot extends AdminListSnapshot<T>> = Omit<Props<T>, "query"> & {
  query: UseQueryResult<TSnapshot, Error>;
};

export function AdminListPage<T, TSnapshot extends AdminListSnapshot<T>>({
  title,
  query,
  emptyDescription,
  loadingDescription,
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
  const filterLabel = `Filter ${title} rows`;
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
  const pageSummary =
    pageSize !== null && totalItems > 0 ? `Showing ${startIndex + 1}-${endIndex} of ${totalItems} rows` : null;

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

  if (query.isLoading && !snapshot) {
    return <PageState kind="loading" title={title} description={loadingDescription} />;
  }

  if (error && !snapshot) {
    return <PageState kind="error" title={title} description={error} />;
  }

  if (!snapshot && connectionState === "stale") {
    return (
      <PageState
        kind="stale"
        title={title}
        description="Waiting for a fresh admin snapshot."
      />
    );
  }

  if (!snapshot && connectionState === "disconnected") {
    return (
      <PageState
        kind="stale"
        title={title}
        description="Reconnect the admin API to refresh runtime state."
      />
    );
  }

  if (!snapshot) {
    return <PageState kind="loading" title={title} description={loadingDescription} />;
  }

  if (isStale) {
    return (
      <PageState
        kind="stale"
        title={title}
        description={error ?? "Showing the last successfully received admin snapshot."}
        meta={lastUpdated}
      />
    );
  }

  if (snapshot.items.length === 0) {
    return (
      <PageState
        kind="empty"
        title={title}
        description={emptyDescription}
        meta={lastUpdated}
      />
    );
  }

  const filterToolbar = filter ? (
    <div className="resource-filter-toolbar">
      <label className="resource-filter-label" htmlFor={filterInputId}>
        {filterLabel}
      </label>
      <input
        id={filterInputId}
        type="search"
        className="resource-filter-input"
        placeholder={`Search ${title.toLowerCase()} by keyword`}
        value={filterText}
        onChange={(event) => {
          setFilterText(event.target.value);
        }}
      />
    </div>
  ) : null;

  if (filteredItems.length === 0) {
    return (
      <div className="resource-stack">
        <section className="resource-card">
          <div className="resource-header">
            <div>
              <h2>{title}</h2>
              {snapshot.partial ? <p className="resource-alert">Showing the latest partial snapshot.</p> : null}
            </div>
            {lastUpdated}
          </div>
          {snapshot.errors.length > 0 ? (
            <ul className="resource-errors">
              {snapshot.errors.map((resourceError) => (
                <li key={`${resourceError.section}:${resourceError.message}`}>
                  <strong>{resourceError.section}</strong>
                  {`: ${resourceError.message}`}
                </li>
              ))}
            </ul>
          ) : null}
          {summary}
          {filterToolbar}
          <p className="resource-filter-empty">No rows match the current filter.</p>
        </section>
      </div>
    );
  }

  const selectedItem =
    selectedRowKey === null
      ? null
      : visibleItems.find((item, index) => getRowKey(item, startIndex + index) === selectedRowKey) ?? null;

  return (
    <div className="resource-stack">
      <section className="resource-card">
        <div className="resource-header">
          <div>
            <h2>{title}</h2>
            {snapshot.partial ? <p className="resource-alert">Showing the latest partial snapshot.</p> : null}
          </div>
          {lastUpdated}
        </div>
        {snapshot.errors.length > 0 ? (
          <ul className="resource-errors">
            {snapshot.errors.map((resourceError) => (
              <li key={`${resourceError.section}:${resourceError.message}`}>
                <strong>{resourceError.section}</strong>
                {`: ${resourceError.message}`}
              </li>
            ))}
          </ul>
        ) : null}
        {summary}
        {filterToolbar}
        {pageSummary ? (
          <div className="resource-pagination-toolbar">
            <p className="resource-pagination-summary">{pageSummary}</p>
            <div className="resource-pagination-actions">
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
        ) : null}
        <table aria-label={tableLabel} className="resource-table">
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column.header} scope="col">
                  {column.header}
                </th>
              ))}
              {drillDown ? (
                <th scope="col">
                  Details
                </th>
              ) : null}
            </tr>
          </thead>
          <tbody>
            {visibleItems.map((item, index) => {
              const rowIndex = startIndex + index;
              const rowKey = getRowKey(item, rowIndex);
              const isSelected = rowKey === selectedRowKey;

              return (
                <tr key={rowKey}>
                  {columns.map((column) => (
                    <td key={column.header}>{column.render(item)}</td>
                  ))}
                  {drillDown ? (
                    <td>
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
                    </td>
                  ) : null}
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
      {drillDown && selectedItem ? (
        <section className="resource-card resource-detail-card">
          <div className="resource-header">
            <div>
              <h3>{drillDown.title}</h3>
            </div>
          </div>
          {drillDown.render(selectedItem)}
        </section>
      ) : null}
    </div>
  );
}
