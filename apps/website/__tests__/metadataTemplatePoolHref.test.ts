import { describe, expect, it } from 'vitest';
import {
	getFolderMetadataTemplatePoolHref,
	getProjectMetadataTemplatePoolHref,
} from '@/components/main-route/metadata-template-pool/metadataTemplatePoolHref';

describe('metadataTemplatePoolHref', () => {
	it('links an active project container to the assigned project version', () => {
		expect(
			getProjectMetadataTemplatePoolHref({
				activeContainerPk: 'container-1',
				activeVersionPk: 'version-1',
				containerPk: 'container-1',
			}),
		).toBe('/metadata-templates/container-1?version=version-1');
	});

	it('links an active folder container to the assigned folder version', () => {
		expect(
			getFolderMetadataTemplatePoolHref({
				containerPk: 'container-1',
				folderActiveContainerPk: 'container-1',
				folderActiveVersionPk: 'folder-version-1',
				projectActiveContainerPk: 'project-container-1',
				projectActiveVersionPk: 'project-version-1',
			}),
		).toBe('/metadata-templates/container-1?version=folder-version-1');
	});

	it('links a folder view project-inherited container to the project assigned version', () => {
		expect(
			getFolderMetadataTemplatePoolHref({
				containerPk: 'container-1',
				folderActiveContainerPk: 'folder-container-1',
				folderActiveVersionPk: 'folder-version-1',
				projectActiveContainerPk: 'container-1',
				projectActiveVersionPk: 'project-version-1',
			}),
		).toBe('/metadata-templates/container-1?version=project-version-1');
	});

	it('falls back to the plain container route for inactive containers', () => {
		expect(
			getProjectMetadataTemplatePoolHref({
				activeContainerPk: 'container-2',
				activeVersionPk: 'version-2',
				containerPk: 'container-1',
			}),
		).toBe('/metadata-templates/container-1');
	});

	it('falls back to the plain container route when the active version is missing', () => {
		expect(
			getProjectMetadataTemplatePoolHref({
				activeContainerPk: 'container-1',
				activeVersionPk: null,
				containerPk: 'container-1',
			}),
		).toBe('/metadata-templates/container-1');
	});
});
