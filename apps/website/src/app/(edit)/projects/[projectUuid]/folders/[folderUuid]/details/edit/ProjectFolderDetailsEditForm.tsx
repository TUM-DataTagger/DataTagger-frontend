'use client';

import { valibotResolver } from '@hookform/resolvers/valibot';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import type { ComponentProps } from 'react';
import { useForm } from 'react-hook-form';
import type { InferInput } from 'valibot';
import { EntityDetailsEditForm } from '@/components/edit-route/EntityDetailsEditForm';
import { ProjectFolderDetailsSchema } from '@/schemas/ProjectFolderDetailsSchema';
import { openAPIClient } from '@/util/clientFetch';
import { formatErrorMessage } from '@/util/formatErrorMessage';
import { logger, LogCategory } from '@/util/logger';
import type { components } from '@/util/openapiSchema';

type ProjectFolderDetailsEditInput = InferInput<typeof ProjectFolderDetailsSchema>;

export function ProjectFolderDetailsEditForm({
	projectUuid,
	folderUuid,
	data,
	...props
}: ComponentProps<'form'> & {
	readonly data: components['schemas']['Folder'];
	readonly folderUuid: string;
	readonly projectUuid: string;
}) {
	const router = useRouter();

	const description = Object.keys(data?.description ?? {}).length ? (data?.description ?? null) : null;

	const {
		control,
		handleSubmit,
		setError,
		formState: { errors },
	} = useForm<ProjectFolderDetailsEditInput>({
		resolver: valibotResolver(ProjectFolderDetailsSchema),
		defaultValues: {
			name: data.name,
			description,
		},
	});

	const { mutate } = useMutation({
		mutationFn: async (input: ProjectFolderDetailsEditInput) => {
			const { error: folderError, response: folderResponse } = await openAPIClient.PATCH('/api/v1/folder/{id}/', {
				params: { path: { id: folderUuid } },
				body: {
					name: input.name,
					description: input.description ?? {},
				},
			});

			if (folderError) {
				throw new Error(formatErrorMessage(folderError, folderResponse));
			}
		},
		async onSuccess(_data, variables) {
			logger.info(LogCategory.Folder, 'Folder details updated', {
				folderUuid,
				name: variables.name,
				hasDescription: Boolean(variables.description && Object.keys(variables.description).length),
			});

			await openAPIClient.POST('/api/v1/folder/{id}/unlock/', {
				params: { path: { id: folderUuid } },
			});

			router.push(`/projects/${projectUuid}/folders/${folderUuid}/files`);
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
			descriptionInputId="edit-project-folder-details-description"
			descriptionPlaceholder="More about the folder ..."
			errors={errors}
			formId="project-folder-details-edit"
			handleSubmit={handleSubmit}
			nameLabel="Folder name"
			namePlaceholder="Name this folder"
			onSubmit={(input) => mutate(input)}
		/>
	);
}
