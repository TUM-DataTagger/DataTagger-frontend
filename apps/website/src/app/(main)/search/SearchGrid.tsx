'use client';

import { format } from '@formkit/tempo';
import { FileIcon, FolderIcon, PackageIcon, Wand2Icon } from 'lucide-react';
import { LinkGridCard } from '@/components/ui/GridCard';
import { Tag, TagGroup } from '@/components/ui/TagGroup';
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

export function SearchGrid(props: { readonly data?: Search }) {
	const results = transformSearchResults(props.data!);

	return (
		<div className="flex flex-wrap gap-6">
			{results?.map((search) => (
				<div className="relative h-[150px] w-full min-w-64 gap-6 md:w-auto" key={search.data.pk}>
					<div className="absolute top-2 right-2">
						{/* <DraftsMoreMenu
							fileUuid={search.pk}
							filename={search.display_name}
							versionUuid={search.latest_version?.pk}
						/>
						<DraftsMobileMoreMenu
							fileUuid={search.pk}
							filename={search.display_name}
							versionUuid={search.latest_version?.pk}
						/> */}
					</div>
					<LinkGridCard className="h-full" href={generateLink(search)}>
						<div className="flex grow flex-col place-content-between">
							<div className="flex flex-col gap-3">
								<span className="group-active:text-base-neutral-900 group-hover:text-base-lavender-600 group-hover:group-active:text-base-neutral-900 group-focus-visible:text-base-lavender-600 dark:group-active:text-base-neutral-40 dark:group-hover:text-base-lavender-400 dark:group-hover:group-active:text-base-neutral-40 dark:group-focus-visible:text-base-lavender-400 line-clamp-2 max-w-[25ch] break-words text-ellipsis">
									{search.type === 'uploads_datasets'
										? (search.data.display_name ?? 'Empty dataset')
										: search.data.name}
								</span>
								<TagGroup aria-label={search.type}>
									<Tag color="neutral" textValue={search.type}>
										{search.type === 'projects' ? (
											<PackageIcon aria-hidden size={18} strokeWidth={1.5} />
										) : search.type === 'folders' ? (
											<FolderIcon aria-hidden size={18} strokeWidth={1.5} />
										) : (
											<FileIcon aria-hidden size={18} strokeWidth={1.5} />
										)}
										{search.type === 'projects' ? 'Project' : search.type === 'folders' ? 'Folder' : 'File'}
									</Tag>
								</TagGroup>
								{/* {search.type === 'uploads_datasets' ? (
										<span>
											{convertDataRateLog(
												search.data.latest_version?.version_file?.metadata?.find(
													(metadata) => metadata.custom_key === 'FILE_SIZE',
												)?.value,
											) ?? '...'}
										</span>
									) : null} */}
							</div>
							<div className="flex flex-col gap-4">
								<span className="text-base-sm text-base-neutral-600 dark:text-base-neutral-300 inline-flex place-items-center gap-2">
									<Wand2Icon aria-hidden size={18} strokeWidth={1.5} />{' '}
									{format(search.data.creation_date, 'MMM D, YYYY hh:mm', 'en')}
								</span>
							</div>
						</div>
					</LinkGridCard>
				</div>
			))}
		</div>
	);
}
