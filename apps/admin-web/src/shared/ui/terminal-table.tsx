import type { ReactNode } from "react";


export type TerminalTableColumn<T> = {
  header: ReactNode;
  render: (item: T) => ReactNode;
};

type Props<T> = {
  actionColumn?: {
    header: ReactNode;
    render: (item: T, rowIndex: number, rowKey: string) => ReactNode;
  };
  ariaLabel: string;
  columns: readonly TerminalTableColumn<T>[];
  getRowKey: (item: T, index: number) => string;
  items: readonly T[];
  rowIndexOffset?: number;
  selectedRowKey?: string | null;
};

export function TerminalTable<T>({
  actionColumn,
  ariaLabel,
  columns,
  getRowKey,
  items,
  rowIndexOffset = 0,
  selectedRowKey = null
}: Props<T>) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table aria-label={ariaLabel} className="resource-table" style={{ minWidth: "720px" }}>
        <thead>
          <tr>
            {columns.map((column, index) => (
              <th key={`${ariaLabel}:column:${index}`} scope="col">
                {column.header}
              </th>
            ))}
            {actionColumn ? <th scope="col">{actionColumn.header}</th> : null}
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => {
            const rowIndex = rowIndexOffset + index;
            const rowKey = getRowKey(item, rowIndex);
            const isSelected = rowKey === selectedRowKey;

            return (
              <tr
                key={rowKey}
                style={isSelected ? { background: "rgba(30, 47, 72, 0.72)" } : undefined}
              >
                {columns.map((column, columnIndex) => (
                  <td
                    key={`${rowKey}:column:${columnIndex}`}
                    style={isSelected ? { color: "#fff3d2" } : undefined}
                  >
                    {column.render(item)}
                  </td>
                ))}
                {actionColumn ? (
                  <td style={isSelected ? { color: "#fff3d2" } : undefined}>
                    {actionColumn.render(item, rowIndex, rowKey)}
                  </td>
                ) : null}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
