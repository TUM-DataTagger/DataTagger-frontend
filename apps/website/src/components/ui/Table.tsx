'use client';

import { ChevronDownIcon, MenuIcon } from 'lucide-react';
import { createContext, use } from 'react';
import type {
	CellProps as RACCellProps,
	ColumnProps as RACColumnProps,
	ColumnResizerProps as RACColumnResizerProps,
	TableHeaderProps as RACTableHeaderProps,
	RowProps as RACRowProps,
	TableBodyProps as RACTableBodyProps,
	TableProps as RACTableProps,
} from 'react-aria-components';
import {
	Cell as RACCell,
	Collection as RACCollection,
	Column as RACColumn,
	ColumnResizer as RACColumnResizer,
	ResizableTableContainer as RACResizableTableContainer,
	Row as RACRow,
	TableBody as RACTableBody,
	TableHeader as RACTableHeader,
	Table as RACTable,
	useTableOptions,
} from 'react-aria-components';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { cva, cx } from '@/styles/cva';
import { composeTailwindRenderProps } from '@/styles/util';

export type TableProps = RACTableProps & {
	readonly allowResize?: boolean;
	readonly bleed?: boolean;
	readonly className?: string;
	readonly grid?: boolean;
	readonly striped?: boolean;
};

const TableContext = createContext<TableProps>({
	allowResize: false,
	bleed: true,
	grid: false,
	striped: false,
});

export function useTableContext() {
	return use(TableContext);
}

export function Table(props: TableProps) {
	return (
		<TableContext.Provider value={props}>
			<div className="flow-root">
				<div className="relative -mx-(--gutter) overflow-x-auto whitespace-nowrap [--gutter-y:--spacing(2)] has-data-[slot=table-resizable-container]:overflow-auto">
					<div className={cx('inline-block min-w-full align-middle', props.bleed === false && '')}>
						{props.allowResize ? (
							<RACResizableTableContainer data-slot="table-resizable-container">
								<RACTable
									{...props}
									className={cx(
										'**:drop-target:border-primary table w-full min-w-full caption-bottom border-spacing-0 text-base-md outline-hidden **:drop-target:border',
										props.className,
									)}
								>
									{props.children}
								</RACTable>
							</RACResizableTableContainer>
						) : (
							<RACTable
								{...props}
								className={cx(
									'**:drop-target:border-primary table w-full min-w-full caption-bottom border-spacing-0 text-base-md outline-hidden **:drop-target:border',
									props.className,
								)}
							>
								{props.children}
							</RACTable>
						)}
					</div>
				</div>
			</div>
		</TableContext.Provider>
	);
}

function ColumnResizer(props: RACColumnResizerProps) {
	return (
		<RACColumnResizer
			{...props}
			className={composeTailwindRenderProps(
				props.className,
				'&[data-resizable-direction=left]:cursor-e-resize &[data-resizable-direction=right]:cursor-w-resize [&[data-resizing]>div]:bg-primary resizable-both:cursor-ew-resize absolute top-0 right-0 bottom-0 grid w-px touch-none place-content-center px-1',
			)}
		>
			<div className="bg-border h-full w-px py-3" />
		</RACColumnResizer>
	);
}

export function TableBody<Type extends object>(props: RACTableBodyProps<Type>) {
	return (
		<RACTableBody
			{...props}
			className={composeTailwindRenderProps(props.className, '[&_.tr:last-child]:border-0')}
			data-slot="table-body"
			renderEmptyState={
				props.renderEmptyState ??
				(() => (
					<div className="flex min-h-56 place-content-center place-items-center">
						<span className="text-base-md text-base-neutral-600 dark:text-base-neutral-300">No records found.</span>
					</div>
				))
			}
		/>
	);
}

export type TableCellProps = RACCellProps & {
	readonly className?: string;
};

const cellStyles = cva({
	base: 'group relative h-16 px-4 py-3 whitespace-nowrap outline-hidden',
	variants: {
		allowResize: {
			true: 'truncate overflow-hidden',
		},
	},
});

export function TableCell(props: TableCellProps) {
	const { allowResize, grid } = useTableContext();

	return (
		<RACCell
			{...props}
			className={composeTailwindRenderProps(props.className, cx(cellStyles({ allowResize }), grid && ''))}
			data-slot="table-cell"
		>
			{props.children}
		</RACCell>
	);
}

const columnStyles = cva({
	base: 'relative h-16 px-4 py-3 text-left whitespace-nowrap allows-sorting:cursor-pointer dragging:cursor-grabbing [&:has([slot=selection])]:pr-0',
	variants: {
		isResizable: {
			true: 'truncate overflow-hidden',
		},
	},
});

export type TableColumnProps = RACColumnProps & {
	readonly className?: string;
	readonly isResizable?: boolean;
};

export function TableColumn({ isResizable = false, ...props }: TableColumnProps) {
	const { grid } = useTableContext();

	return (
		<RACColumn
			{...props}
			className={composeTailwindRenderProps(props.className, cx(columnStyles({ isResizable }), grid && ''))}
			data-slot="table-column"
		>
			{(values) => (
				<div className="flex place-items-center gap-2 **:data-[slot=icon]:shrink-0">
					{typeof props.children === 'function' ? props.children(values) : props.children}
					{values.allowsSorting && (
						<span
							className={cx(
								'grid size-[1.15rem] flex-none shrink-0 place-content-center *:data-[slot=icon]:size-3.5 *:data-[slot=icon]:shrink-0 *:data-[slot=icon]:transition-transform *:data-[slot=icon]:duration-200',
								values.isHovered ? 'bg-base-lavender-100/36' : '',
								props.className,
							)}
						>
							<ChevronDownIcon className={values.sortDirection === 'ascending' ? 'rotate-180' : ''} />
						</span>
					)}
					{isResizable && <ColumnResizer />}
				</div>
			)}
		</RACColumn>
	);
}

export type TableHeaderProps<Type extends object> = RACTableHeaderProps<Type> & {
	readonly className?: string;
};

export function TableHeader<Type extends object>(props: TableHeaderProps<Type>) {
	const { selectionBehavior, selectionMode, allowsDragging } = useTableOptions();

	return (
		<RACTableHeader
			{...props}
			className={composeTailwindRenderProps(
				props.className,
				'border-base-neutral-100 dark:border-base-neutral-700 border-b',
			)}
			data-slot="table-header"
		>
			{allowsDragging && <RACColumn className="w-0" data-slot="table-column" />}
			{selectionBehavior === 'toggle' && (
				<RACColumn className="w-0 pl-4" data-slot="table-column">
					{selectionMode === 'multiple' && <Checkbox slot="selection" />}
				</RACColumn>
			)}
			<RACCollection items={props.columns!}>{props.children}</RACCollection>
		</RACTableHeader>
	);
}

export type TableRowProps<Type extends object> = RACRowProps<Type> & {
	readonly className?: string;
};

export function TableRow<Type extends object>(props: TableRowProps<Type>) {
	const { selectionMode, selectionBehavior, allowsDragging } = useTableOptions();
	const { striped } = useTableContext();

	return (
		<RACRow
			{...props}
			className={composeTailwindRenderProps(
				props.className,
				cx(
					[
						'tr group relative cursor-default border-b -outline-offset-2 outline-base-lavender-400 focus-visible:outline-2 dark:outline-base-lavender-600 forced-colors:outline-[Highlight]',
						'border-base-neutral-100 bg-base-neutral-0 dark:border-base-neutral-700 dark:bg-base-neutral-800',
						striped && '',
						'selected:bg-base-lavender-100/36 dark:selected:bg-base-lavender-900/38',
					],
					'href' in props
						? [
								'cursor-pointer',
								'[&:hover]:bg-base-lavender-100/36 dark:[&:hover]:bg-base-lavender-900/36',
								'pressed:bg-base-lavender-100! dark:pressed:bg-base-lavender-900!',
								'selected:[&:hover]:bg-base-lavender-100/72! dark:selected:[&:hover]:bg-base-lavender-900/72!',
								'selected:focus-visible:bg-base-lavender-100/72! dark:selected:focus-visible:bg-base-lavender-900/72!',
							]
						: ['[&:hover]:bg-base-neutral-60/38 dark:[&:hover]:bg-base-neutral-700/38'],
				),
			)}
			data-slot="table-row"
			href={selectionMode === 'multiple' || selectionMode === 'single' ? '' : props.href!}
			id={props.id!}
		>
			{allowsDragging && (
				<TableCell className="group cursor-grab px-0 dragging:cursor-grabbing">
					<Button slot="drag">
						<MenuIcon />
					</Button>
				</TableCell>
			)}
			{selectionBehavior === 'toggle' && (
				<TableCell className="pl-4">
					<Checkbox slot="selection" />
				</TableCell>
			)}
			<RACCollection items={props.columns!}>{props.children}</RACCollection>
		</RACRow>
	);
}
