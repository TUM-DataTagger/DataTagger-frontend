import { describe, expect, it, vi } from 'vitest';
import { DENY_LIST, processDropItem, processSelectedFile } from '@/util/processDropItem';

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

function createSelectedFile(name: string, webkitRelativePath: string) {
	const file = new File(['content'], name);
	Object.defineProperty(file, 'webkitRelativePath', { value: webkitRelativePath });
	return file;
}

describe('processSelectedFile', () => {
	it('returns no directory for files selected without a folder picker', () => {
		const file = createSelectedFile('report.pdf', '');

		expect(processSelectedFile(file)).toEqual([{ file, directory: undefined }]);
	});

	it('builds the same directory path as dropped folders from the relative path', () => {
		const file = createSelectedFile('1r', '10/pdata/1/1r');

		expect(processSelectedFile(file)).toEqual([{ file, directory: '10 / pdata / 1' }]);
	});

	it('rejects files whose name or any parent directory is on the deny list', () => {
		expect(processSelectedFile(createSelectedFile('Thumbs.db', '10/Thumbs.db'))).toEqual([]);
		expect(processSelectedFile(createSelectedFile('config', '10/.git/config'))).toEqual([]);
	});
});
