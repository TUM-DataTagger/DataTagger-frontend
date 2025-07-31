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
	const [selected, setSelected] = useState<Selection>(
		queryStates[queryKey] ? new Set([queryStates[queryKey] as string]) : new Set(),
	);

	const handleSelectionChange = async (keys: Set<string>) => {
		if (keys.size === 0 || keys.has('reset')) {
			setSelected(new Set());
			await setQueryStates({ [queryKey]: null, reset_filters: null });
		} else if (keys.size >= 2) {
			setSelected(keys);
			await setQueryStates({ [queryKey]: null, reset_filters: null });
		} else {
			setSelected(keys);
			await setQueryStates({ [queryKey]: [...keys].join(','), reset_filters: null });
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
	readonly label: string;
}) {
	const isMobile = useMediaQuery('(max-width: 600px)', { initializeWithValue: false });

	const numberOfSelectedFilters =
		props.filterStates?.reduce((acc, filterState) => acc + (filterState.selected as Set<string>).size, 0) ?? 0;

	return isMobile && props.filterStates?.length ? (
		<div className="md:hidden">
			<Drawer withNotch={false}>
				<DrawerTrigger
					aria-label="Filter menu"
					className="'h-8 border-base-neutral-100 hover:bg-base-neutral-100 pressed:border-base-neutral-300 pressed:bg-base-neutral-300 pressed:outline-2 pressed:outline-offset-2 pressed:outline-base-lavender-400 dark:border-base-neutral-700 dark:hover:bg-base-neutral-700 dark:pressed:border-base-neutral-600 dark:pressed:bg-base-neutral-600 dark:pressed:outline-base-lavender-600' gap-2 rounded-lg border py-1 pr-4 pl-2"
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
										onSelectionChange={async (keys) => filterState.handleSelectionChange(keys as Set<string>)}
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
	) : props.filterState ? (
		<Menu isOpen={props.filterState.isMenuOpen} onOpenChange={props.filterState.setIsMenuOpen}>
			<MenuTrigger
				aria-label="Filter menu"
				className={cx(
					'border-base-neutral-100 hover:bg-base-neutral-100 pressed:border-base-neutral-300 pressed:bg-base-neutral-300 pressed:outline-2 pressed:outline-offset-2 pressed:outline-base-lavender-400 dark:border-base-neutral-700 dark:hover:bg-base-neutral-700 dark:pressed:border-base-neutral-600 dark:pressed:bg-base-neutral-600 dark:pressed:outline-base-lavender-600 h-8 gap-2 rounded-lg border py-1 pr-4 pl-2',
					(props.filterState.selected as Set<string>).size ? 'pr-1' : '',
				)}
				variant="unset"
			>
				<ListFilterIcon aria-hidden size={18} strokeWidth={1.5} />
				<span className="inline-flex place-items-center gap-3">
					{props.label}
					{(props.filterState.selected as Set<string>).size > 0 ? (
						<span className="text-base-sm inline-flex place-items-center gap-1">
							{(props.filterState.selected as Set<string>).size < 3 ? (
								[...(props.filterState.selected as Set<string>)].map((key) => (
									<span className="bg-base-neutral-100 dark:bg-base-neutral-700 rounded-sm px-2 py-1" key={key}>
										{props.filterState?.options[key as keyof typeof props.filterState.options]}
									</span>
								))
							) : (props.filterState.selected as Set<string>).size >= 3 ? (
								<span className="bg-base-neutral-100 dark:bg-base-neutral-700 rounded-sm px-2 py-1">
									{(props.filterState.selected as Set<string>).size} selected
								</span>
							) : null}
						</span>
					) : null}
				</span>
			</MenuTrigger>
			<MenuContent
				onSelectionChange={async (keys) => props.filterState?.handleSelectionChange(keys as Set<string>)}
				placement="bottom start"
				selectedKeys={props.filterState.selected}
				selectionMode="multiple"
			>
				{Object.entries(props.filterState.options).map(([key, label]) => (
					<MenuItem id={key} key={key}>
						{label}
					</MenuItem>
				))}
				{(props.filterState.selected as Set<string>).size > 0 ? (
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
