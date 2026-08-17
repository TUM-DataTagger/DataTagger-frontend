'use client';

import { ListFilterIcon, XIcon } from 'lucide-react';
import { parseAsBoolean, parseAsString, useQueryStates } from 'nuqs';
import { useEffect, useState } from 'react';
import type { Selection } from 'react-aria-components';
import { useMediaQuery } from 'usehooks-ts';
import { Drawer, DrawerBody, DrawerClose, DrawerContent, DrawerTrigger } from '@/components/ui/Drawer';
import { dropdownItemStyles } from '@/components/ui/Dropdown';
import { Menu, MenuContent, MenuItem, MenuSeparator, MenuTrigger } from '@/components/ui/Menu';
import { Separator } from '@/components/ui/Separator';
import { Tag, TagGroup } from '@/components/ui/TagGroup';
import { cx } from '@/styles/cva';
import { getSelectionSize, getSelectionStringSet } from '@/util/selection';

export function useFilterState({
	label,
	options,
	queryKey,
}: {
	readonly label: string;
	readonly options: Record<string, string>;
	readonly queryKey: string;
}) {
	const [queryStates, setQueryStates] = useQueryStates({
		[queryKey]: parseAsString,
		reset_filters: parseAsBoolean,
	});
	const [isMenuOpen, setIsMenuOpen] = useState(false);
	const initialSelection = queryStates[queryKey];
	const [selected, setSelected] = useState<Set<string>>(
		typeof initialSelection === 'string' ? new Set([initialSelection]) : new Set<string>(),
	);

	const handleSelectionChange = async (keys: Selection) => {
		const normalizedKeys = getSelectionStringSet(keys, Object.keys(options));

		if (normalizedKeys.size === 0 || normalizedKeys.has('reset')) {
			setSelected(new Set());
			await setQueryStates({ [queryKey]: null, reset_filters: null });
		} else if (normalizedKeys.size >= 2) {
			setSelected(normalizedKeys);
			await setQueryStates({ [queryKey]: null, reset_filters: null });
		} else {
			setSelected(normalizedKeys);
			await setQueryStates({ [queryKey]: [...normalizedKeys].join(','), reset_filters: null });
		}
	};

	useEffect(() => {
		if (queryStates.reset_filters) {
			setSelected(new Set());
			void setQueryStates({ [queryKey]: null, reset_filters: null });
		}
	}, [queryStates.reset_filters, setQueryStates, queryKey]);

	return {
		isMenuOpen,
		setIsMenuOpen,
		label,
		options,
		selected,
		handleSelectionChange,
	};
}

export function FilterMenu(props: {
	readonly filterState?: ReturnType<typeof useFilterState>;
	readonly filterStates?: ReturnType<typeof useFilterState>[];
	readonly isDisabled?: boolean;
	readonly label: string;
}) {
	const isMobile = useMediaQuery('(max-width: 600px)', { initializeWithValue: false });
	const filterState = props.filterState;

	const numberOfSelectedFilters =
		props.filterStates?.reduce(
			(acc, filterState) => acc + getSelectionSize(filterState.selected, Object.keys(filterState.options)),
			0,
		) ?? 0;

	return isMobile && props.filterStates?.length ? (
		<div className="md:hidden">
			<Drawer withNotch={false}>
				<DrawerTrigger
					aria-label="Filter menu"
					className="'h-8 dark:pressed:outline-base-lavender-600' gap-2 rounded-lg border border-base-neutral-100 py-1 pr-4 pl-2 hover:bg-base-neutral-100 dark:border-base-neutral-700 dark:hover:bg-base-neutral-700 pressed:border-transparent pressed:bg-base-neutral-300 pressed:outline-2 pressed:outline-offset-2 pressed:outline-base-lavender-400 dark:pressed:border-transparent dark:pressed:bg-base-neutral-600"
					isDisabled={props.isDisabled}
					variant="unset"
				>
					<ListFilterIcon aria-hidden size={18} strokeWidth={1.5} />
					{numberOfSelectedFilters
						? `${numberOfSelectedFilters > 1 ? `${numberOfSelectedFilters} filters` : `${numberOfSelectedFilters} filter`} set`
						: props.label}
				</DrawerTrigger>
				<DrawerContent aria-label="Filter menu">
					<DrawerBody>
						<div className="flex flex-col gap-2">
							<div className="flex flex-col gap-4">
								{props.filterStates?.map((filterState) => (
									<TagGroup
										key={filterState.label}
										label={filterState.label}
										onSelectionChange={async (keys) => filterState.handleSelectionChange(keys)}
										selectedKeys={filterState.selected}
										selectionMode="multiple"
									>
										{Object.entries(filterState.options).map(([key, label]) => (
											<Tag color="filter" id={key} key={key}>
												{label}
											</Tag>
										))}
									</TagGroup>
								))}
							</div>
							<Separator />
							<DrawerClose
								aria-label="Reset all filters"
								className={dropdownItemStyles({ className: 'text-base-sm flex place-content-start gap-2' })}
								onPress={async () => {
									await Promise.all(
										props.filterStates?.map(async (filterState) => filterState.handleSelectionChange(new Set())) ?? [],
									);
								}}
								variant="unset"
							>
								<XIcon aria-hidden size={18} strokeWidth={1.5} /> Reset all
							</DrawerClose>
						</div>
					</DrawerBody>
				</DrawerContent>
			</Drawer>
		</div>
	) : filterState ? (
		<Menu isOpen={filterState.isMenuOpen} onOpenChange={filterState.setIsMenuOpen}>
			<MenuTrigger
				aria-label="Filter menu"
				className={cx(
					'h-8 gap-2 rounded-lg border border-base-neutral-100 py-1 pr-4 pl-2 hover:bg-base-neutral-100 dark:border-base-neutral-700 dark:hover:bg-base-neutral-700 pressed:border-transparent pressed:bg-base-neutral-300 pressed:outline-2 pressed:outline-offset-2 pressed:outline-base-lavender-400 dark:pressed:border-transparent dark:pressed:bg-base-neutral-600 dark:pressed:outline-base-lavender-600',
					filterState.selected.size ? 'pr-1' : '',
				)}
				isDisabled={props.isDisabled}
				variant="unset"
			>
				<ListFilterIcon aria-hidden size={18} strokeWidth={1.5} />
				<span className="inline-flex place-items-center gap-3">
					{props.label}
					{filterState.selected.size > 0 ? (
						<span className="inline-flex place-items-center gap-1 text-base-sm">
							{filterState.selected.size < 3 ? (
								[...filterState.selected].map((key) => (
									<span className="rounded-sm bg-base-neutral-100 px-2 py-1 dark:bg-base-neutral-700" key={key}>
										{filterState.options[key]}
									</span>
								))
							) : (
								<span className="rounded-sm bg-base-neutral-100 px-2 py-1 dark:bg-base-neutral-700">
									{filterState.selected.size} selected
								</span>
							)}
						</span>
					) : null}
				</span>
			</MenuTrigger>
			<MenuContent
				onSelectionChange={async (keys) => filterState.handleSelectionChange(keys)}
				placement="bottom start"
				selectedKeys={filterState.selected}
				selectionMode="multiple"
				popover={{ arrow: false }}
			>
				{Object.entries(filterState.options).map(([key, label]) => (
					<MenuItem id={key} key={key}>
						{label}
					</MenuItem>
				))}
				{filterState.selected.size > 0 ? (
					<>
						<MenuSeparator />
						<MenuItem disallowSelection id="reset">
							<span className="flex place-items-center gap-2">
								<XIcon aria-hidden size={18} strokeWidth={1.5} /> Reset
							</span>
						</MenuItem>
					</>
				) : null}
			</MenuContent>
		</Menu>
	) : null;
}
