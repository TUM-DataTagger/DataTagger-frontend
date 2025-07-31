'use client';

import { format } from '@formkit/tempo';
import { createColumnHelper, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { FileIcon, FolderIcon, PackageIcon, Wand2Icon } from 'lucide-react';
import Link from 'next/link';
import { Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from '@/components/ui/Table';
import { Tag, TagGroup } from '@/components/ui/TagGroup';
import { buttonStyles } from '@/styles/ui/button';
import type { components } from '@/util/openapiSchema';

type Search = components['schemas']['Search'];

function transformSearchResults(data: Search) {
	return [
		...data.projects.map((item) => ({ type: 'projects' as const, data: item })),
		...data.folders.map((item) => ({ type: 'folders' as const, data: item })),
		...data.uploads_datasets.map((item) => ({ type: 'uploads_datasets' as const, data: item })),
		// ...data.uploads_versions.map((item) => ({ type: 'uploads_versions' as const, data: item })),
	].flat();
}

function generateLink({ type, data }: ReturnType<typeof transformSearchResults>[0]) {
	switch (type) {
		case 'projects':
			return `/projects/${data.pk}`;
		case 'folders':
			return `/projects/${data.project.pk}/folders/${data.pk}`;
		case 'uploads_datasets': {
			if (data?.folder) {
				return `/projects/${data.folder?.project.pk}/folders/${data?.folder?.pk}/files/${data.pk}`;
			}

			return `/drafts/${data.pk}`;
		}

		default:
			return '';
	}
}

const columnHelper = createColumnHelper<ReturnType<typeof transformSearchResults>[0]>();

const defaultColumns = [
	columnHelper.display({
		header: 'Name',
		cell: (info) => (
			<Link
				className={buttonStyles({
					variant: 'unset',
					className: 'group-hover:text-base-lavender-600 dark:group-hover:text-base-lavender-400',
				})}
				href={generateLink(info.row.original)}
			>
				<span className="max-w-[30ch] truncate">
					{info.row.original.type === 'uploads_datasets'
						? (info.row.original.data.display_name ?? 'Empty dataset')
						: info.row.original.data.name}
				</span>
			</Link>
		),
		size: 300,
	}),
	columnHelper.display({
		header: 'Badge',
		cell: (info) => (
			<TagGroup aria-label={info.row.original.type}>
				<Tag color="neutral" textValue={info.row.original.type}>
					{info.row.original.type === 'projects' ? (
						<PackageIcon aria-hidden size={18} strokeWidth={1.5} />
					) : info.row.original.type === 'folders' ? (
						<FolderIcon aria-hidden size={18} strokeWidth={1.5} />
					) : (
						<FileIcon aria-hidden size={18} strokeWidth={1.5} />
					)}
					{info.row.original.type === 'projects' ? 'Project' : info.row.original.type === 'folders' ? 'Folder' : 'File'}
				</Tag>
			</TagGroup>
		),
	}),
	columnHelper.display({
		header: 'Size',
		cell: (info) =>
			info.row.original.type === 'uploads_datasets' ? (
				<div className="text-center">
					{/* {convertDataRateLog(
						info.row.original?.data.latest_version?.version_file?.metadata?.find(
							(metadata) => metadata.custom_key === 'FILE_SIZE',
						)?.value,
					) ?? '...'} */}
				</div>
			) : null,
	}),
	columnHelper.accessor('data.creation_date', {
		header: 'Created at',
		cell: (info) => (
			<span className="text-base-sm text-base-neutral-600 dark:text-base-neutral-300 inline-flex h-full place-items-center gap-2">
				<Wand2Icon aria-hidden size={18} strokeWidth={1.5} /> {format(info.getValue(), 'MMM D, YYYY hh:mm', 'en')}
			</span>
		),
	}),
	columnHelper.display({
		header: 'Actions',
		// eslint-disable-next-line arrow-body-style
		cell: (_info) => {
			return (
				<div className="flex place-content-end">
					{/* <DraftsMoreMenu
						fileUuid={info.row.original.pk}
						filename={info.row.original.display_name}
						versionUuid={info.row.original.latest_version?.pk}
					/>
					<DraftsMobileMoreMenu
						fileUuid={info.row.original.pk}
						filename={info.row.original.display_name}
						versionUuid={info.row.original.latest_version?.pk}
					/> */}
				</div>
			);
		},
		size: 50,
	}),
];

export function SearchTable(props: { readonly data?: Search | undefined }) {
	// eslint-disable-next-line react-compiler/react-compiler
	'use no memo';

	const results = transformSearchResults(props.data!);

	const table = useReactTable({
		columns: defaultColumns,
		data: results ?? [],
		getCoreRowModel: getCoreRowModel(),
		defaultColumn: {
			size: 100,
		},
	});

	return (
		<div className="flex flex-col">
			<Table aria-label="Search results">
				<TableHeader className="hidden">
					{table.getFlatHeaders().map((header) => (
						<TableColumn id={header.id} isRowHeader key={header.id} style={{ width: `${header.column.getSize()}px` }}>
							{header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
						</TableColumn>
					))}
				</TableHeader>
				<TableBody>
					{table.getRowModel().rows.map((row) => (
						<TableRow href={generateLink(row.original)} key={row.id}>
							{row.getVisibleCells().map((cell) => (
								<TableCell
									key={cell.id}
									style={{ width: `${cell.column.getSize()}px` }}
									textValue={cell.getValue() as string}
								>
									{flexRender(cell.column.columnDef.cell, cell.getContext())}
								</TableCell>
							))}
						</TableRow>
					))}
				</TableBody>
			</Table>
		</div>
	);
}
