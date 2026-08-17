'use client';

import { valibotResolver } from '@hookform/resolvers/valibot';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertCircleIcon, XCircleIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { ComponentProps } from 'react';
import { Controller, useForm } from 'react-hook-form';
import type { InferInput } from 'valibot';
import {
	resolveMetadataTemplateCreateScope,
	type MetadataTemplateCreateScope,
} from '@/components/metadata-template/create/metadataTemplateCreateScope';
import {
	MetadataTemplateFieldsEditor,
	createEmptyMetadataTemplateField,
} from '@/components/metadata-template/fields/MetadataTemplateFieldsEditor';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { FieldError, Label } from '@/components/ui/Field';
import { Input, InputGroup } from '@/components/ui/Input';
import { TextField } from '@/components/ui/TextField';
import { useFirstTimeFlag } from '@/hooks/useFirstTimeFlag';
import { MetadataTemplateSchema } from '@/schemas/MetadataTemplateSchema';
import { openAPIClient } from '@/util/clientFetch';
import { formatErrorMessage } from '@/util/formatErrorMessage';
import { trimMetadataPayload } from '@/util/trimMetadataPayload';

type MetadataTemplateCreateInput = InferInput<typeof MetadataTemplateSchema>;
export { resolveMetadataTemplateCreateScope, type MetadataTemplateCreateScope } from './metadataTemplateCreateScope';

type MetadataTemplateCreateFormProps = ComponentProps<'form'> & {
	readonly scope: MetadataTemplateCreateScope;
};

export function MetadataTemplateCreateForm({ scope, ...props }: MetadataTemplateCreateFormProps) {
	// eslint-disable-next-line react-compiler/react-compiler
	'use no memo';

	const router = useRouter();
	const queryClient = useQueryClient();
	const { markCompleted } = useFirstTimeFlag('metadata-template');
	const resolvedScope = resolveMetadataTemplateCreateScope(scope);

	const {
		control,
		getValues,
		handleSubmit,
		setError,
		setValue,
		formState: { errors },
	} = useForm<MetadataTemplateCreateInput>({
		resolver: valibotResolver(MetadataTemplateSchema),
		defaultValues: {
			name: '',
			assigned_to_content_type: resolvedScope.assignedToContentType,
			assigned_to_object_id: resolvedScope.assignedToObjectId,
			metadata_template_fields: [createEmptyMetadataTemplateField()],
		},
	});

	const { mutate } = useMutation({
		mutationFn: async (input: MetadataTemplateCreateInput) => {
			const metadataTemplateFieldsWithOrder = (input.metadata_template_fields ?? []).map((field, index) => ({
				...field,
				order: index,
			}));

			const payload = {
				name: input.name.trim(),
				assigned_to_content_type: resolvedScope.assignedToContentType,
				assigned_to_object_id: resolvedScope.assignedToObjectId,
				metadata_template_fields: trimMetadataPayload(metadataTemplateFieldsWithOrder),
			};

			const { error: metadataTemplateError, response: metadataTemplateResponse } = await openAPIClient.POST(
				'/api/v1/metadata-template-container/',
				{
					body: payload,
				},
			);

			if (metadataTemplateError) {
				throw new Error(formatErrorMessage(metadataTemplateError, metadataTemplateResponse));
			}
		},
		async onSuccess() {
			await resolvedScope.invalidateQueries(queryClient);

			router.push(resolvedScope.redirectPath);
			markCompleted();
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
		<form {...props} id="create-metadata-template" onSubmit={handleSubmit((input) => mutate(input))} ref={props.ref}>
			<div className="flex flex-col gap-8">
				{errors.root ? (
					<Alert>
						<AlertCircleIcon aria-hidden className="shrink-0" size={24} strokeWidth={1.5} />
						{errors.root?.message}
					</Alert>
				) : null}

				<div className="flex flex-col gap-4">
					<h1 className="text-base-xl">Basic information</h1>

					<div className="grid gap-6">
						<div className="grid gap-2">
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
										<Label>Metadata template name</Label>
										<InputGroup>
											<Input placeholder="Name your metadata template" />
											{field.value && !field.disabled && (
												<Button
													aria-label="Clear metadata template name"
													onPress={() => field.onChange('')}
													size="icon"
													variant="unset"
												>
													<XCircleIcon aria-hidden className="size-6 shrink-0 stroke-[1.5]" />
												</Button>
											)}
										</InputGroup>
										{fieldState.error?.message ? <FieldError>{fieldState.error.message}</FieldError> : null}
									</TextField>
								)}
							/>
						</div>
					</div>
				</div>

				<div className="pt-2 text-base-xl text-base-neutral-900 dark:text-base-neutral-40">Metadata fields</div>

				<MetadataTemplateFieldsEditor control={control} errors={errors} getValues={getValues} setValue={setValue} />
			</div>
		</form>
	);
}
