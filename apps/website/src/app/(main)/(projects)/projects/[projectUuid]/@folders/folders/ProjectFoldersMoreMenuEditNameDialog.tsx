'use client';

import { valibotResolver } from '@hookform/resolvers/valibot';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertCircleIcon } from 'lucide-react';
import type { ModalOverlayProps } from 'react-aria-components';
import { Controller, useForm } from 'react-hook-form';
import type { InferInput } from 'valibot';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { ModalBody, ModalClose, ModalContent, ModalFooter, ModalHeader } from '@/components/ui/Modal';
import { TextField } from '@/components/ui/TextField';
import { FolderNameEditSchema } from '@/schemas/FolderNameEditSchema';
import { $api, openAPIClient } from '@/util/clientFetch';
import { formatErrorMessage } from '@/util/formatErrorMessage';

type FolderNameEditInput = InferInput<typeof FolderNameEditSchema>;

export function ProjectFoldersMoreMenuEditNameDialog({
	folderUuid,
	projectUuid,
	folderName,
	...props
}: ModalOverlayProps & { readonly folderName: string; readonly folderUuid: string; readonly projectUuid: string }) {
	const queryClient = useQueryClient();

	const {
		control,
		handleSubmit,
		setError,
		clearErrors,
		formState: { errors },
	} = useForm<FolderNameEditInput>({
		resolver: valibotResolver(FolderNameEditSchema),
		defaultValues: {
			name: folderName,
		},
	});

	async function setUnlocked() {
		const { data } = await openAPIClient.POST('/api/v1/folder/{id}/unlock/', {
			params: { path: { id: folderUuid } },
		});
		await queryClient.invalidateQueries({
			queryKey: $api.queryOptions('get', '/api/v1/folder/{id}/status/', {
				params: { path: { id: folderUuid } },
			}).queryKey,
		});

		return data;
	}

	const { mutate } = useMutation({
		mutationFn: async (input: FolderNameEditInput) => {
			const { error: folderError, response: folderResponse } = await openAPIClient.PATCH('/api/v1/folder/{id}/', {
				params: { path: { id: folderUuid } },
				body: { name: input.name },
			});

			if (folderError) {
				throw new Error(formatErrorMessage(folderError, folderResponse));
			}
		},
		async onSuccess() {
			props.onOpenChange?.(false);

			await queryClient.invalidateQueries({
				queryKey: $api.queryOptions('get', '/api/v1/folder/', { params: { query: { project: projectUuid } } }).queryKey,
			});
			await setUnlocked();
		},
		onError(error) {
			window.scrollTo({ top: 0, behavior: 'instant' });
			setError('root', {
				type: 'custom',
				message: error.message,
			});
		},
	});

	return (
		<ModalContent
			{...props}
			aria-label={`Edit folder name for "${folderName}"`}
			isKeyboardDismissDisabled
			role="alertdialog"
		>
			<form onSubmit={handleSubmit((input) => mutate(input))}>
				<ModalHeader aria-hidden />
				<ModalBody>
					{errors.root && (
						<Alert>
							<AlertCircleIcon aria-hidden size={24} strokeWidth={1.5} />
							{errors.root?.message}
						</Alert>
					)}

					<Controller
						control={control}
						name="name"
						render={({ field, fieldState }) => (
							<TextField
								autoComplete="off"
								autoFocus
								errorMessage={fieldState.error?.message}
								isClearable
								isDisabled={field.disabled ?? false}
								isInvalid={fieldState.invalid}
								label="Edit folder name"
								onBlur={field.onBlur}
								onChange={field.onChange}
								placeholder="Enter folder name"
								type="text"
								value={field.value ?? ''}
							/>
						)}
					/>
				</ModalBody>
				<ModalFooter>
					<ModalClose
						onPress={async () => {
							clearErrors();
							await setUnlocked();
						}}
						variant="secondary-discreet"
					>
						Cancel
					</ModalClose>
					<Button type="submit" variant="filled">
						Save changes
					</Button>
				</ModalFooter>
			</form>
		</ModalContent>
	);
}
