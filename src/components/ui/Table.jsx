import { cellValue, rowKey } from '../../utils/format'

export function Table({
  columns,
  rows,
  emptyMessage = 'No data',
  keyField = 'id',
  rowClassName,
}) {
  if (!rows?.length) {
    return (
      <p className="text-center text-ak-muted py-10 text-sm">{emptyMessage}</p>
    )
  }

  return (
    <div className="overflow-x-auto -mx-6">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-ak-border bg-ak-pale">
            {columns.map((col) => (
              <th
                key={col.key}
                className="text-left px-6 py-3 font-semibold text-ak-muted text-xs uppercase tracking-wider"
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={rowKey(row[keyField], i)}
              className={`border-b border-ak-border/60 hover:bg-ak-pale/80 transition-colors ${
                rowClassName?.(row, i) ?? ''
              }`}
            >
              {columns.map((col) => (
                <td key={col.key} className="px-6 py-3.5 text-ak-text">
                  {col.render ? col.render(row) : cellValue(row[col.key])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
