'use client';

import { useMutation, useQuery, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { PackageIcon, TrashIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { ModalOverlayProps } from 'react-aria-components';
import { EditInfoIcon } from '@/components/icons/EditInfoIcon';
import { Button } from '@/components/ui/Button';
import { ModalBody, ModalClose, ModalContent, ModalFooter, ModalHeader } from '@/components/ui/Modal';
import { $api, openAPIClient } from '@/util/clientFetch';
import { formatErrorMessage } from '@/util/formatErrorMessage';

export function ProjectHeading(props: { readonly projectUuid: string }) {
	const { data: projectData } = useSuspenseQuery(
		$api.queryOptions('get', '/api/v1/project/{id}/', {
			params: { path: { id: props.projectUuid } },
		}),
	);

	return (
		<h1 className="text-base-heading-xs flex place-items-center gap-3">
			<PackageIcon aria-hidden className="shrink-0" size={24} strokeWidth={1.5} />
			{projectData.name}
		</h1>
	);
}

export function ProjectEditLockDialog({ projectUuid, ...props }: ModalOverlayProps & { readonly projectUuid: string }) {
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

export function ProjectDeleteDialog({
	projectUuid,
	projectName,
	redirectUrl,
	...props
}: ModalOverlayProps & { readonly projectName: string; readonly projectUuid: string; readonly redirectUrl?: string }) {
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
			console.error(error);
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
