'use client';

import { ChevronDownIcon, ChevronUpIcon } from 'lucide-react';
import { parseAsString, useQueryState } from 'nuqs';
import { useState } from 'react';
import type { Selection } from 'react-aria-components';
import { Menu, MenuContent, MenuItem, MenuTrigger } from '@/components/ui/Menu';

export function useSortByState(props: { readonly defaultSort: string }) {
	const [queryState, setQueryState] = useQueryState('sort', parseAsString.withDefault(props.defaultSort));
	const [isMenuOpen, setIsMenuOpen] = useState(false);
	const [selected, setSelected] = useState<Selection>(new Set([queryState]));

	const handleSort = async (sort = 'name') => {
		setSelected(new Set([sort]));
		await setQueryState(sort);
	};

	return {
		isMenuOpen,
		setIsMenuOpen,
		selected,
		setSelected,
		handleSort,
	};
}

export function SortByMenu({
	isDisabled = false,
	...props
}: {
	readonly isDisabled?: boolean | undefined;
	readonly options: Record<string, string>;
	readonly sortState: ReturnType<typeof useSortByState>;
}) {
	return (
		<Menu isOpen={props.sortState.isMenuOpen} onOpenChange={props.sortState.setIsMenuOpen} respectScreen={false}>
			<MenuTrigger
				aria-label="Sort by menu"
				className="pressed:outline-2 pressed:outline-offset-2 pressed:outline-base-lavender-400 dark:pressed:outline-base-lavender-600 h-8 gap-2"
				isDisabled={isDisabled}
				variant="discreet"
			>
				<span>
					Sort by:{' '}
					<span className="text-base-label-md">
						{[...props.sortState.selected].map((key) => props.options[key as keyof typeof props.options]).join(', ')}
					</span>
				</span>
				{props.sortState.isMenuOpen ? (
					<ChevronUpIcon aria-hidden size={18} strokeWidth={1.5} />
				) : (
					<ChevronDownIcon aria-hidden size={18} strokeWidth={1.5} />
				)}
			</MenuTrigger>
			<MenuContent
				disallowEmptySelection
				onSelectionChange={props.sortState.setSelected}
				placement="bottom"
				selectedKeys={props.sortState.selected}
				selectionMode="single"
			>
				{Object.entries(props.options).map(([key, label]) => (
					<MenuItem id={key} key={key} onAction={async () => props.sortState.handleSort(key)}>
						{label}
					</MenuItem>
				))}
			</MenuContent>
		</Menu>
	);
}
