import React from 'react';

// Define a type for a generic data row
interface DataRow {
  [key: string]: any;
}

// Define the properties for a column
interface TableColumn<T extends DataRow> {
  key: keyof T | string; // Key in the data object, or a custom string for computed values
  header: string | React.ReactNode;
  render?: (row: T) => React.ReactNode; // Optional custom renderer for cell content
  className?: string; // Optional class for the header and cell
  headerClassName?: string; // Optional class just for the header
  dataClassName?: string; // Optional class just for the data cells
}

interface TableProps<T extends DataRow> {
  columns: TableColumn<T>[];
  data: T[];
  onRowClick?: (row: T) => void;
  isLoading?: boolean;
  emptyMessage?: string;
  className?: string;
  headerClassName?: string;
  rowClassName?: string | ((row: T) => string);
}

const Table = <T extends DataRow>({
  columns,
  data,
  onRowClick,
  isLoading,
  emptyMessage = 'No data available.',
  className,
  headerClassName,
  rowClassName,
}: TableProps<T>): React.ReactElement => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8 text-blue-600 dark:text-blue-400 text-xl">
        <svg className="animate-spin h-8 w-8 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Loading data...
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500 dark:text-gray-400 text-lg">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className={`overflow-x-auto rounded-lg shadow-md bg-white dark:bg-[#3B5974] ${className || ''}`}>
      <table className="min-w-full divide-y divide-gray-200 dark:divide-[#2A3C4C]">
        <thead className="bg-gray-50 dark:bg-[#2A3C4C]">
          <tr>
            {columns.map((column, index) => (
              <th
                key={typeof column.key === 'string' ? column.key : `col-${index}`}
                scope="col"
                className={`px-6 py-4 text-left text-lg font-semibold text-gray-700 dark:text-[#F5F0E1] uppercase tracking-wider ${column.className || ''} ${column.headerClassName || ''}`}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-[#2A3C4C]">
          {data.map((row, rowIndex) => {
            const rowClass = typeof rowClassName === 'function' ? rowClassName(row) : rowClassName;
            return (
              <tr
                key={row.id || rowIndex} // Assuming 'id' is a common unique key for rows
                className={`hover:bg-gray-50 dark:hover:bg-[#4C769A] transition-colors duration-150
                            ${onRowClick ? 'cursor-pointer' : ''}
                            ${rowIndex % 2 === 0 ? 'bg-white dark:bg-[#3B5974]' : 'bg-gray-50 dark:bg-[#4C769A]'}
                            ${rowClass || ''}`}
                onClick={() => onRowClick && onRowClick(row)}
              >
                {columns.map((column, colIndex) => (
                  <td
                    key={typeof column.key === 'string' ? `${row.id}-${column.key}` : `cell-${rowIndex}-${colIndex}`}
                    className={`px-6 py-4 whitespace-nowrap text-lg text-gray-800 dark:text-[#F5F0E1] ${column.className || ''} ${column.dataClassName || ''}`}
                  >
                    {column.render ? column.render(row) : (row[column.key as keyof T] ?? 'N/A')}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default Table;