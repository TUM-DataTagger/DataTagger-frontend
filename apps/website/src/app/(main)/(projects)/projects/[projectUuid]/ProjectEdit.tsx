'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { VariantProps } from 'cva';
import { PencilIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { PropsWithChildren } from 'react';
import { Button } from '@/components/ui/Button';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { $api, openAPIClient } from '@/util/clientFetch';

export function ProjectEdit({
	variant = 'filled',
	onClick = () => {},
	size = 'icon',
	...props
}: PropsWithChildren<
	VariantProps<typeof Button> & {
		readonly className?: string | undefined;
		readonly href: string;
		onClick?(isLocked: boolean): void;
		readonly projectUuid: string;
	}
>) {
	const router = useRouter();
	const queryClient = useQueryClient();

	const { currentUserData } = useCurrentUser();

	const { data: projectPermissionData } = useQuery(
		$api.queryOptions(
			'get',
			'/api/v1/project-membership/',
			{
				params: { query: { project: props.projectUuid, member: currentUserData?.pk ?? -1 } },
			},
			{ enabled: Boolean(currentUserData?.pk) },
		),
	);

	const isProjectAdmin = projectPermissionData?.[0]?.is_project_admin;

	async function isLocked() {
		const { data } = await openAPIClient.GET('/api/v1/project/{id}/status/', {
			params: { path: { id: props.projectUuid } },
		});
		await queryClient.invalidateQueries({
			queryKey: $api.queryOptions('get', '/api/v1/project/{id}/status/', {
				params: { path: { id: props.projectUuid } },
			}).queryKey,
		});

		return data;
	}

	async function setLocked() {
		const { data } = await openAPIClient.POST('/api/v1/project/{id}/lock/', {
			params: { path: { id: props.projectUuid } },
		});

		return data;
	}

	return isProjectAdmin ? (
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
