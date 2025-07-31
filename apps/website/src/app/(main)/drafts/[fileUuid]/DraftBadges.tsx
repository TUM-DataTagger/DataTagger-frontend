'use client';

import { useSuspenseQuery } from '@tanstack/react-query';
import { PackageOpenIcon } from 'lucide-react';
import { FileExpirationBadge } from '@/components/File';
import { TagGroup, Tag } from '@/components/ui/TagGroup';
import { $api } from '@/util/clientFetch';
import { differenceInDays } from '@/util/differenceInDays';

export function DraftBadges(props: { readonly fileUuid: string }) {
	const { data: datasetData } = useSuspenseQuery(
		$api.queryOptions('get', '/api/v1/uploads-dataset/{id}/', {
			params: { path: { id: props.fileUuid } },
		}),
	);

	return (
		<div className="flex place-items-center gap-1">
			<TagGroup aria-label="My draft files">
				<Tag className="cursor-pointer" href="/drafts" target="_blank" textValue="My draft files">
					<PackageOpenIcon aria-hidden size={18} strokeWidth={1.5} /> My draft files
				</Tag>
			</TagGroup>
			{datasetData.expiry_date && differenceInDays(datasetData.expiry_date) <= 14 ? (
				<FileExpirationBadge expirationDate={datasetData.expiry_date} />
			) : null}
		</div>
	);
}
