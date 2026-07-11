import { cn } from '../../utils/helpers';

export function Table({ headers, rows, className }) {
  return (
    <div className={cn('overflow-x-auto my-6 rounded-xl border border-slate-200', className)}>
      <table className="w-full border-collapse text-sm">
        {headers && (
          <thead>
            <tr className="bg-slate-50">
              {headers.map((header, i) => (
                <th
                  key={i}
                  className="px-4 py-3 text-left font-semibold text-slate-700 border-b-2 border-slate-200 text-xs uppercase tracking-wider"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
        )}
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={i}
              className={cn(
                'border-b border-slate-100 last:border-b-0',
                'hover:bg-slate-50 transition-colors'
              )}
            >
              {row.map((cell, j) => (
                <td key={j} className="px-4 py-3 text-slate-600">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Table;
