'use client';

import { Command, CommandGroup } from 'cmdk';
import highlightWords from 'highlight-words';
import { useAtom } from 'jotai';
import {
	ArrowRightIcon,
	ChevronsRightIcon,
	ExternalLinkIcon,
	FileIcon,
	FolderIcon,
	PackageIcon,
	PackageOpenIcon,
	SearchIcon,
	XIcon,
	XCircleIcon,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { useDebounceValue } from 'usehooks-ts';
import { Version } from '@/components/Version';
import { Button } from '@/components/ui/Button';
import { Scrollbars } from '@/components/ui/Scrollbars';
import { isCmdKOpenAtom } from '@/stores/cmdk';
import { openAPIClient } from '@/util/clientFetch';
import type { components } from '@/util/openapiSchema';

export function CmdK() {
	const router = useRouter();
	const [isCmdKOpen, setIsCmdKOpen] = useAtom(isCmdKOpenAtom);
	const [search, setSearch] = useState('');
	const [debouncedSearch, setDebouncedSearch] = useDebounceValue('', 250);
	const [searchResults, setSearchResults] = useState<components['schemas']['Search'] | null | undefined>(null);
	const [isMac, setIsMac] = useState(false);

	useEffect(() => {
		setIsMac(navigator.platform.startsWith('Mac') || navigator.platform === 'iPhone');
	}, []);

	const searchResultItems = useMemo(() => {
		const projectResults = searchResults?.projects.map((project) => {
			const chunks = highlightWords({
				text: project.name,
				query: debouncedSearch,
			});

			return (
				<Command.Item
					className="data-[selected='true']:bg-base-neutral-80 dark:data-[selected='true']:bg-base-neutral-700/72 flex min-h-10 cursor-pointer place-items-center gap-2 rounded-sm px-3 py-[10px]"
					key={project.pk}
					onSelect={() => {
						router.push(`/projects/${project.pk}`);
						setIsCmdKOpen(false);
					}}
					value={project.pk}
				>
					<div className="flex grow place-items-center gap-2">
						<PackageIcon aria-hidden className="shrink-0" size={18} strokeWidth={1.5} />
						<div className="flex flex-col gap-1">
							<p aria-label={project.name} className="text-base-md">
								<span aria-hidden>
									{chunks.map(({ text, match, key }) => (
										<span
											className={match ? 'bg-base-green-lime-300 dark:bg-base-green-lime-700 rounded-[1px]' : ''}
											key={key}
										>
											{text}
										</span>
									))}
								</span>
							</p>
							<span className="text-base-sm text-base-neutral-600 dark:text-base-neutral-300">
								{project.created_by.email}
							</span>
						</div>
					</div>
					<ArrowRightIcon aria-hidden className="shrink-0" size={18} strokeWidth={1.5} />
				</Command.Item>
			);
		});

		const folderResults = searchResults?.folders.map((folder) => {
			const chunks = highlightWords({
				text: folder.name,
				query: debouncedSearch,
			});

			return (
				<Command.Item
					className="data-[selected='true']:bg-base-neutral-80 dark:data-[selected='true']:bg-base-neutral-700/72 flex min-h-10 cursor-pointer place-items-center gap-2 rounded-sm px-3 py-[10px]"
					key={folder.pk}
					onSelect={() => {
						router.push(`/projects/${folder.project.pk}/folders/${folder.pk}`);
						setIsCmdKOpen(false);
					}}
					value={folder.pk}
				>
					<div className="flex grow place-items-center gap-2">
						<FolderIcon aria-hidden className="shrink-0" size={18} strokeWidth={1.5} />
						<div className="flex flex-col gap-1">
							<p aria-label={folder.name} className="text-base-md">
								<span aria-hidden>
									{chunks.map(({ text, match, key }) => (
										<span
											className={match ? 'bg-base-green-lime-300 dark:bg-base-green-lime-700 rounded-[1px]' : ''}
											key={key}
										>
											{text}
										</span>
									))}
								</span>
							</p>
							<span className="text-base-sm text-base-neutral-600 dark:text-base-neutral-300">
								Project: {folder.project.name}
							</span>
						</div>
					</div>
					<ArrowRightIcon aria-hidden className="shrink-0" size={18} strokeWidth={1.5} />
				</Command.Item>
			);
		});

		const datasetResults = searchResults?.uploads_datasets.map((dataset) => {
			const chunks = highlightWords({
				text: dataset.display_name ?? '',
				query: debouncedSearch,
			});

			return (
				<Command.Item
					className="data-[selected='true']:bg-base-neutral-80 dark:data-[selected='true']:bg-base-neutral-700/72 flex min-h-10 cursor-pointer place-items-center gap-2 rounded-sm px-3 py-[10px]"
					key={dataset.pk}
					onSelect={() => {
						router.push(
							dataset.folder
								? `/projects/${dataset.folder.project.pk}/folders/${dataset.folder.pk}/files/${dataset.pk}`
								: `/drafts/${dataset.pk}`,
						);
						setIsCmdKOpen(false);
					}}
					value={dataset.pk}
				>
					<div className="flex grow place-items-center gap-2">
						<FileIcon aria-hidden className="shrink-0" size={18} strokeWidth={1.5} />
						<div className="flex flex-col gap-1">
							<p aria-label={dataset.display_name ?? ''} className="text-base-md">
								<span aria-hidden>
									{chunks.map(({ text, match, key }) => (
										<span
											className={match ? 'bg-base-green-lime-300 dark:bg-base-green-lime-700 rounded-[1px]' : ''}
											key={key}
										>
											{text}
										</span>
									))}
								</span>
							</p>
							<span className="text-base-sm text-base-neutral-600 dark:text-base-neutral-300">
								{dataset.folder
									? `Project: ${dataset.folder.project.name} • Folder: ${dataset.folder.name}`
									: 'My draft file'}{' '}
								• {dataset.creation_date}
							</span>
						</div>
					</div>
					<ArrowRightIcon aria-hidden className="shrink-0" size={18} strokeWidth={1.5} />
				</Command.Item>
			);
		});

		// const draftResults = searchResults?.uploads_versions.map((draft) => (
		// 	<Command.Item
		// 		key={draft.pk}
		// 		className="flex min-h-10 cursor-pointer place-items-center gap-2 rounded-sm px-3 py-[10px] data-[selected='true']:bg-base-neutral-80 dark:data-[selected='true']:bg-base-neutral-700/72"
		// 		onSelect={() => {
		// 			// router.push(`/drafts/${draft.pk}`);
		// 			// setIsCmdKOpen(false);
		// 		}}
		// 		value={draft.pk}
		// 	>
		// 		<div className="flex grow flex-col">
		// 			<span className="text-base-md">{draft.name}</span>
		// 		</div>
		// 		<ArrowRight aria-hidden size={18} strokeWidth={1.5} className="shrink-0" />
		// 	</Command.Item>
		// ));

		return folderResults?.length || projectResults?.length || datasetResults?.length /* || draftResults?.length */ ? (
			<div className="flex flex-col gap-4 px-6 py-4">
				{projectResults?.length ? (
					<CommandGroup heading="Projects">
						{projectResults}
						<Command.Item
							className="data-[selected='true']:bg-base-neutral-80 dark:data-[selected='true']:bg-base-neutral-700/72 flex min-h-10 cursor-pointer place-items-center gap-2 rounded-sm px-3 py-[10px]"
							onSelect={() => {
								router.push(`/search?q=${debouncedSearch}`);
								setIsCmdKOpen(false);
							}}
							value="search projects"
						>
							<div className="flex grow place-items-center gap-2">
								<div className="flex flex-col gap-1">
									<p className="text-base-md">View all</p>
								</div>
							</div>
							<ChevronsRightIcon aria-hidden className="shrink-0" size={18} strokeWidth={1.5} />
						</Command.Item>
					</CommandGroup>
				) : null}
				{folderResults?.length ? (
					<CommandGroup heading="Folders">
						{folderResults}
						<Command.Item
							className="data-[selected='true']:bg-base-neutral-80 dark:data-[selected='true']:bg-base-neutral-700/72 flex min-h-10 cursor-pointer place-items-center gap-2 rounded-sm px-3 py-[10px]"
							onSelect={() => {
								router.push(`/search?q=${debouncedSearch}`);
								setIsCmdKOpen(false);
							}}
							value="search folders"
						>
							<div className="flex grow place-items-center gap-2">
								<div className="flex flex-col gap-1">
									<p className="text-base-md">View all</p>
								</div>
							</div>
							<ChevronsRightIcon aria-hidden className="shrink-0" size={18} strokeWidth={1.5} />
						</Command.Item>
					</CommandGroup>
				) : null}
				{datasetResults?.length ? (
					<CommandGroup heading="Files">
						{datasetResults}
						<Command.Item
							className="data-[selected='true']:bg-base-neutral-80 dark:data-[selected='true']:bg-base-neutral-700/72 flex min-h-10 cursor-pointer place-items-center gap-2 rounded-sm px-3 py-[10px]"
							onSelect={() => {
								router.push(`/search?q=${debouncedSearch}`);
								setIsCmdKOpen(false);
							}}
							value="search files"
						>
							<div className="flex grow place-items-center gap-2">
								<div className="flex flex-col gap-1">
									<p className="text-base-md">View all</p>
								</div>
							</div>
							<ChevronsRightIcon aria-hidden className="shrink-0" size={18} strokeWidth={1.5} />
						</Command.Item>
					</CommandGroup>
				) : null}
				{/* <CommandGroup heading="Versions">
					{draftResults?.length ? (
						draftResults
					) : (
						<div role="presentation" className="flex h-12 place-content-center place-items-center text-sm">
							No results found.
						</div>
					)}
				</CommandGroup> */}
			</div>
		) : null;
	}, [router, searchResults, setIsCmdKOpen, debouncedSearch]);

	// Toggle the menu when ⌘K is pressed
	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'k' && (event.metaKey || event.ctrlKey)) {
				event.preventDefault();
				setIsCmdKOpen((open) => !open);
			}
		};

		window.addEventListener('keydown', handleKeyDown);
		return () => window.removeEventListener('keydown', handleKeyDown);
	}, [setIsCmdKOpen]);

	useEffect(() => {
		const searchDoc = async (searchString: string) => {
			const { data } = await openAPIClient.GET('/api/v1/search/global/', {
				params: {
					query: {
						term: searchString,
					},
				},
			});
			setSearchResults(data);
		};

		if (debouncedSearch) {
			void searchDoc(debouncedSearch);
		} else {
			setSearchResults(null);
		}
	}, [debouncedSearch]);

	useEffect(() => {
		if (!isCmdKOpen) {
			setSearch('');
			setDebouncedSearch('');
		}
	}, [isCmdKOpen, setSearch, setDebouncedSearch]);

	return (
		<Command.Dialog
			className="bg-base-neutral-0 dark:bg-base-neutral-800 h-full w-full md:rounded-lg print:hidden"
			label="Command Menu"
			onOpenChange={setIsCmdKOpen}
			open={isCmdKOpen}
			shouldFilter={false}
		>
			<div className="border-base-neutral-100 dark:border-base-neutral-700 relative flex place-items-center gap-3 border-b px-6 py-5">
				<XIcon
					aria-hidden
					className="shrink-0 md:hidden"
					onClick={() => setIsCmdKOpen(false)}
					size={18}
					strokeWidth={1.5}
				/>
				<SearchIcon aria-hidden className="hidden md:block" size={18} strokeWidth={1.5} />
				<Command.Input
					className="placeholder:text-base-neutral-500 dark:placeholder:text-base-neutral-400 w-full bg-transparent pr-20 outline-0"
					onKeyDown={(event) => {
						if (event.key === 'Enter') {
							router.push(`/search?q=${search}`);
							setIsCmdKOpen(false);
						}
					}}
					onValueChange={(value) => {
						setSearch(value);
						setDebouncedSearch(value);
					}}
					placeholder="What are you looking for?"
					value={search}
				/>
				{search ? (
					<Button
						aria-label="Go to search page"
						className="absolute right-[56px] bottom-0 -translate-y-1/4"
						excludeFromTabOrder
						onPress={() => {
							router.push(`/search?q=${search}`);
							setIsCmdKOpen(false);
						}}
						size="icon"
						variant="unset"
					>
						<ArrowRightIcon aria-hidden size={24} strokeWidth={1.5} />
					</Button>
				) : null}
				{search ? (
					<Button
						aria-label="Clear input"
						className="absolute right-[14px] bottom-0 -translate-y-1/4"
						excludeFromTabOrder
						onPress={() => {
							setSearch('');
							setDebouncedSearch('');
						}}
						size="icon"
						variant="unset"
					>
						<XCircleIcon aria-hidden size={24} strokeWidth={1.5} />
					</Button>
				) : null}
			</div>
			<Scrollbars
				className="max-h-[calc(100dvh-4rem)] md:max-h-[482px]"
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
				<Command.List>
					{debouncedSearch && searchResultItems ? (
						searchResultItems
					) : debouncedSearch && !searchResultItems ? (
						<div className="flex flex-col place-content-center place-items-center gap-2 px-6 py-12" role="presentation">
							<span className="text-base-lg text-base-neutral-600 dark:text-base-neutral-300">
								No matching results found
							</span>
							<span className="text-base-neutral-600 dark:text-base-neutral-300">Please try other search inputs.</span>
						</div>
					) : (
						<div className="flex flex-col px-6 py-4">
							<div className="flex flex-col gap-4">
								<CommandGroup heading="Main navigation">
									<Command.Item
										className="data-[selected='true']:bg-base-neutral-80 dark:data-[selected='true']:bg-base-neutral-700/72 flex h-10 cursor-pointer place-items-center gap-2 rounded-sm px-3 py-[10px]"
										onSelect={() => {
											router.push('/drafts');
											setIsCmdKOpen(false);
										}}
									>
										<div className="flex grow gap-2">
											<PackageOpenIcon aria-hidden className="shrink-0" size={18} strokeWidth={1.5} />
											<span className="text-base-md">My draft files</span>
										</div>
										<ArrowRightIcon aria-hidden className="shrink-0" size={18} strokeWidth={1.5} />
									</Command.Item>
									<Command.Item
										className="data-[selected='true']:bg-base-neutral-80 dark:data-[selected='true']:bg-base-neutral-700/72 flex h-10 cursor-pointer place-items-center gap-2 rounded-sm px-3 py-[10px]"
										onSelect={() => {
											router.push('/projects');
											setIsCmdKOpen(false);
										}}
									>
										<div className="flex grow gap-2">
											<PackageIcon aria-hidden className="shrink-0" size={18} strokeWidth={1.5} />
											<span className="text-base-md">Projects</span>
										</div>
										<ArrowRightIcon aria-hidden className="shrink-0" size={18} strokeWidth={1.5} />
									</Command.Item>
								</CommandGroup>
								<CommandGroup heading="About">
									<Command.Item
										className="data-[selected='true']:bg-base-neutral-80 dark:data-[selected='true']:bg-base-neutral-700/72 flex h-10 cursor-pointer place-items-center gap-2 rounded-sm px-3 py-[10px]"
										onSelect={() => {
											router.push('https://domain.com/datatagger');
											setIsCmdKOpen(false);
										}}
									>
										<div className="flex grow flex-col">
											<span className="text-base-md">Contact</span>
										</div>
										<ExternalLinkIcon aria-hidden className="shrink-0" size={18} strokeWidth={1.5} />
									</Command.Item>

									<Command.Item
										className="data-[selected='true']:bg-base-neutral-80 dark:data-[selected='true']:bg-base-neutral-700/72 flex h-10 cursor-pointer place-items-center gap-2 rounded-sm px-3 py-[10px]"
										onSelect={() => {
											router.push('https://domain.com/impressum');
											setIsCmdKOpen(false);
										}}
									>
										<div className="flex grow flex-col">
											<span className="text-base-md">Imprint</span>
										</div>
										<ExternalLinkIcon aria-hidden className="shrink-0" size={18} strokeWidth={1.5} />
									</Command.Item>
									<Command.Item
										className="data-[selected='true']:bg-base-neutral-80 dark:data-[selected='true']:bg-base-neutral-700/72 flex h-10 cursor-pointer place-items-center gap-2 rounded-sm px-3 py-[10px]"
										onSelect={() => {
											router.push('/privacy-policy');
											setIsCmdKOpen(false);
										}}
									>
										<div className="flex grow flex-col">
											<span className="text-base-md">Privacy policy</span>
										</div>
										<ArrowRightIcon aria-hidden className="shrink-0" size={18} strokeWidth={1.5} />
									</Command.Item>
									<Command.Item
										className="data-[selected='true']:bg-base-neutral-80 dark:data-[selected='true']:bg-base-neutral-700/72 flex h-10 cursor-pointer place-items-center gap-2 rounded-sm px-3 py-[10px]"
										onSelect={() => {
											router.push('/accessibility');
											setIsCmdKOpen(false);
										}}
									>
										<div className="flex grow flex-col">
											<span className="text-base-md">Accessibility</span>
										</div>
										<ArrowRightIcon aria-hidden className="shrink-0" size={18} strokeWidth={1.5} />
									</Command.Item>
									<Command.Item
										className="data-[selected='true']:bg-base-neutral-80 dark:data-[selected='true']:bg-base-neutral-700/72 flex h-10 cursor-pointer place-items-center gap-2 rounded-sm px-3 py-[10px]"
										onSelect={() => {
											router.push('/terms-of-use');
											setIsCmdKOpen(false);
										}}
									>
										<div className="flex grow flex-col">
											<span className="text-base-md">Terms of use</span>
										</div>
										<ArrowRightIcon aria-hidden className="shrink-0" size={18} strokeWidth={1.5} />
									</Command.Item>
									<Command.Item
										className="data-[selected='true']:bg-base-neutral-80 dark:data-[selected='true']:bg-base-neutral-700/72 flex h-10 cursor-pointer place-items-center gap-2 rounded-sm px-3 py-[10px]"
										onSelect={() => {
											router.push('/faq');
											setIsCmdKOpen(false);
										}}
									>
										<div className="flex grow flex-col">
											<span className="text-base-md">FAQ</span>
										</div>
										<ArrowRightIcon aria-hidden className="shrink-0" size={18} strokeWidth={1.5} />
									</Command.Item>
								</CommandGroup>
							</div>
							<div className="border-base-neutral-100 dark:border-base-neutral-700 mt-3 flex flex-col place-content-between place-items-center gap-4 border-t px-3 pt-4 md:flex-row">
								<span className="text-base-sm text-base-neutral-600 dark:text-base-neutral-300">
									The source code is available on GitHub
								</span>
								<Version className="text-base-sm" />
								<span className="text-base-sm text-base-neutral-600 dark:text-base-neutral-300 md:hidden">
									TUM University Library
								</span>
							</div>
						</div>
					)}
				</Command.List>
			</Scrollbars>

			<div className="border-base-neutral-100 bg-base-neutral-60 dark:border-base-neutral-700 dark:bg-base-neutral-700/40 hidden place-content-between place-items-center border-t px-6 py-4 md:flex md:rounded-b-lg">
				<span className="text-base-sm text-base-neutral-600 dark:text-base-neutral-300">TUM University Library</span>

				<div className="flex place-items-center gap-2">
					<span className="flex place-items-center gap-2">
						<span className="flex place-items-center gap-1">
							<span className="bg-base-neutral-100 text-base-sm dark:bg-base-neutral-700 dark:text-base-neutral-100 rounded-sm px-2 py-1">
								{isMac ? '⌘' : 'Ctrl'}
							</span>
							<span className="bg-base-neutral-100 text-base-sm dark:bg-base-neutral-700 dark:text-base-neutral-100 rounded-sm px-2 py-1">
								K
							</span>
						</span>
						<span className="text-base-sm">to open</span>
					</span>
					/
					<span className="flex place-items-center gap-2">
						<span className="bg-base-neutral-100 text-base-sm dark:bg-base-neutral-700 dark:text-base-neutral-100 rounded-sm px-2 py-1">
							Esc
						</span>
						<span className="text-base-sm">to close</span>
					</span>
				</div>
			</div>
		</Command.Dialog>
	);
}
