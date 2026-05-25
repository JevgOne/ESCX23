import type { ReactNode } from 'react';

export interface DataTableColumn<T = object> {
  key: string;
  label: string;
  render?: (row: T) => ReactNode;
}

interface DataTableProps<T = object> {
  columns: DataTableColumn<T>[];
  rows: T[];
  emptyText?: string;
}

export default function DataTable<T extends object>({
  columns,
  rows,
  emptyText = 'Žádná data',
}: DataTableProps<T>) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key}>{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} style={{ textAlign: 'center', color: 'var(--color-text-dim)', padding: '32px' }}>
                {emptyText}
              </td>
            </tr>
          ) : (
            rows.map((row, i) => (
              <tr key={i}>
                {columns.map((col) => (
                  <td key={col.key}>
                    {col.render ? col.render(row) : ((row as Record<string, unknown>)[col.key] as ReactNode)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
