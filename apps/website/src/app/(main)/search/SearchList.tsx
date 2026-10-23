'use client';

import { ArrowRightIcon, BlocksIcon, FileIcon, FolderIcon, FolderTreeIcon, PackageIcon } from 'lucide-react';
import { HighlightedText } from '@/components/HighlightedText';
import { StackedSubtitle } from '@/components/StackedSubtitle';
import { Link } from '@/components/ui/Link';
import { buttonStyles } from '@/styles/ui/button';
import type { GlobalSearchDisplayResult } from '@/util/globalSearch';

function SearchListIcon(props: { readonly resultType: GlobalSearchDisplayResult['resultType'] }) {
	switch (props.resultType) {
		case 'project':
			return <PackageIcon aria-hidden className="shrink-0" size={18} strokeWidth={1.5} />;
		case 'folder':
			return <FolderIcon aria-hidden className="shrink-0" size={18} strokeWidth={1.5} />;
		case 'subfolder':
			return <FolderTreeIcon aria-hidden className="shrink-0" size={18} strokeWidth={1.5} />;
		case 'template':
		case 'template_version':
			return <BlocksIcon aria-hidden className="shrink-0" size={18} strokeWidth={1.5} />;
		case 'dataset':
		case 'dataset_version':
		case 'file':
			return <FileIcon aria-hidden className="shrink-0" size={18} strokeWidth={1.5} />;
	}
}

function SearchListItem(props: { readonly result: GlobalSearchDisplayResult; readonly searchText: string }) {
	const content = (
		<div className="flex grow place-items-center gap-2">
			<SearchListIcon resultType={props.result.resultType} />
			<div className="flex flex-col gap-1">
				<p aria-label={props.result.title} className="text-base-md">
					<HighlightedText query={props.searchText} text={props.result.title} />
				</p>
				{props.result.subtitle?.length ? <StackedSubtitle lines={props.result.subtitle} /> : null}
			</div>
		</div>
	);

	if (props.result.href) {
		return (
			<Link
				className={buttonStyles({
					variant: 'unset',
					className:
						'flex min-h-10 w-full place-items-center gap-2 rounded-sm px-3 py-2.5 text-base-md outline-hidden hover:bg-base-neutral-80 focus-visible:bg-base-neutral-80 pressed:bg-base-neutral-100 dark:hover:bg-base-neutral-700/72 dark:focus-visible:bg-base-neutral-700/72 dark:pressed:bg-base-neutral-700/84',
				})}
				href={props.result.href}
				variant="unset"
			>
				{content}
				<ArrowRightIcon aria-hidden className="shrink-0" size={18} strokeWidth={1.5} />
			</Link>
		);
	}

	return <div className="flex min-h-10 place-items-center gap-2 rounded-sm px-3 py-2.5 text-base-md">{content}</div>;
}

export function SearchList(props: {
	readonly data: readonly GlobalSearchDisplayResult[];
	readonly searchText: string;
}) {
	return (
		<ul className="m-0 flex list-none flex-col gap-4 p-0" aria-label="Search results">
			{props.data.map((result) => (
				<li key={`${result.resultType}-${result.id}`}>
					<SearchListItem result={result} searchText={props.searchText} />
				</li>
			))}
		</ul>
	);
}
