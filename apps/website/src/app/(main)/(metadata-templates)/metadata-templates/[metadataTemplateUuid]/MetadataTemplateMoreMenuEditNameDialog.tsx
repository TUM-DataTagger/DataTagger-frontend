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
import { MetadataTemplateNameEditSchema } from '@/schemas/MetadataTemplateNameEditSchema';
import { $api, openAPIClient } from '@/util/clientFetch';
import { formatErrorMessage } from '@/util/formatErrorMessage';

type MetadataTemplateNameEditInput = InferInput<typeof MetadataTemplateNameEditSchema>;

export function MetadataTemplateMoreMenuEditNameDialog({
	metadataTemplateUuid,
	name,
	...props
}: ModalOverlayProps & { readonly metadataTemplateUuid: string; readonly name: string }) {
	const queryClient = useQueryClient();

	const {
		control,
		handleSubmit,
		setError,
		clearErrors,
		formState: { errors },
	} = useForm<MetadataTemplateNameEditInput>({
		resolver: valibotResolver(MetadataTemplateNameEditSchema),
		defaultValues: {
			name,
		},
	});

	const { mutate } = useMutation({
		mutationFn: async (input: MetadataTemplateNameEditInput) => {
			const { error: metadataTemplateError, response: metadataTemplateResponse } = await openAPIClient.PATCH(
				'/api/v1/metadata-template/{id}/',
				{
					params: { path: { id: metadataTemplateUuid } },
					body: {
						name: input.name,
					},
				},
			);

			if (metadataTemplateError) {
				throw new Error(formatErrorMessage(metadataTemplateError, metadataTemplateResponse));
			}
		},
		async onSuccess() {
			props.onOpenChange?.(false);

			// await setUnlocked();
			await queryClient.invalidateQueries({
				queryKey: $api.queryOptions('get', '/api/v1/metadata-template/{id}/', {
					params: { path: { id: metadataTemplateUuid } },
				}).queryKey,
			});
			await queryClient.invalidateQueries({
				queryKey: ['metadata-template'],
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

	return (
		<ModalContent
			{...props}
			aria-label={`Edit metadata template name for "${name}"`}
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
								label="Edit metadata template name"
								onBlur={field.onBlur}
								onChange={field.onChange}
								placeholder="Enter metadata template name"
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
							// await setUnlocked();
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
