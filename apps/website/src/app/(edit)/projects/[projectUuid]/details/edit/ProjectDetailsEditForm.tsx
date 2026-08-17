'use client';

import { valibotResolver } from '@hookform/resolvers/valibot';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import type { ComponentProps } from 'react';
import { useForm } from 'react-hook-form';
import type { InferInput } from 'valibot';
import { EntityDetailsEditForm } from '@/components/edit-route/EntityDetailsEditForm';
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

	const description = Object.keys(data?.description ?? {}).length ? (data?.description ?? null) : null;

	const {
		control,
		handleSubmit,
		setError,
		formState: { errors },
	} = useForm<ProjectDetailsEditInput>({
		resolver: valibotResolver(ProjectDetailsSchema),
		defaultValues: {
			name: data.name,
			description,
		},
	});

	const { mutate } = useMutation({
		mutationFn: async (input: ProjectDetailsEditInput) => {
			const { error: projectError, response: projectResponse } = await openAPIClient.PATCH('/api/v1/project/{id}/', {
				params: { path: { id: projectUuid } },
				body: {
					name: input.name,
					description: input.description ?? {},
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

			router.push(`/projects/${projectUuid}/folders`);
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
		<EntityDetailsEditForm
			{...props}
			control={control}
			descriptionInputId="edit-project-details-description"
			descriptionPlaceholder="More about the project ..."
			errors={errors}
			formId="project-details-edit"
			handleSubmit={handleSubmit}
			nameLabel="Project name"
			namePlaceholder="Name your project"
			onSubmit={(input) => mutate(input)}
		/>
	);
}
