'use client';

import { useQuery } from '@tanstack/react-query';
import type { ModalOverlayProps } from 'react-aria-components';
import { EditInfoIcon } from '@/components/icons/EditInfoIcon';
import { ModalBody, ModalClose, ModalContent, ModalFooter, ModalHeader } from '@/components/ui/Modal';
import { $api } from '@/util/clientFetch';

type EditLockDialogProps = ModalOverlayProps & {
	/**
	 * Email of the user who locked the item
	 */
	readonly lockedByEmail?: string | null | undefined;
};

/**
 * Generic dialog for displaying an edit lock notification
 *
 * Used when a user tries to edit an item that is currently being edited by another user.
 *
 * @example
 * ```tsx
 * <Modal isOpen={isEditLockOpen} onOpenChange={setIsEditLockOpen}>
 *   <EditLockDialog lockedByEmail={lockData?.locked_by?.email} />
 * </Modal>
 * ```
 */
export function EditLockDialog({ lockedByEmail, ...props }: EditLockDialogProps) {
	return (
		<ModalContent
			{...props}
			aria-label={`Item is currently being edited${lockedByEmail ? ` by ${lockedByEmail}` : ''}.`}
			role="alertdialog"
		>
			<ModalHeader aria-hidden />
			<ModalBody>
				<div className="flex flex-col place-items-center gap-4">
					<EditInfoIcon />
					<div className="flex flex-col place-items-center gap-7">
						<p className="text-base-lg">
							Item is currently being edited
							{lockedByEmail ? (
								<>
									<br />
									<span className="text-base-label-lg">by {lockedByEmail}</span>
								</>
							) : null}
							.
						</p>
						<p>Please try again later to avoid losing changes.</p>
					</div>
				</div>
			</ModalBody>
			<ModalFooter>
				<ModalClose variant="filled">Got it</ModalClose>
			</ModalFooter>
		</ModalContent>
	);
}

/**
 * Props for FileEditLockDialog
 */
type FileEditLockDialogProps = ModalOverlayProps & {
	/**
	 * UUID of the file
	 */
	readonly fileUuid: string;
};

/**
 * Edit lock dialog for files with built-in query for lock status
 *
 * @example
 * ```tsx
 * <Modal isOpen={isEditLockOpen} onOpenChange={setIsEditLockOpen}>
 *   <FileEditLockDialog fileUuid={fileUuid} />
 * </Modal>
 * ```
 */
export function FileEditLockDialog({ fileUuid, ...props }: FileEditLockDialogProps) {
	const { data: lockData } = useQuery(
		$api.queryOptions(
			'get',
			'/api/v1/uploads-dataset/{id}/status/',
			{
				params: { path: { id: fileUuid } },
			},
			{ enabled: Boolean(props.isOpen) },
		),
	);

	return <EditLockDialog {...props} lockedByEmail={lockData?.locked_by?.email} />;
}

/**
 * Props for MetadataTemplateEditLockDialog
 */
type MetadataTemplateEditLockDialogProps = ModalOverlayProps & {
	/**
	 * UUID of the metadata template container
	 */
	readonly metadataTemplateContainerUuid: string;
};

/**
 * Edit lock dialog for metadata templates with built-in query for lock status
 *
 * @example
 * ```tsx
 * <Modal isOpen={isEditLockOpen} onOpenChange={setIsEditLockOpen}>
 *   <MetadataTemplateEditLockDialog metadataTemplateContainerUuid={templateUuid} />
 * </Modal>
 * ```
 */
export function MetadataTemplateEditLockDialog({
	metadataTemplateContainerUuid,
	...props
}: MetadataTemplateEditLockDialogProps) {
	const { data: lockData } = useQuery(
		$api.queryOptions(
			'get',
			'/api/v1/metadata-template-container/{id}/status/',
			{
				params: { path: { id: metadataTemplateContainerUuid } },
			},
			{ enabled: Boolean(props.isOpen) },
		),
	);

	return <EditLockDialog {...props} lockedByEmail={lockData?.locked_by?.email} />;
}
