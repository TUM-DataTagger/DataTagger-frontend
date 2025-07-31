'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { type VariantProps } from 'cva';
import { PencilIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { PropsWithChildren } from 'react';
import { Button } from '@/components/ui/Button';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { $api, openAPIClient } from '@/util/clientFetch';

export function ProjectFolderEdit({
	variant = 'filled',
	size = 'icon',
	onClick = () => {},
	...props
}: PropsWithChildren<
	VariantProps<typeof Button> & {
		readonly className?: string | undefined;
		readonly folderUuid: string;
		readonly href: string;
		onClick?(isLocked: boolean): void;
	}
>) {
	const router = useRouter();
	const queryClient = useQueryClient();

	const { currentUserData } = useCurrentUser();

	const { data: folderPermissionData } = useQuery(
		$api.queryOptions(
			'get',
			'/api/v1/folder-permission/',
			{
				params: {
					query: { folder: props.folderUuid, project_membership__member: currentUserData?.pk ?? -1 },
				},
			},
			{ enabled: Boolean(currentUserData?.pk) },
		),
	);

	const isFolderAdmin = folderPermissionData?.[0]?.is_folder_admin;

	async function isLocked() {
		const { data } = await openAPIClient.GET('/api/v1/folder/{id}/status/', {
			params: { path: { id: props.folderUuid } },
		});
		await queryClient.invalidateQueries({
			queryKey: $api.queryOptions('get', '/api/v1/folder/{id}/status/', {
				params: { path: { id: props.folderUuid } },
			}).queryKey,
		});

		return data;
	}

	async function setLocked() {
		const { data } = await openAPIClient.POST('/api/v1/folder/{id}/lock/', {
			params: { path: { id: props.folderUuid } },
		});

		return data;
	}

	return isFolderAdmin ? (
		<Button
			aria-label="Edit"
			className={props.className!}
			onPress={async () => {
				const status = await isLocked();
				if (!status?.locked) {
					await setLocked();
					router.push(props.href);
				}

				onClick?.(Boolean(status?.locked));
			}}
			size={size}
			variant={variant}
		>
			<PencilIcon aria-hidden size={18} strokeWidth={1.5} />
			{props.children}
		</Button>
	) : null;
}
