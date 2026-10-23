import type { DropItem, FileDropItem } from '@react-types/shared';
import { isDirectoryDropItem, isFileDropItem } from 'react-aria-components';

export const DENY_LIST = ['node_modules', '.git', '.vscode', '.idea', '.DS_Store', 'Thumbs.db'];

export async function processDropItem(item: DropItem, directory?: string) {
	if (isFileDropItem(item)) {
		if (DENY_LIST.some((deny) => item.name.includes(deny))) {
			return [];
		}

		return [{ item, directory }];
	} else if (isDirectoryDropItem(item)) {
		if (DENY_LIST.some((deny) => item.name.includes(deny))) {
			return [];
		}

		const dirName = item.name;

		const dir = item.getEntries();
		const items: { directory?: string | undefined; item: FileDropItem }[] = [];
		for await (const entry of dir) {
			const item = await processDropItem(entry, directory ? `${directory} / ${dirName}` : dirName);
			items.push(...item);
		}

		return items;
	}

	return [];
}

// Files picked via a directory picker carry their path in `webkitRelativePath` (e.g. "10/pdata/1/1r");
// map it to the same directory format and deny list as dropped folders.
export function processSelectedFile(file: File) {
	const segments = file.webkitRelativePath ? file.webkitRelativePath.split('/') : [file.name];
	if (segments.some((segment) => DENY_LIST.some((deny) => segment.includes(deny)))) {
		return [];
	}

	const directory = segments.length > 1 ? segments.slice(0, -1).join(' / ') : undefined;

	return [{ file, directory }];
}
