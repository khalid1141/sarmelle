import React, { useState, useMemo } from 'react';

export interface Column<T> {
  key: string;
  header: string;
  sortable?: boolean;
  render?: (item: T) => React.ReactNode;
}

export interface FilterOption {
  label: string;
  value: string;
}

export interface FilterConfig {
  key: string;
  label: string;
  options: FilterOption[];
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  searchPlaceholder?: string;
  searchKey?: keyof T | ((item: T) => string);
  filters?: FilterConfig[];
  filterValues?: Record<string, string>;
  onFilterChange?: (key: string, value: string) => void;
  onSearchChange?: (query: string) => void;
  renderExpandedRow?: (item: T) => React.ReactNode;
  rowKey: (item: T) => string;
}

export function DataTable<T>({
  data,
  columns,
  searchPlaceholder = 'Search...',
  searchKey,
  filters = [],
  filterValues = {},
  onFilterChange,
  renderExpandedRow,
  rowKey,
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  const toggleRow = (key: string) => {
    setExpandedRows((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSort = (key: string, sortable?: boolean) => {
    if (!sortable) return;
    if (sortKey === key) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  // Filter and search logic
  const filteredData = useMemo(() => {
    let result = [...data];

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((item) => {
        if (searchKey) {
          if (typeof searchKey === 'function') {
            return searchKey(item).toLowerCase().includes(q);
          } else {
            const val = item[searchKey];
            return String(val || '').toLowerCase().includes(q);
          }
        }
        // Default search across all object string properties
        return Object.values(item as any).some((val) =>
          String(val || '').toLowerCase().includes(q)
        );
      });
    }

    // Sort
    if (sortKey) {
      result.sort((a, b) => {
        const aVal = (a as any)[sortKey];
        const bVal = (b as any)[sortKey];
        if (aVal === bVal) return 0;
        const comparison = aVal > bVal ? 1 : -1;
        return sortDirection === 'asc' ? comparison : -comparison;
      });
    }

    return result;
  }, [data, searchQuery, searchKey, sortKey, sortDirection]);

  return (
    <div className="space-y-4">
      {/* Controls Bar: Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center bg-white p-4 rounded-lg border border-amber-200/60 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
            {/* Search SVG Icon */}
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full pl-9 pr-4 py-2 text-sm bg-stone-50 border border-stone-300 rounded-md focus:outline-hidden focus:ring-2 focus:ring-stone-900 focus:bg-white transition-colors"
            aria-label="Search table"
          />
        </div>

        {/* Filters */}
        {filters.length > 0 && (
          <div className="flex flex-wrap gap-2 items-center">
            {filters.map((filter) => (
              <div key={filter.key} className="flex items-center gap-1.5">
                <select
                  value={filterValues[filter.key] || ''}
                  onChange={(e) => onFilterChange?.(filter.key, e.target.value)}
                  className="text-sm bg-stone-50 border border-stone-300 rounded-md px-3 py-2 text-stone-700 focus:outline-hidden focus:ring-2 focus:ring-stone-900 focus:bg-white transition-colors"
                  aria-label={`Filter by ${filter.label}`}
                >
                  <option value="">All {filter.label}</option>
                  {filter.options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-lg border border-amber-200/60 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-stone-100 text-stone-700 text-xs font-semibold uppercase tracking-wider border-b border-stone-200">
                {renderExpandedRow && <th className="w-10 px-3 py-3"></th>}
                {columns.map((col) => (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col.key, col.sortable)}
                    className={`px-4 py-3 text-stone-700 ${
                      col.sortable ? 'cursor-pointer hover:bg-stone-200/70 select-none' : ''
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>{col.header}</span>
                      {col.sortable && (
                        <span className="text-stone-400">
                          {sortKey === col.key ? (
                            sortDirection === 'asc' ? (
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="18 15 12 9 6 15" /></svg>
                            ) : (
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9" /></svg>
                            )
                          ) : (
                            <svg className="w-3 h-3 opacity-40" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M7 15l5 5 5-5M7 9l5-5 5 5" /></svg>
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200 text-sm text-stone-800">
              {filteredData.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length + (renderExpandedRow ? 1 : 0)}
                    className="px-4 py-8 text-center text-stone-500 italic"
                  >
                    No records found matching your query.
                  </td>
                </tr>
              ) : (
                filteredData.map((item) => {
                  const key = rowKey(item);
                  const isExpanded = !!expandedRows[key];
                  return (
                    <React.Fragment key={key}>
                      <tr className="hover:bg-stone-50/80 transition-colors">
                        {renderExpandedRow && (
                          <td className="px-3 py-3 text-center">
                            <button
                              type="button"
                              onClick={() => toggleRow(key)}
                              className="p-1 rounded text-stone-500 hover:text-stone-900 hover:bg-stone-200 transition-colors"
                              aria-label={isExpanded ? 'Collapse row' : 'Expand row'}
                            >
                              <svg
                                className={`w-4 h-4 transform transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                viewBox="0 0 24 24"
                              >
                                <polyline points="9 18 15 12 9 6" />
                              </svg>
                            </button>
                          </td>
                        )}
                        {columns.map((col) => (
                          <td key={col.key} className="px-4 py-3">
                            {col.render ? col.render(item) : String((item as any)[col.key] ?? '')}
                          </td>
                        ))}
                      </tr>
                      {renderExpandedRow && isExpanded && (
                        <tr>
                          <td
                            colSpan={columns.length + 1}
                            className="bg-amber-50/20 px-4 py-4 border-t border-b border-amber-100"
                          >
                            {renderExpandedRow(item)}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
