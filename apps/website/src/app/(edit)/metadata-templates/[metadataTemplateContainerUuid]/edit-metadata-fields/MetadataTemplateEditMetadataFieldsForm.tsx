'use client';

import { valibotResolver } from '@hookform/resolvers/valibot';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertCircleIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { ComponentProps } from 'react';
import { useForm } from 'react-hook-form';
import type { InferInput } from 'valibot';
import { MetadataTemplateFieldsEditor } from '@/components/metadata-template/fields/MetadataTemplateFieldsEditor';
import { Alert } from '@/components/ui/Alert';
import { MetadataTemplateSchema } from '@/schemas/MetadataTemplateSchema';
import { $api, openAPIClient } from '@/util/clientFetch';
import { formatErrorMessage } from '@/util/formatErrorMessage';
import type { components } from '@/util/openapiSchema';
import { trimMetadataPayload } from '@/util/trimMetadataPayload';

type MetadataTemplateEditInput = InferInput<typeof MetadataTemplateSchema>;

export function MetadataTemplateEditMetadataFieldsForm({
	metadataTemplateContainerUuid,
	data,
	metadataTemplateFieldsData,
	...props
}: ComponentProps<'form'> & {
	readonly data: components['schemas']['MetadataTemplateContainer'];
	readonly metadataTemplateContainerUuid: string;
	readonly metadataTemplateFieldsData: components['schemas']['MetadataTemplateField'][] | undefined;
}) {
	const router = useRouter();
	const queryClient = useQueryClient();

	const {
		control,
		getValues,
		handleSubmit,
		setError,
		setValue,
		formState: { errors },
	} = useForm<MetadataTemplateEditInput>({
		resolver: valibotResolver(MetadataTemplateSchema),
		defaultValues: {
			name: data.name ?? '',
			assigned_to_content_type: data.assigned_to_content_type ?? null,
			assigned_to_object_id: data.assigned_to_object_id ?? null,
			metadata_template_fields:
				(metadataTemplateFieldsData ?? []).map((field) => ({
					previous_version_field: field.pk ?? null,
					custom_key: field.custom_key ?? '',
					value: field.value ?? '',
					mandatory: field.mandatory ?? false,
					field_type: field.field_type ?? 'TEXT',
					config: field.config ?? {},
				})) ?? [],
		},
	});

	const { mutate } = useMutation({
		mutationFn: async (input: MetadataTemplateEditInput) => {
			const metadataTemplateFieldsWithOrder = (input.metadata_template_fields ?? []).map(
				({ field: _unusedField, ...rest }, index) => ({
					...rest,
					order: index,
				}),
			);

			const { error: metadataTemplateError, response: metadataTemplateResponse } = await openAPIClient.POST(
				'/api/v1/metadata-template-container/{id}/version/',
				{
					params: { path: { id: metadataTemplateContainerUuid } },
					body: {
						metadata_template_fields: trimMetadataPayload(metadataTemplateFieldsWithOrder),
					},
				},
			);

			if (metadataTemplateError) {
				throw new Error(formatErrorMessage(metadataTemplateError, metadataTemplateResponse));
			}
		},
		async onSuccess() {
			await queryClient.invalidateQueries({
				queryKey: $api.queryOptions('get', '/api/v1/metadata-template-container/{id}/', {
					params: { path: { id: metadataTemplateContainerUuid } },
				}).queryKey,
			});
			await queryClient.invalidateQueries({
				queryKey: $api.queryOptions('get', '/api/v1/metadata-template-field/', {
					params: { query: { metadata_template: metadataTemplateContainerUuid } },
				}).queryKey,
			});

			router.push(`/metadata-templates/${metadataTemplateContainerUuid}`);
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
		<form
			{...props}
			id="metadata-template-edit-metadata-fields"
			onSubmit={handleSubmit((input) => mutate(input))}
			ref={props.ref}
		>
			<div className="flex flex-col gap-8">
				{errors.root ? (
					<Alert>
						<AlertCircleIcon aria-hidden className="shrink-0" size={24} strokeWidth={1.5} />
						{errors.root?.message}
					</Alert>
				) : null}

				<div className="pt-2 text-base-xl text-base-neutral-900 dark:text-base-neutral-40">Metadata fields</div>

				<MetadataTemplateFieldsEditor control={control} errors={errors} getValues={getValues} setValue={setValue} />
			</div>
		</form>
	);
}
