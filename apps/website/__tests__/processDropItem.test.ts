import { describe, expect, it, vi } from 'vitest';
import { DENY_LIST, processDropItem } from '@/util/processDropItem';

vi.mock('react-aria-components', () => ({
	isFileDropItem: (item: unknown) => (item as { kind?: string })?.kind === 'file',
	isDirectoryDropItem: (item: unknown) => (item as { kind?: string })?.kind === 'directory',
}));

type MockDropFile = {
	readonly kind: 'file';
	readonly name: string;
};

type MockDropDirectory = {
	getEntries(): AsyncGenerator<MockDropDirectory | MockDropFile>;
	readonly kind: 'directory';
	readonly name: string;
};

function createDirectory(name: string, entries: readonly (MockDropDirectory | MockDropFile)[]): MockDropDirectory {
	return {
		kind: 'directory',
		name,
		async *getEntries() {
			for (const entry of entries) {
				yield entry;
			}
		},
	};
}

describe('processDropItem', () => {
	it('accepts regular file drop items and returns a flattened result', async () => {
		const file: MockDropFile = {
			kind: 'file',
			name: 'report.pdf',
		};

		await expect(processDropItem(file as never)).resolves.toEqual([{ item: file, directory: undefined }]);
	});

	it('rejects deny-list names for files and directories', async () => {
		const deniedFile: MockDropFile = {
			kind: 'file',
			name: `my-${DENY_LIST[0]}-artifact.txt`,
		};
		const deniedDirectory = createDirectory(`workspace-${DENY_LIST[1]}`, [{ kind: 'file', name: 'nested.txt' }]);

		await expect(processDropItem(deniedFile as never)).resolves.toEqual([]);
		await expect(processDropItem(deniedDirectory as never)).resolves.toEqual([]);
	});

	it('recursively flattens nested directory entries and builds parent/child path prefixes', async () => {
		const nestedDirectory = createDirectory('images', [{ kind: 'file', name: 'diagram.png' }]);
		const topDirectory = createDirectory('project', [{ kind: 'file', name: 'readme.md' }, nestedDirectory]);

		const result = await processDropItem(topDirectory as never);
		expect(result).toEqual([
			{
				item: { kind: 'file', name: 'readme.md' },
				directory: 'project',
			},
			{
				item: { kind: 'file', name: 'diagram.png' },
				directory: 'project / images',
			},
		]);
	});

	it('returns an empty array for unsupported drop item shapes', async () => {
		const unsupported = { kind: 'unknown', name: 'mystery' };

		await expect(processDropItem(unsupported as never)).resolves.toEqual([]);
	});
});
