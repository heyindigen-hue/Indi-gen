import { Fragment, type ReactNode } from 'react';
import { flexRender, type Table as ReactTable, type Cell } from '@tanstack/react-table';
import { ArrowRightIcon, ChevronRightIcon } from '@/icons';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useMediaQuery } from '@/hooks/useMediaQuery';

interface DataTableProps<TData> {
  table: ReactTable<TData>;
  loading?: boolean;
  emptyMessage?: string;
  onRowClick?: (row: TData) => void;
  page?: number;
  pageCount?: number;
  onPageChange?: (page: number) => void;
  total?: number;
  limit?: number;
  /**
   * Optional custom card renderer for mobile mode.
   * If not provided, a generic key-value card is rendered from cells.
   */
  renderMobileCard?: (row: TData) => ReactNode;
  /**
   * Column ID to highlight as the primary "title" cell on mobile.
   * Defaults to the first non-display, non-select column.
   */
  primaryColumnId?: string;
}

export function DataTable<TData>({
  table,
  loading,
  emptyMessage = 'No results found',
  onRowClick,
  page = 0,
  pageCount = 1,
  onPageChange,
  total,
  renderMobileCard,
  primaryColumnId,
}: DataTableProps<TData>) {
  const isMobile = useMediaQuery('(max-width: 767px)');
  const columnCount = table.getAllColumns().length;
  const rows = table.getRowModel().rows;

  // ── Mobile card list ─────────────────────────────────────────────
  if (isMobile) {
    return (
      <div className="space-y-3">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="rounded-md border border-border bg-card p-4 space-y-2">
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ))
        ) : rows.length === 0 ? (
          <div className="rounded-md border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            {emptyMessage}
          </div>
        ) : (
          rows.map((row) => {
            if (renderMobileCard) {
              return (
                <div
                  key={row.id}
                  className={cn(
                    'rounded-md border border-border bg-card transition-colors',
                    onRowClick && 'cursor-pointer active:bg-accent hover:bg-accent/50',
                  )}
                  onClick={onRowClick ? () => onRowClick(row.original) : undefined}
                  role={onRowClick ? 'button' : undefined}
                  tabIndex={onRowClick ? 0 : undefined}
                >
                  {renderMobileCard(row.original)}
                </div>
              );
            }

            const cells = row.getVisibleCells();
            const primaryCell =
              cells.find((c: Cell<TData, unknown>) =>
                primaryColumnId ? c.column.id === primaryColumnId : !['select', 'actions'].includes(c.column.id),
              ) ?? cells[0];
            const otherCells = cells.filter(
              (c: Cell<TData, unknown>) => c !== primaryCell && !['select'].includes(c.column.id),
            );

            return (
              <div
                key={row.id}
                className={cn(
                  'rounded-md border border-border bg-card p-4 space-y-2 transition-colors',
                  onRowClick && 'cursor-pointer active:bg-accent hover:bg-accent/50',
                )}
                onClick={onRowClick ? () => onRowClick(row.original) : undefined}
                role={onRowClick ? 'button' : undefined}
                tabIndex={onRowClick ? 0 : undefined}
              >
                {primaryCell && (
                  <div className="font-medium text-sm">
                    {flexRender(primaryCell.column.columnDef.cell, primaryCell.getContext())}
                  </div>
                )}
                {otherCells.length > 0 && (
                  <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
                    {otherCells.map((cell) => {
                      const headerLabel =
                        typeof cell.column.columnDef.header === 'string'
                          ? cell.column.columnDef.header
                          : cell.column.id;
                      if (cell.column.id === 'actions') {
                        return (
                          <Fragment key={cell.id}>
                            <dt className="col-span-2 mt-1.5 flex justify-end" onClick={(e) => e.stopPropagation()}>
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </dt>
                          </Fragment>
                        );
                      }
                      return (
                        <Fragment key={cell.id}>
                          <dt className="text-muted-foreground capitalize">{headerLabel}</dt>
                          <dd className="text-foreground text-right truncate">
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </dd>
                        </Fragment>
                      );
                    })}
                  </dl>
                )}
              </div>
            );
          })
        )}
        {onPageChange && (
          <div className="flex items-center justify-between pt-2 text-xs text-muted-foreground">
            <span>
              {total !== undefined
                ? `Page ${page + 1} of ${pageCount} — ${total.toLocaleString()} total`
                : `Page ${page + 1} of ${pageCount}`}
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                className="h-9"
                disabled={page === 0}
                onClick={() => onPageChange(page - 1)}
              >
                <ArrowRightIcon size={16} className="rotate-180" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-9"
                disabled={page >= pageCount - 1}
                onClick={() => onPageChange(page + 1)}
              >
                <ChevronRightIcon size={16} />
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Desktop / tablet table ───────────────────────────────────────
  return (
    <div>
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    style={header.getSize() !== 150 ? { width: header.getSize() } : undefined}
                    className={cn(header.column.getCanSort() && 'cursor-pointer select-none')}
                    onClick={() => header.column.getCanSort() && header.column.toggleSorting()}
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: columnCount }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-5 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columnCount}
                  className="h-24 text-center text-muted-foreground text-sm"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow
                  key={row.id}
                  className={cn(onRowClick && 'cursor-pointer hover:bg-muted/50')}
                  onClick={onRowClick ? () => onRowClick(row.original) : undefined}
                  data-state={row.getIsSelected() ? 'selected' : undefined}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {onPageChange && (
        <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
          <span>
            {total !== undefined
              ? `Page ${page + 1} of ${pageCount} — ${total.toLocaleString()} total`
              : `Page ${page + 1} of ${pageCount}`}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              className="h-8"
              disabled={page === 0}
              onClick={() => onPageChange(page - 1)}
            >
              <ArrowRightIcon size={16} className="rotate-180" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8"
              disabled={page >= pageCount - 1}
              onClick={() => onPageChange(page + 1)}
            >
              <ChevronRightIcon size={16} />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
