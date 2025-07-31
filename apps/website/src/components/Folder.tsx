'use client';

import { useMutation, useQuery, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { FolderIcon, TrashIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { ModalOverlayProps } from 'react-aria-components';
import { EditInfoIcon } from '@/components/icons/EditInfoIcon';
import { Button } from '@/components/ui/Button';
import { ModalBody, ModalClose, ModalContent, ModalFooter, ModalHeader } from '@/components/ui/Modal';
import { $api, openAPIClient } from '@/util/clientFetch';
import { formatErrorMessage } from '@/util/formatErrorMessage';

export function FolderHeading(props: { readonly folderUuid: string }) {
	const { data: folderData } = useSuspenseQuery(
		$api.queryOptions('get', '/api/v1/folder/{id}/', {
			params: { path: { id: props.folderUuid } },
		}),
	);

	return (
		<h1 className="text-base-heading-xs flex place-items-center gap-3">
			<FolderIcon aria-hidden className="shrink-0" size={24} strokeWidth={1.5} />
			{folderData.name}
		</h1>
	);
}

export function FolderEditLockDialog({ folderUuid, ...props }: ModalOverlayProps & { readonly folderUuid: string }) {
	const { data: lockData } = useQuery(
		$api.queryOptions(
			'get',
			'/api/v1/folder/{id}/status/',
			{
				params: { path: { id: folderUuid } },
			},
			{ enabled: Boolean(props.isOpen) },
		),
	);

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
						<span className="text-base-lg">
							Item is currently being edited
							{lockData?.locked_by ? (
								<>
									<br />
									<span className="text-base-label-lg">by {lockData.locked_by.email}</span>
								</>
							) : null}
							.
						</span>
						<span>Please try again later to avoid losing changes.</span>
					</div>
				</div>
			</ModalBody>
			<ModalFooter>
				<ModalClose variant="filled">Got it</ModalClose>
			</ModalFooter>
		</ModalContent>
	);
}

export function FolderDeleteDialog({
	folderUuid,
	projectUuid,
	folderName,
	redirectUrl,
	...props
}: ModalOverlayProps & {
	readonly folderName: string;
	readonly folderUuid: string;
	readonly projectUuid: string;
	readonly redirectUrl?: string;
}) {
	const router = useRouter();
	const queryClient = useQueryClient();

	const { mutate } = useMutation({
		mutationFn: async () => {
			const { data: folderData, error } = await openAPIClient.DELETE('/api/v1/folder/{id}/', {
				params: { path: { id: folderUuid } },
			});

			if (error) {
				throw new Error(formatErrorMessage(error));
			}

			return { data: folderData };
		},
		async onSuccess() {
			props.onOpenChange?.(false);

			await queryClient.invalidateQueries({
				queryKey: $api.queryOptions('get', '/api/v1/folder/', { params: { query: { project: projectUuid } } }).queryKey,
			});

			if (redirectUrl) {
				router.push(redirectUrl);
			}
		},
		onError(error) {
			window.scrollTo({ top: 0, behavior: 'instant' });
			console.error(error);
		},
	});

	return (
		<ModalContent {...props} role="alertdialog">
			<ModalHeader>Do you really want to delete folder "{folderName}"?</ModalHeader>
			<ModalBody>Upon confirmation, the folder will be permanently deleted.</ModalBody>
			<ModalFooter>
				<ModalClose variant="secondary-discreet">Cancel</ModalClose>
				<Button onPress={() => mutate()} type="submit" variant="filled">
					<TrashIcon aria-hidden size={18} strokeWidth={1.5} /> Delete
				</Button>
			</ModalFooter>
		</ModalContent>
	);
}
