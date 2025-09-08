import React, { useState, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
  ColumnDef,
  SortingState,
  ColumnFiltersState,
} from '@tanstack/react-table';
import { Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import Spinner from './Spinner';

interface DynamicTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  title: string;
  searchPlaceholder?: string;
  pageSize?: number;
  loading?: boolean;
  renderExpandedRow?: (item: T) => React.ReactNode;
  getRowId?: (item: T) => string;
  expandedRowId?: string | null;
}

function DynamicTable<T>({
  data,
  columns,
  title,
  searchPlaceholder = "Buscar...",
  pageSize = 10,
  loading = false,
  renderExpandedRow,
  getRowId,
  expandedRowId
}: DynamicTableProps<T>) {
  console.log('DynamicTable: data received:', data);
  console.log('DynamicTable: data length:', data.length);
  console.log('DynamicTable: columns:', columns);
  
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: pageSize,
  });

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: 'includesString',
    state: {
      sorting,
      columnFilters,
      globalFilter,
      pagination,
    },
  });

  // Debug table configuration
  console.log('DynamicTable: Table configuration');
  console.log('DynamicTable: data passed to table:', data);
  console.log('DynamicTable: columns passed to table:', columns);
  console.log('DynamicTable: table.getRowModel().rows:', table.getRowModel().rows);
  console.log('DynamicTable: table.getFilteredRowModel().rows:', table.getFilteredRowModel().rows);
  
  // Debug pagination
  console.log('DynamicTable: Pagination state:', table.getState().pagination);
  console.log('DynamicTable: Page count:', table.getPageCount());
  console.log('DynamicTable: Current page:', table.getState().pagination.pageIndex);
  console.log('DynamicTable: Page size:', table.getState().pagination.pageSize);
  console.log('DynamicTable: Can go to previous page:', table.getCanPreviousPage());
  console.log('DynamicTable: Can go to next page:', table.getCanNextPage());
  

  const filteredData = useMemo(() => {
    console.log('DynamicTable: filteredData calculation');
    console.log('DynamicTable: data:', data);
    console.log('DynamicTable: data length:', data.length);
    console.log('DynamicTable: globalFilter:', globalFilter);
    console.log('DynamicTable: pagination state:', pagination);
    
    // Get paginated rows
    const paginatedRows = table.getPaginationRowModel().rows;
    console.log('DynamicTable: paginated rows:', paginatedRows);
    console.log('DynamicTable: paginated rows length:', paginatedRows.length);
    
    // Debug: Check if data is being processed correctly
    if (data.length > 0 && paginatedRows.length === 0) {
      console.log('DynamicTable: WARNING - Data exists but paginated is empty!');
      console.log('DynamicTable: Table state:', table.getState());
      console.log('DynamicTable: Pagination state:', table.getState().pagination);
      console.log('DynamicTable: Page count:', table.getPageCount());
      
      // Fallback: try to get core rows directly
      const coreRows = table.getCoreRowModel().rows;
      console.log('DynamicTable: Core rows fallback:', coreRows);
      if (coreRows.length > 0) {
        console.log('DynamicTable: Using core rows as fallback');
        return coreRows;
      }
    }
    
    return paginatedRows;
  }, [table, globalFilter, columnFilters, data, pagination]);

  return (
    <div className="table-container">
      {/* Header */}
      <div className="table-header">
        <h2 className="table-title">{title}</h2>
        <div className="table-filters">
          <div className="table-search">
            <Search className="table-search-icon" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="table-scroll-container">
        <table className="table">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className={`${
                      header.column.getCanSort()
                        ? 'cursor-pointer select-none hover:bg-gray-100'
                        : ''
                    }`}
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <div className="flex items-center gap-2">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                      {header.column.getCanSort() && (
                        <span className="text-gray-400">
                          {{
                            asc: '↑',
                            desc: '↓',
                          }[header.column.getIsSorted() as string] ?? '↕'}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
            <tbody>
                {loading ? (
                    <tr>
                        <td colSpan={columns.length} className="text-center py-12">
                            <div className="flex flex-col items-center justify-center space-y-3">
                                <Spinner size="lg" />
                                <p className="text-gray-500 text-sm">Carregando apólices...</p>
                            </div>
                        </td>
                    </tr>
                ) : filteredData.length === 0 ? (
                    <tr>
                        <td colSpan={columns.length} className="text-center py-8 text-gray-500">
                            {data.length > 0 ? (
                                <div className="flex flex-col items-center space-y-2">
                                    <p>Dados carregados mas não exibidos</p>
                                    <p className="text-sm">Total: {data.length} registros</p>
                                    <button 
                                        onClick={() => window.location.reload()} 
                                        className="btn btn-outline btn-sm"
                                    >
                                        Recarregar
                                    </button>
                                </div>
                            ) : (
                                'Nenhum registro encontrado'
                            )}
                        </td>
                    </tr>
                ) : (
                    filteredData.map((row) => {
                        console.log('DynamicTable: Rendering row:', row.id, row.original);
                        const rowId = getRowId ? getRowId(row.original) : row.id;
                        const isExpanded = expandedRowId === rowId;
                        
                        return (
                            <React.Fragment key={row.id}>
                                <tr className="hover:bg-gray-50">
                                    {row.getVisibleCells().map((cell) => {
                                        console.log('DynamicTable: Rendering cell:', cell.id, cell.getValue());
                                        return (
                                            <td key={cell.id} className="px-4 py-3 border-b border-gray-200">
                                                {flexRender(
                                                    cell.column.columnDef.cell,
                                                    cell.getContext()
                                                )}
                                            </td>
                                        );
                                    })}
                                </tr>
                                {isExpanded && renderExpandedRow && (
                                    <tr>
                                        <td colSpan={columns.length} className="p-0">
                                            {renderExpandedRow(row.original)}
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

      {/* Pagination */}
      <div className="table-pagination">
        <div className="table-pagination-info">
          <div className="flex items-center space-x-4">
            <span>
              Mostrando {pagination.pageIndex * pagination.pageSize + 1} a{' '}
              {Math.min(
                (pagination.pageIndex + 1) * pagination.pageSize,
                table.getFilteredRowModel().rows.length
              )}{' '}
              de {table.getFilteredRowModel().rows.length} registros
            </span>
            <div className="flex items-center space-x-2">
              <label htmlFor="page-size" className="text-sm text-gray-600">
                Por página:
              </label>
              <select
                id="page-size"
                value={pagination.pageSize}
                onChange={(e) => {
                  console.log('DynamicTable: Changing page size to:', e.target.value);
                  setPagination(prev => ({
                    ...prev,
                    pageSize: Number(e.target.value),
                    pageIndex: 0 // Reset to first page when changing page size
                  }));
                }}
                className="px-2 py-1 border border-gray-300 rounded text-sm"
              >
                {[5, 10, 20, 50, 100].map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
        <div className="table-pagination-controls">
          <button
            className="table-pagination-btn min-w-[40px] h-10"
            onClick={() => {
              console.log('DynamicTable: Going to first page');
              setPagination(prev => ({ ...prev, pageIndex: 0 }));
            }}
            disabled={pagination.pageIndex === 0}
            title="Primeira página"
          >
            <ChevronsLeft className="w-4 h-4" />
          </button>
          <button
            className="table-pagination-btn min-w-[40px] h-10"
            onClick={() => {
              console.log('DynamicTable: Going to previous page');
              setPagination(prev => ({ ...prev, pageIndex: Math.max(0, prev.pageIndex - 1) }));
            }}
            disabled={pagination.pageIndex === 0}
            title="Página anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="px-3 py-1 text-sm text-gray-600 min-w-[120px] text-center">
            Página {pagination.pageIndex + 1} de{' '}
            {table.getPageCount()}
          </span>
          <button
            className="table-pagination-btn min-w-[40px] h-10"
            onClick={() => {
              console.log('DynamicTable: Going to next page');
              setPagination(prev => ({ 
                ...prev, 
                pageIndex: Math.min(table.getPageCount() - 1, prev.pageIndex + 1) 
              }));
            }}
            disabled={pagination.pageIndex >= table.getPageCount() - 1}
            title="Próxima página"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            className="table-pagination-btn min-w-[40px] h-10"
            onClick={() => {
              console.log('DynamicTable: Going to last page');
              setPagination(prev => ({ ...prev, pageIndex: table.getPageCount() - 1 }));
            }}
            disabled={pagination.pageIndex >= table.getPageCount() - 1}
            title="Última página"
          >
            <ChevronsRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default DynamicTable;
