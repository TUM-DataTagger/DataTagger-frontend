'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import {
	ArrowRightIcon,
	BlocksIcon,
	ChevronsRightIcon,
	ExternalLinkIcon,
	FileIcon,
	FolderIcon,
	LoaderCircleIcon,
	PackageIcon,
	SearchIcon,
	TextSearchIcon,
	XCircleIcon,
	XIcon,
} from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useDebounceValue } from 'usehooks-ts';
import { HighlightedText } from '@/components/HighlightedText';
import { StackedSubtitle } from '@/components/StackedSubtitle';
import { Version } from '@/components/Version';
import { Button } from '@/components/ui/Button';
import {
	CommandMenu as CommandMenuPrimitive,
	CommandMenuItem,
	CommandMenuList,
	CommandMenuSection,
	CommandMenuShortcut,
	CommandMenuFooter,
} from '@/components/ui/CommandMenu';
import { Input, InputGroup } from '@/components/ui/Input';
import { Scrollbars } from '@/components/ui/Scrollbars';
import { SearchField } from '@/components/ui/SearchField';
import { useBranding } from '@/contexts/BrandingContext';
import { cx } from '@/styles/cva';
import { openAPIClient } from '@/util/clientFetch';
import { formatErrorMessage } from '@/util/formatErrorMessage';
import {
	buildGlobalSearchRequest,
	getCommandMenuSearchSections,
	getGlobalSearchDisplayResults,
	getSearchResultsQueryKey,
	getSearchSchemaQueryKey,
	isSearchSchemaResponse,
	GLOBAL_SEARCH_COMMAND_LIMIT,
} from '@/util/globalSearch';
import type { components } from '@/util/openapiSchema';
import { MAIN_NAVIGATION_ITEMS } from './navigationItems';

const COMMAND_MENU_RESULT_TYPES: components['schemas']['ResultTypesEnum'][] = [
	'project',
	'folder',
	'dataset',
	'template',
];

export function CommandMenu() {
	const router = useRouter();
	const [isCommandMenuOpen, setIsCommandMenuOpen] = useState(false);
	const [search, setSearch] = useState('');
	const [debouncedSearch, setDebouncedSearch] = useDebounceValue('', 250);
	const [isMac, setIsMac] = useState(false);
	const { institution, links } = useBranding();
	const institutionLabel = [institution.shortName, institution.unit].filter(Boolean).join(' ');
	const pathname = usePathname();

	useEffect(() => {
		setIsMac(navigator.platform.startsWith('Mac') || navigator.platform === 'iPhone');
	}, []);

	useEffect(() => {
		setIsCommandMenuOpen(false);
	}, [pathname]);

	const searchSchemaQuery = useQuery({
		queryKey: getSearchSchemaQueryKey(),
		queryFn: async () => {
			const { data, error, response } = await openAPIClient.GET('/api/v1/search/global/schema/');

			if (error || !isSearchSchemaResponse(data)) {
				throw new Error(formatErrorMessage(error ?? {}, response));
			}

			return data;
		},
	});

	const searchQuery = useQuery({
		queryKey: getSearchResultsQueryKey({
			limit: GLOBAL_SEARCH_COMMAND_LIMIT,
			responseMode: 'compact',
			searchText: debouncedSearch,
		}),
		queryFn: async () => {
			const schema = searchSchemaQuery.data;
			if (!schema) {
				return null;
			}

			const request = buildGlobalSearchRequest({
				filters: [],
				limit: GLOBAL_SEARCH_COMMAND_LIMIT,
				responseMode: 'compact',
				schema,
				searchText: debouncedSearch,
				selectedTypes: COMMAND_MENU_RESULT_TYPES,
			});

			const { data, error, response } = await openAPIClient.POST('/api/v1/search/global/', {
				body: { ...request, result_types: COMMAND_MENU_RESULT_TYPES },
			});

			if (error || !data) {
				throw new Error(formatErrorMessage(error ?? {}, response));
			}

			return data;
		},
		enabled: Boolean(debouncedSearch) && Boolean(searchSchemaQuery.data),
		placeholderData: keepPreviousData,
	});

	useEffect(() => {
		if (!isCommandMenuOpen) {
			setSearch('');
			setDebouncedSearch('');
		}
	}, [isCommandMenuOpen, setDebouncedSearch]);

	const searchSections = debouncedSearch
		? getCommandMenuSearchSections(getGlobalSearchDisplayResults(searchQuery.data ?? null))
		: null;
	const isSearchPending = Boolean(debouncedSearch) && (searchSchemaQuery.isPending || searchQuery.isFetching);

	const goToSearch = () => {
		router.push(`/search?q=${encodeURIComponent(search)}`);
		setIsCommandMenuOpen(false);
	};

	const projectResults = searchSections?.projects.map((project) => (
		<CommandMenuItem href={project.href} id={`project-${project.id}`} key={project.id} textValue={project.title}>
			<div className="flex grow place-items-center gap-2">
				<PackageIcon aria-hidden className="shrink-0" size={18} strokeWidth={1.5} />
				<div className="flex flex-col gap-1">
					<p aria-label={project.title} className="text-base-md">
						<HighlightedText query={debouncedSearch} text={project.title} />
					</p>
					{project.subtitle?.length ? <StackedSubtitle lines={project.subtitle} /> : null}
				</div>
			</div>
			<ArrowRightIcon aria-hidden className="shrink-0" size={18} strokeWidth={1.5} />
		</CommandMenuItem>
	));

	const folderResults = searchSections?.folders.map((folder) => (
		<CommandMenuItem href={folder.href} id={`folder-${folder.id}`} key={folder.id} textValue={folder.title}>
			<div className="flex grow place-items-center gap-2">
				<FolderIcon aria-hidden className="shrink-0" size={18} strokeWidth={1.5} />
				<div className="flex flex-col gap-1">
					<p aria-label={folder.title} className="text-base-md">
						<HighlightedText query={debouncedSearch} text={folder.title} />
					</p>
					{folder.subtitle?.length ? <StackedSubtitle lines={folder.subtitle} /> : null}
				</div>
			</div>
			<ArrowRightIcon aria-hidden className="shrink-0" size={18} strokeWidth={1.5} />
		</CommandMenuItem>
	));

	const datasetResults = searchSections?.datasets.map((dataset) => (
		<CommandMenuItem href={dataset.href} id={`dataset-${dataset.id}`} key={dataset.id} textValue={dataset.title}>
			<div className="flex grow place-items-center gap-2">
				<FileIcon aria-hidden className="shrink-0" size={18} strokeWidth={1.5} />
				<div className="flex flex-col gap-1">
					<p aria-label={dataset.title} className="text-base-md">
						<HighlightedText query={debouncedSearch} text={dataset.title} />
					</p>
					{dataset.subtitle?.length ? <StackedSubtitle lines={dataset.subtitle} /> : null}
				</div>
			</div>
			<ArrowRightIcon aria-hidden className="shrink-0" size={18} strokeWidth={1.5} />
		</CommandMenuItem>
	));

	const templateResults = searchSections?.templates.map((template) => (
		<CommandMenuItem href={template.href} id={`template-${template.id}`} key={template.id} textValue={template.title}>
			<div className="flex grow place-items-center gap-2">
				<BlocksIcon aria-hidden className="shrink-0" size={18} strokeWidth={1.5} />
				<div className="flex flex-col gap-1">
					<p aria-label={template.title} className="text-base-md">
						<HighlightedText query={debouncedSearch} text={template.title} />
					</p>
					{template.subtitle?.length ? <StackedSubtitle lines={template.subtitle} /> : null}
				</div>
			</div>
			<ArrowRightIcon aria-hidden className="shrink-0" size={18} strokeWidth={1.5} />
		</CommandMenuItem>
	));

	return (
		<>
			<Button
				className={cx(
					'group h-10 w-10 rounded-full p-[10px] md:w-auto md:rounded-sm md:border md:border-base-neutral-300 md:bg-base-neutral-0 md:py-2 md:pr-2 md:pl-3 md:transition-none md:hover:border-transparent md:hover:bg-base-neutral-700 md:focus-visible:border-transparent md:focus-visible:bg-base-neutral-700 dark:border-base-neutral-500 dark:md:bg-base-neutral-800 dark:md:hover:bg-base-neutral-100 dark:md:focus-visible:bg-base-neutral-100 md:pressed:border-transparent md:pressed:bg-base-neutral-800 dark:md:pressed:bg-base-neutral-60',
				)}
				onPress={() => setIsCommandMenuOpen(true)}
				variant="outline"
			>
				<span className="flex place-items-center gap-4">
					<span className="flex place-items-center gap-3">
						<TextSearchIcon
							aria-hidden
							className="md:group-hover:text-base-neutral-40 md:group-focus-visible:text-base-neutral-40 md:group-pressed:text-base-neutral-40 dark:group-hover:text-base-neutral-900 dark:group-focus-visible:text-base-neutral-900 dark:group-pressed:text-base-neutral-900 dark:md:text-base-neutral-40"
							size={18}
							strokeWidth={1.5}
						/>
						<span className="hidden text-base-label-md md:block">Menu & Search</span>
					</span>
					<span className="hidden place-items-center gap-1 md:flex">
						<CommandMenuShortcut>{isMac ? '⌘' : 'Ctrl'}</CommandMenuShortcut>
						<CommandMenuShortcut>K</CommandMenuShortcut>
					</span>
				</span>
			</Button>

			<CommandMenuPrimitive
				aria-label="Command Menu"
				filter={() => true}
				inputValue={search}
				isOpen={isCommandMenuOpen}
				onInputChange={(value) => {
					setSearch(value);
					setDebouncedSearch(value);
				}}
				onOpenChange={setIsCommandMenuOpen}
				shortcut="k"
				overlay={{ className: 'max-sm:p-0 max-sm:flex max-sm:flex-col' }}
				className="max-sm:grow max-sm:rounded-none max-sm:[--visual-viewport-vertical-padding:0px]"
			>
				<div className="relative">
					<Button
						className="absolute top-4 left-5 z-10 md:hidden"
						variant="unset"
						size="icon-sm"
						onPress={() => setIsCommandMenuOpen(false)}
					>
						<XIcon aria-hidden size={18} strokeWidth={1.5} />
					</Button>
					<SearchField
						autoFocus
						aria-label="Quick search"
						data-slot="command-menu-search"
						className="border-b border-base-neutral-100 px-3 py-5 **:data-[slot=icon]:top-0.75! **:data-[slot=icon]:size-4.5! dark:border-base-neutral-700"
					>
						<InputGroup className="[--input-gutter-end:--spacing(20)]">
							<SearchIcon
								aria-hidden
								className="hidden in-disabled:opacity-38 md:block"
								data-slot="icon"
								size={18}
								strokeWidth={1.5}
							/>
							<Input
								className="h-6 border-0 p-0 outline-0"
								onKeyDown={(event) => {
									if (event.key === 'Enter' && search) {
										goToSearch();
									}
								}}
								placeholder="What are you looking for?"
							/>
							<Button
								aria-label="Go to search page"
								className="absolute right-10.5 h-full group-empty/search-field:invisible"
								onPress={goToSearch}
								size="icon"
								variant="unset"
							>
								<ArrowRightIcon aria-hidden className="size-6 shrink-0 stroke-[1.5]" />
							</Button>
							<Button
								aria-label="Clear search"
								className="h-full group-empty/search-field:invisible"
								size="icon"
								slot="clear"
								type="button"
								variant="unset"
							>
								<XCircleIcon aria-hidden className="size-6 shrink-0 stroke-[1.5]" />
							</Button>
						</InputGroup>
					</SearchField>
				</div>

				<Scrollbars
					defer
					options={{
						overflow: { x: 'hidden' },
						scrollbars: {
							autoHide: 'scroll',
							autoHideDelay: 500,
							autoHideSuspend: true,
							clickScroll: true,
						},
					}}
				>
					{debouncedSearch ? (
						<CommandMenuList className="gap-4 px-6 py-4">
							{projectResults?.length ? (
								<CommandMenuSection label="Projects">
									{projectResults}
									<CommandMenuItem href={`/search?q=${debouncedSearch}`} id="search-projects">
										<div className="flex grow place-items-center gap-2">
											<div className="flex flex-col gap-1">
												<p className="text-base-md">View all</p>
											</div>
										</div>
										<ChevronsRightIcon aria-hidden className="shrink-0" size={18} strokeWidth={1.5} />
									</CommandMenuItem>
								</CommandMenuSection>
							) : null}

							{folderResults?.length ? (
								<CommandMenuSection label="Folders">
									{folderResults}
									<CommandMenuItem href={`/search?q=${debouncedSearch}`} id="search-folders">
										<div className="flex grow place-items-center gap-2">
											<div className="flex flex-col gap-1">
												<p className="text-base-md">View all</p>
											</div>
										</div>
										<ChevronsRightIcon aria-hidden className="shrink-0" size={18} strokeWidth={1.5} />
									</CommandMenuItem>
								</CommandMenuSection>
							) : null}

							{datasetResults?.length ? (
								<CommandMenuSection label="Datasets">
									{datasetResults}
									<CommandMenuItem href={`/search?q=${debouncedSearch}`} id="search-files">
										<div className="flex grow place-items-center gap-2">
											<div className="flex flex-col gap-1">
												<p className="text-base-md">View all</p>
											</div>
										</div>
										<ChevronsRightIcon aria-hidden className="shrink-0" size={18} strokeWidth={1.5} />
									</CommandMenuItem>
								</CommandMenuSection>
							) : null}

							{templateResults?.length ? (
								<CommandMenuSection label="Metadata templates">
									{templateResults}
									<CommandMenuItem href={`/search?q=${debouncedSearch}`} id="search-templates">
										<div className="flex grow place-items-center gap-2">
											<div className="flex flex-col gap-1">
												<p className="text-base-md">View all</p>
											</div>
										</div>
										<ChevronsRightIcon aria-hidden className="shrink-0" size={18} strokeWidth={1.5} />
									</CommandMenuItem>
								</CommandMenuSection>
							) : null}
						</CommandMenuList>
					) : isSearchPending ? (
						<div
							className="flex flex-col place-content-center place-items-center gap-2 px-6 py-12"
							role="presentation"
							data-slot="command-menu-empty-state"
						>
							<LoaderCircleIcon
								aria-hidden
								className="size-6 animate-spin text-base-neutral-600 dark:text-base-neutral-300"
								strokeWidth={1.5}
							/>
							<span className="text-base-neutral-600 dark:text-base-neutral-300">Searching...</span>
						</div>
					) : (
						<div className="flex flex-col px-6 py-4">
							<CommandMenuList className="gap-4 overflow-y-clip">
								<CommandMenuSection label="Main navigation">
									{MAIN_NAVIGATION_ITEMS.map((item) => {
										const Icon = item.icon;
										return (
											<CommandMenuItem href={item.href} id={`nav-${item.id}`} key={item.id}>
												<div className="flex grow gap-2">
													<Icon aria-hidden className="shrink-0" size={18} strokeWidth={1.5} />
													<span className="text-base-md">{item.label}</span>
												</div>
												<ArrowRightIcon aria-hidden className="shrink-0" size={18} strokeWidth={1.5} />
											</CommandMenuItem>
										);
									})}
								</CommandMenuSection>

								<CommandMenuSection label="About">
									{links.contact ? (
										<CommandMenuItem
											id="about-contact"
											href={links.contact}
											rel="noreferrer noopener external"
											target="_blank"
										>
											<div className="flex grow flex-col">
												<span className="text-base-md">Contact</span>
											</div>
											<ExternalLinkIcon aria-hidden className="shrink-0" size={18} strokeWidth={1.5} />
										</CommandMenuItem>
									) : null}

									{links.imprint ? (
										<CommandMenuItem
											id="about-imprint"
											href={links.imprint}
											rel="noreferrer noopener external"
											target="_blank"
										>
											<div className="flex grow flex-col">
												<span className="text-base-md">Imprint</span>
											</div>
											<ExternalLinkIcon aria-hidden className="shrink-0" size={18} strokeWidth={1.5} />
										</CommandMenuItem>
									) : null}

									<CommandMenuItem href="/privacy-policy" id="about-privacy-policy">
										<div className="flex grow flex-col">
											<span className="text-base-md">Privacy policy</span>
										</div>
										<ArrowRightIcon aria-hidden className="shrink-0" size={18} strokeWidth={1.5} />
									</CommandMenuItem>

									<CommandMenuItem href="/accessibility" id="about-accessibility">
										<div className="flex grow flex-col">
											<span className="text-base-md">Accessibility</span>
										</div>
										<ArrowRightIcon aria-hidden className="shrink-0" size={18} strokeWidth={1.5} />
									</CommandMenuItem>

									<CommandMenuItem href="/terms-of-use" id="about-terms-of-use">
										<div className="flex grow flex-col">
											<span className="text-base-md">Terms of use</span>
										</div>
										<ArrowRightIcon aria-hidden className="shrink-0" size={18} strokeWidth={1.5} />
									</CommandMenuItem>

									<CommandMenuItem href="/faq" id="about-faq">
										<div className="flex grow flex-col">
											<span className="text-base-md">FAQ</span>
										</div>
										<ArrowRightIcon aria-hidden className="shrink-0" size={18} strokeWidth={1.5} />
									</CommandMenuItem>
								</CommandMenuSection>
							</CommandMenuList>

							<div className="mt-3 flex flex-col place-content-between place-items-center gap-4 border-t border-base-neutral-100 px-3 pt-4 md:flex-row dark:border-base-neutral-700">
								<span className="text-base-sm text-base-neutral-600 dark:text-base-neutral-300">
									The source code is available on GitHub
								</span>
								<Version className="text-base-sm" />
								<span className="text-base-sm text-base-neutral-600 md:hidden dark:text-base-neutral-300">
									{institutionLabel}
								</span>
							</div>
						</div>
					)}
				</Scrollbars>

				<CommandMenuFooter className="hidden md:flex">
					<span className="text-base-sm text-base-neutral-600 dark:text-base-neutral-300">{institutionLabel}</span>

					<div className="flex place-items-center gap-2">
						<span className="flex place-items-center gap-2">
							<span className="flex place-items-center gap-1">
								<CommandMenuShortcut>{isMac ? '⌘' : 'Ctrl'}</CommandMenuShortcut>
								<CommandMenuShortcut>K</CommandMenuShortcut>
							</span>
							<span className="text-base-sm">to open</span>
						</span>
						/
						<span className="flex place-items-center gap-2">
							<CommandMenuShortcut>Esc</CommandMenuShortcut>
							<span className="text-base-sm">to close</span>
						</span>
					</div>
				</CommandMenuFooter>
			</CommandMenuPrimitive>
		</>
	);
}
