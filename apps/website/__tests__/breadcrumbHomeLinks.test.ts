import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const BREADCRUMB_COMPONENTS = [
	'../src/app/(main)/(metadata-templates)/metadata-templates/[metadataTemplateContainerUuid]/MetadataTemplateContainerBreadcrumbs.tsx',
	'../src/app/(main)/(project-folder-files)/projects/[projectUuid]/folders/[folderUuid]/files/[fileUuid]/ProjectFolderFileBreadcrumbs.tsx',
	'../src/app/(main)/(project-folders)/projects/[projectUuid]/folders/[folderUuid]/ProjectFolderBreadcrumbs.tsx',
	'../src/app/(main)/(projects)/projects/[projectUuid]/ProjectBreadcrumbs.tsx',
	'../src/app/(main)/drafts/[fileUuid]/DraftBreadcrumbs.tsx',
] as const;

describe('breadcrumb home links', () => {
	it.each(BREADCRUMB_COMPONENTS)('%s links Home to the dashboard', (relativePath) => {
		const source = readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), 'utf8');

		expect(source).toContain('<BreadcrumbsItem href="/">Home</BreadcrumbsItem>');
		expect(source).not.toContain('<BreadcrumbsItem href="/drafts">Home</BreadcrumbsItem>');
	});
});
