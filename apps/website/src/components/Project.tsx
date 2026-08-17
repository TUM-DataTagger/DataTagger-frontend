'use client';

import { format } from '@formkit/tempo';
import { useMutation, useQuery, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { PackageIcon, TrashIcon, Wand2Icon } from 'lucide-react';
import type { Route } from 'next';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import type { ModalOverlayProps } from 'react-aria-components';
import { Editor } from '@/components/editor/Editor';
import { EditInfoIcon } from '@/components/icons/EditInfoIcon';
import { Button } from '@/components/ui/Button';
import { ModalBody, ModalClose, ModalContent, ModalFooter, ModalHeader } from '@/components/ui/Modal';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/Tooltip';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useEditorClampOverflow } from '@/hooks/useEditorClampOverflow';
import { cx } from '@/styles/cva';
import { linkStyles } from '@/styles/ui/link';
import { $api, openAPIClient } from '@/util/clientFetch';
import { formatErrorMessage } from '@/util/formatErrorMessage';
import { getEditorDescription } from '@/util/getEditorDescription';
import { logger, LogCategory } from '@/util/logger';

export function ProjectHeading(props: { readonly projectUuid: string }) {
	const { data: projectData } = useSuspenseQuery(
		$api.queryOptions('get', '/api/v1/project/{id}/', {
			params: { path: { id: props.projectUuid } },
		}),
	);

	return (
		<h1 className="flex place-items-center gap-3 text-base-heading-xs">
			<PackageIcon aria-hidden className="shrink-0" size={24} strokeWidth={1.5} />
			{projectData.name}
		</h1>
	);
}

export function ProjectDetailsSummary(props: { readonly projectUuid: string }) {
	const { data: projectData } = useSuspenseQuery(
		$api.queryOptions('get', '/api/v1/project/{id}/', {
			params: { path: { id: props.projectUuid } },
		}),
	);

	const description = getEditorDescription(projectData?.description);
	const [isExpanded, setIsExpanded] = useState(false);
	const contentRef = useRef<HTMLDivElement>(null);
	const hasOverflow = useEditorClampOverflow({ contentRef, enabled: Boolean(description) });

	if (!description && !projectData?.created_by?.email) {
		return null;
	}

	return (
		<div className="flex flex-col gap-3">
			{description ? (
				<div className="flex flex-col">
					<div
						className={cx(!isExpanded && '[&_.ProseMirror]:line-clamp-2 [&_.ProseMirror]:overflow-hidden')}
						ref={contentRef}
					>
						<Editor content={description} />
					</div>
					{hasOverflow ? (
						<Button
							className={linkStyles({ className: 'place-self-start' })}
							onPress={() => setIsExpanded((previous) => !previous)}
							variant="unset"
						>
							{isExpanded ? 'Show less' : 'Show more'}
						</Button>
					) : null}
				</div>
			) : null}

			{projectData?.created_by?.email ? (
				<Tooltip delay={400}>
					<TooltipTrigger
						className="cursor-auto place-self-start text-base-sm text-base-neutral-600 dark:text-base-neutral-300 print:inline-flex"
						variant="unset"
					>
						<Wand2Icon aria-hidden size={18} strokeWidth={1.5} /> {projectData.created_by.email}
						{projectData?.creation_date ? ` - ${format(projectData.creation_date, 'medium', 'en')}` : null}
					</TooltipTrigger>
					<TooltipContent variant="plain">Created by / Created at</TooltipContent>
				</Tooltip>
			) : null}
		</div>
	);
}

export function ProjectEditLockDialog({ projectUuid, ...props }: ModalOverlayProps & { readonly projectUuid: string }) {
	const queryClient = useQueryClient();

	const { currentUserData } = useCurrentUser();

	const { data: lockData } = useQuery(
		$api.queryOptions(
			'get',
			'/api/v1/project/{id}/status/',
			{
				params: { path: { id: projectUuid } },
			},
			{ enabled: Boolean(props.isOpen) },
		),
	);

	const canUnlock = lockData?.locked_by?.email === currentUserData?.email;

	async function setUnlocked() {
		const { data } = await openAPIClient.POST('/api/v1/project/{id}/unlock/', {
			params: { path: { id: projectUuid } },
		});
		await queryClient.invalidateQueries({
			queryKey: $api.queryOptions('get', '/api/v1/project/{id}/status/', {
				params: { path: { id: projectUuid } },
			}).queryKey,
		});

		return data;
	}

	return (
		<ModalContent
			{...props}
			aria-label={`Item is currently being edited${lockData?.locked_by ? ` by ${lockData.locked_by.email}` : ''}.`}
			role="alertdialog"
		>
			<ModalHeader aria-hidden />
			<ModalBody>
				<div className="flex flex-col place-items-center gap-4">
					<EditInfoIcon />
					<div className="flex flex-col place-items-center gap-7">
						<p className="text-base-lg">
							Item is currently being edited
							{lockData?.locked_by ? (
								<>
									<br />
									<span className="text-base-label-lg">by {lockData.locked_by.email}</span>
								</>
							) : null}
							.
						</p>
						<p>Please try again later to avoid losing changes.</p>
					</div>
				</div>
			</ModalBody>
			<ModalFooter>
				{canUnlock ? (
					<ModalClose onPress={async () => setUnlocked()} variant="secondary-discreet">
						Unlock
					</ModalClose>
				) : null}
				<ModalClose variant="filled">Got it</ModalClose>
			</ModalFooter>
		</ModalContent>
	);
}

export function ProjectDeleteDialog({
	projectUuid,
	projectName,
	redirectUrl,
	...props
}: ModalOverlayProps & { readonly projectName: string; readonly projectUuid: string; readonly redirectUrl?: Route }) {
	const router = useRouter();
	const queryClient = useQueryClient();

	const { mutate } = useMutation({
		mutationFn: async () => {
			const { data: projectData, error } = await openAPIClient.DELETE('/api/v1/project/{id}/', {
				params: { path: { id: projectUuid } },
			});

			if (error) {
				throw new Error(formatErrorMessage(error));
			}

			return { data: projectData };
		},
		async onSuccess() {
			props.onOpenChange?.(false);

			await queryClient.invalidateQueries({
				queryKey: $api.queryOptions('get', '/api/v1/project/').queryKey,
			});

			if (redirectUrl) {
				router.push(redirectUrl);
			}
		},
		onError(error) {
			window.scrollTo({ top: 0, behavior: 'instant' });
			logger.error(LogCategory.Project, 'Delete failed', {
				error: error instanceof Error ? error.message : String(error),
			});
		},
	});

	return (
		<ModalContent {...props} role="alertdialog">
			<ModalHeader>Do you really want to remove project "{projectName}"?</ModalHeader>
			<ModalBody>Upon confirmation, the project will be permanently deleted.</ModalBody>
			<ModalFooter>
				<ModalClose variant="secondary-discreet">Cancel</ModalClose>
				<Button onPress={() => mutate()} type="submit" variant="filled">
					<TrashIcon aria-hidden size={18} strokeWidth={1.5} /> Delete
				</Button>
			</ModalFooter>
		</ModalContent>
	);
}
