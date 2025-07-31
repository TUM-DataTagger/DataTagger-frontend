'use client';

import { valibotResolver } from '@hookform/resolvers/valibot';
import { useMutation, useQuery } from '@tanstack/react-query';
import { AlertCircleIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, type ComponentProps } from 'react';
import { Controller, useForm } from 'react-hook-form';
import type { InferInput } from 'valibot';
import { Editor } from '@/components/editor/Editor';
import { Alert } from '@/components/ui/Alert';
import { ComboBox, ComboBoxInput, ComboBoxList, ComboBoxOption, ComboBoxSection } from '@/components/ui/ComboBox';
import { Label } from '@/components/ui/Field';
import { TextField } from '@/components/ui/TextField';
import { ProjectDetailsSchema } from '@/schemas/ProjectDetailsSchema';
import { openAPIClient } from '@/util/clientFetch';
import { formatErrorMessage } from '@/util/formatErrorMessage';
import type { components } from '@/util/openapiSchema';

type ProjectDetailsEditInput = InferInput<typeof ProjectDetailsSchema>;

export function ProjectDetailsEditForm({
	projectUuid,
	data,
	...props
}: ComponentProps<'form'> & { readonly data: components['schemas']['Project']; readonly projectUuid: string }) {
	const router = useRouter();
	const [selectedMetadataTemplate, setSelectedMetadataTemplate] = useState<string | null>(
		data?.metadata_template?.pk ?? null,
	);

	const { data: metadataTemplateData } = useQuery({
		queryKey: ['metadata-template', { ordering: 'name', project: projectUuid }],
		queryFn: async () => {
			const { data } = await openAPIClient.GET('/api/v1/project/{id}/metadata-templates/', {
				params: {
					path: { id: projectUuid },
					query: {
						ordering: 'name',
					},
				},
			});

			return data ?? null;
		},
	});

	const hasMetadataTemplateResults = metadataTemplateData?.length;

	const description = Object.keys(data?.description ?? {}).length
		? (data?.description ?? { type: 'doc' })
		: { type: 'doc' };

	const {
		control,
		handleSubmit,
		setError,
		setValue,
		formState: { errors },
	} = useForm<ProjectDetailsEditInput>({
		resolver: valibotResolver(ProjectDetailsSchema),
		defaultValues: {
			name: data.name,
			metadata_template: data?.metadata_template?.pk ?? null,
			description,
		},
	});

	const { mutate } = useMutation({
		mutationFn: async (input: ProjectDetailsEditInput) => {
			const { error: projectError, response: projectResponse } = await openAPIClient.PATCH('/api/v1/project/{id}/', {
				params: { path: { id: projectUuid } },
				body: {
					name: input.name,
					metadata_template: input.metadata_template,
					description: input.description ?? { type: 'doc' },
				},
			});

			if (projectError) {
				throw new Error(formatErrorMessage(projectError, projectResponse));
			}
		},
		async onSuccess() {
			await openAPIClient.POST('/api/v1/project/{id}/unlock/', {
				params: { path: { id: projectUuid } },
			});

			router.push(`/projects/${projectUuid}/details`);
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
		<form {...props} id="project-details-edit" onSubmit={handleSubmit((input) => mutate(input))}>
			<div className="flex flex-col gap-8">
				{errors.root ? (
					<Alert>
						<AlertCircleIcon aria-hidden size={24} strokeWidth={1.5} />
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
										errorMessage={fieldState.error?.message}
										isClearable
										isDisabled={field.disabled ?? false}
										isInvalid={fieldState.invalid}
										label="Project name"
										onBlur={field.onBlur}
										onChange={field.onChange}
										placeholder="Name your project"
										type="text"
										value={field.value}
									/>
								)}
							/>
						</div>

						<div className="grid gap-2">
							<ComboBox
								allowsEmptyCollection
								label="Metadata template (optional)"
								menuTrigger="focus"
								onSelectionChange={async (val) => {
									setSelectedMetadataTemplate(val as string | null);
									setValue('metadata_template', val as string | null);
								}}
								placeholder="Select metadata template"
								selectedKey={selectedMetadataTemplate}
							>
								<ComboBoxInput />
								<ComboBoxList
									renderEmptyState={() => (
										<div className="text-base-label-sm text-base-neutral-600 dark:text-base-neutral-300 px-3 py-2">
											No metadata templates found
										</div>
									)}
								>
									<ComboBoxSection
										title={
											hasMetadataTemplateResults
												? 'Results | Available metadata templates'
												: 'No more metadata templates available'
										}
									>
										{metadataTemplateData?.map((metadataTemplate) => (
											<ComboBoxOption
												id={metadataTemplate.pk}
												key={metadataTemplate.pk}
												textValue={metadataTemplate.name}
											>
												{metadataTemplate.name}
											</ComboBoxOption>
										))}
									</ComboBoxSection>
								</ComboBoxList>
							</ComboBox>
						</div>

						<div className="grid gap-2">
							<Label htmlFor="edit-project-details-description">Description (optional)</Label>
							<Controller
								control={control}
								name="description"
								render={({ field, fieldState }) => (
									<Editor
										aria-invalid={fieldState.invalid}
										autoComplete="off"
										content={field.value ?? ''}
										disabled={field.disabled ?? false}
										editable
										id="edit-project-details-description"
										onBlur={field.onBlur}
										onChange={field.onChange}
										placeholder="More about the project ..."
										ref={field.ref}
									/>
								)}
							/>
						</div>
					</div>
				</div>
			</div>
		</form>
	);
}
