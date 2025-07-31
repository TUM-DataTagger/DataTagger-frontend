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
