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
import { FilenameEditSchema } from '@/schemas/FilenameEditSchema';
import { $api, openAPIClient } from '@/util/clientFetch';
import { formatErrorMessage } from '@/util/formatErrorMessage';

type ProjectFolderFileEditInput = InferInput<typeof FilenameEditSchema>;

export function ProjectFolderFileMoreMenuEditFilenameDialog({
	fileUuid,
	filename,
	folderUuid,
	...props
}: ModalOverlayProps & { readonly fileUuid: string; readonly filename: string; readonly folderUuid: string }) {
	const queryClient = useQueryClient();

	const {
		control,
		handleSubmit,
		setError,
		clearErrors,
		formState: { errors },
	} = useForm<ProjectFolderFileEditInput>({
		resolver: valibotResolver(FilenameEditSchema),
		defaultValues: {
			name: filename,
		},
	});

	async function setUnlocked() {
		const { data } = await openAPIClient.POST('/api/v1/uploads-dataset/{id}/unlock/', {
			params: { path: { id: fileUuid } },
		});
		await queryClient.invalidateQueries({
			queryKey: $api.queryOptions('get', '/api/v1/uploads-dataset/{id}/status/', {
				params: { path: { id: fileUuid } },
			}).queryKey,
		});

		return data;
	}

	const { mutate } = useMutation({
		mutationFn: async (input: ProjectFolderFileEditInput) => {
			const { error: datasetError, response: datasetResponse } = await openAPIClient.PATCH(
				'/api/v1/uploads-dataset/{id}/',
				{
					params: { path: { id: fileUuid } },
					body: {
						name: input.name,
					},
				},
			);

			if (datasetError) {
				throw new Error(formatErrorMessage(datasetError, datasetResponse));
			}
		},
		async onSuccess() {
			props.onOpenChange?.(false);

			await queryClient.invalidateQueries({
				queryKey: $api.queryOptions('get', '/api/v1/uploads-dataset/{id}/', {
					params: { path: { id: fileUuid } },
				}).queryKey,
			});
			await queryClient.invalidateQueries({
				queryKey: $api.queryOptions('get', '/api/v1/uploads-dataset/', {
					params: { query: { folder: folderUuid } },
				}).queryKey,
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
			aria-label={`Edit filename for "${filename}"`}
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
								label="Edit filename"
								onBlur={field.onBlur}
								onChange={field.onChange}
								placeholder="Enter filename"
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
