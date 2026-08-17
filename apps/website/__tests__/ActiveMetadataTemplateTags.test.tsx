import { describe, expect, it } from 'vitest';
import { getEffectiveActiveMetadataTemplates } from '@/components/metadata-template/ActiveMetadataTemplateTags';
import type { components } from '@/util/openapiSchema';

function metadataTemplate(
	templatePk: string,
	containerPk: string,
	containerName: string,
): components['schemas']['MetadataTemplate'] {
	return {
		creation_date: '2026-01-01T00:00:00Z',
		created_by: { email: 'creator@example.com', full_name: 'Template Creator', pk: 1, username: 'creator' },
		last_modification_date: '2026-01-01T00:00:00Z',
		last_modified_by: { email: 'editor@example.com', full_name: 'Template Editor', pk: 2, username: 'editor' },
		metadata_template_container: {
			assigned_to_content_object_name: null,
			name: containerName,
			pk: containerPk,
			project: null,
		},
		name: containerName,
		pk: templatePk,
	};
}

describe('getEffectiveActiveMetadataTemplates', () => {
	it('skips empty templates while preserving project to folder order', () => {
		const projectTemplate = metadataTemplate('project-template', 'project-container', 'Project template');
		const folderTemplate = metadataTemplate('folder-template', 'folder-container', 'Folder template');

		expect(
			getEffectiveActiveMetadataTemplates([projectTemplate, null, folderTemplate]).map((template) => template.pk),
		).toEqual(['project-template', 'folder-template']);
	});

	it('deduplicates by metadata template container', () => {
		const projectTemplate = metadataTemplate('project-template', 'shared-container', 'Shared template');
		const folderTemplate = metadataTemplate('folder-template', 'shared-container', 'Shared template');

		expect(
			getEffectiveActiveMetadataTemplates([projectTemplate, folderTemplate]).map((template) => template.pk),
		).toEqual(['project-template']);
	});
});
