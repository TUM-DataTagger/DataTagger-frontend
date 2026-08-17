'use client';

import { valibotResolver } from '@hookform/resolvers/valibot';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertCircleIcon, XCircleIcon } from 'lucide-react';
import { type ModalOverlayProps } from 'react-aria-components';
import { Controller, useForm } from 'react-hook-form';
import type { InferInput } from 'valibot';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { FieldError, Label } from '@/components/ui/Field';
import { Form, useDialogForm } from '@/components/ui/Form';
import { Input, InputGroup } from '@/components/ui/Input';
import { ModalBody, ModalClose, ModalContent, ModalFooter, ModalHeader } from '@/components/ui/Modal';
import { TextField } from '@/components/ui/TextField';
import { FilenameEditSchema } from '@/schemas/FilenameEditSchema';
import { $api, openAPIClient } from '@/util/clientFetch';
import { formatErrorMessage } from '@/util/formatErrorMessage';
import { logger, LogCategory } from '@/util/logger';

type ProjectFolderFileEditInput = InferInput<typeof FilenameEditSchema>;

export function DraftFileMoreMenuEditFilenameDialog({
	fileUuid,
	filename,
	...props
}: ModalOverlayProps & { readonly fileUuid: string; readonly filename: string }) {
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
		async onSuccess(_data, variables) {
			logger.info(LogCategory.DraftFiles, 'Draft renamed', {
				fileUuid,
				newFilename: variables.name,
			});

			props.onOpenChange?.(false);

			await queryClient.invalidateQueries({
				queryKey: $api.queryOptions('get', '/api/v1/uploads-dataset/{id}/', {
					params: { path: { id: fileUuid } },
				}).queryKey,
			});
			await queryClient.invalidateQueries({
				queryKey: $api.queryOptions('get', '/api/v1/uploads-dataset/').queryKey,
			});
		},
		onError(error) {
			window.scrollTo({ top: 0, behavior: 'instant' });
			setError('root', {
				type: 'custom',
				message: error.message,
			});
		},
	});
	const { formProps, submitButtonProps } = useDialogForm('draft-file-edit-filename');

	return (
		<ModalContent {...props} aria-label={`Edit filename for "${filename}"`}>
			<ModalHeader aria-hidden />
			<ModalBody>
				<Form {...formProps} onSubmit={handleSubmit((input) => mutate(input))}>
					{errors.root && (
						<Alert className="mb-6">
							<AlertCircleIcon aria-hidden className="shrink-0" size={24} strokeWidth={1.5} />
							{errors.root?.message}
						</Alert>
					)}

					<Controller
						control={control}
						name="name"
						render={({ field, fieldState }) => (
							<TextField
								autoComplete="off"
								isDisabled={field.disabled ?? false}
								isInvalid={fieldState.invalid}
								onBlur={field.onBlur}
								onChange={field.onChange}
								value={field.value ?? ''}
							>
								<Label>Edit filename</Label>
								<InputGroup>
									<Input autoFocus placeholder="Enter filename" />
									{field.value && !field.disabled && (
										<Button aria-label="Clear filename" onPress={() => field.onChange('')} size="icon" variant="unset">
											<XCircleIcon aria-hidden className="size-6 shrink-0 stroke-[1.5]" />
										</Button>
									)}
								</InputGroup>
								{fieldState.error?.message ? <FieldError>{fieldState.error.message}</FieldError> : null}
							</TextField>
						)}
					/>
				</Form>
			</ModalBody>
			<ModalFooter>
				<ModalClose onPress={() => clearErrors()} variant="secondary-discreet">
					Cancel
				</ModalClose>
				<Button {...submitButtonProps} variant="filled">
					Save changes
				</Button>
			</ModalFooter>
		</ModalContent>
	);
}
