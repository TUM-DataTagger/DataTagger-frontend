import { describe, expect, it } from 'vitest';
import {
	canManageFileMetadataTemplate,
	getVisuallySelectedFileMetadataTemplateContainerPks,
} from '@/util/fileMetadataTemplateAccess';

describe('canManageFileMetadataTemplate', () => {
	it('allows project admins to manage the dataset template', () => {
		expect(
			canManageFileMetadataTemplate({
				canEditFolder: false,
				isFolderAdmin: false,
				isProjectAdmin: true,
			}),
		).toBe(true);
	});

	it('allows folder admins to manage the dataset template', () => {
		expect(
			canManageFileMetadataTemplate({
				canEditFolder: false,
				isFolderAdmin: true,
				isProjectAdmin: false,
			}),
		).toBe(true);
	});

	it('allows folder editors to manage the dataset template', () => {
		expect(
			canManageFileMetadataTemplate({
				canEditFolder: true,
				isFolderAdmin: false,
				isProjectAdmin: false,
			}),
		).toBe(true);
	});

	it('keeps viewers read-only', () => {
		expect(
			canManageFileMetadataTemplate({
				canEditFolder: false,
				isFolderAdmin: false,
				isProjectAdmin: false,
			}),
		).toBe(false);
	});
});

describe('getVisuallySelectedFileMetadataTemplateContainerPks', () => {
	it('includes dataset, folder, and project active containers for visual feedback', () => {
		expect(
			getVisuallySelectedFileMetadataTemplateContainerPks({
				activeContainerPk: 'dataset-template',
				inheritedContainerPks: ['folder-template', 'project-template'],
			}),
		).toEqual(['dataset-template', 'folder-template', 'project-template']);
	});

	it('deduplicates overlapping container ids', () => {
		expect(
			getVisuallySelectedFileMetadataTemplateContainerPks({
				activeContainerPk: 'shared-template',
				inheritedContainerPks: ['shared-template', 'project-template'],
			}),
		).toEqual(['shared-template', 'project-template']);
	});
});
