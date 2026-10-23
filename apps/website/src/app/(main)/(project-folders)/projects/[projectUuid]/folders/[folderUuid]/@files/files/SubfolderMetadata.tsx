'use client';

import { useQuery } from '@tanstack/react-query';
import { PencilIcon, PlusIcon, TagsIcon } from 'lucide-react';
import { useParams } from 'next/navigation';
import { MetadataField } from '@/components/Metadata';
import { Link } from '@/components/ui/Link';
import { buttonStyles } from '@/styles/ui/button';
import { $api } from '@/util/clientFetch';

export function SubfolderMetadata(props: { readonly canEdit: boolean; readonly subfolderUuid: string }) {
	const params = useParams<{ folderUuid: string; projectUuid: string }>();
	const { data: subfolder } = useQuery(
		$api.queryOptions('get', '/api/v1/subfolder/{id}/', { params: { path: { id: props.subfolderUuid } } }),
	);

	if (!subfolder || (!subfolder.metadata.length && !props.canEdit)) {
		return null;
	}

	const editHref = `/projects/${params.projectUuid}/folders/${params.folderUuid}/subfolders/${props.subfolderUuid}/edit-metadata`;

	return (
		<section aria-label="Subfolder metadata" className="flex flex-col gap-2">
			<div className="flex place-items-center gap-3">
				<span className="flex place-items-center gap-1.5 text-base-sm text-base-neutral-600 dark:text-base-neutral-300">
					<TagsIcon aria-hidden size={16} strokeWidth={1.5} /> Metadata of “{subfolder.name}”:
				</span>
				{props.canEdit ? (
					<Link className={buttonStyles({ size: 'sm', variant: 'secondary-discreet' })} href={editHref} variant="unset">
						{subfolder.metadata.length ? (
							<>
								<PencilIcon aria-hidden size={16} strokeWidth={1.5} /> Edit
							</>
						) : (
							<>
								<PlusIcon aria-hidden size={16} strokeWidth={1.5} /> Add metadata
							</>
						)}
					</Link>
				) : null}
			</div>

			{subfolder.metadata.length ? (
				<div className="flex flex-col gap-4 rounded-lg border border-base-neutral-100 px-4 py-3 dark:border-base-neutral-700">
					{subfolder.metadata.map((entry) => (
						<MetadataField entry={entry} key={entry.pk} />
					))}
				</div>
			) : null}
		</section>
	);
}
