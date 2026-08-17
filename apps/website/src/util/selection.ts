import type { Key } from 'react';
import type { Selection } from 'react-aria-components';

function getAllKeys(allKeys?: Iterable<Key>): readonly Key[] {
	if (!allKeys) {
		return [];
	}

	return [...allKeys];
}

export function getSelectionKeys(selection: Selection, allKeys?: Iterable<Key>): readonly Key[] {
	if (selection === 'all') {
		return getAllKeys(allKeys);
	}

	return [...selection];
}

export function getSelectionStringValues(selection: Selection, allKeys?: Iterable<Key>): string[] {
	return getSelectionKeys(selection, allKeys).map(String);
}

export function getSelectionStringSet(selection: Selection, allKeys?: Iterable<Key>): Set<string> {
	return new Set(getSelectionStringValues(selection, allKeys));
}

export function getFirstSelectionString(selection: Selection, allKeys?: Iterable<Key>): string | undefined {
	return getSelectionStringValues(selection, allKeys)[0];
}

export function getSelectionSize(selection: Selection, allKeys?: Iterable<Key>): number {
	if (selection === 'all') {
		return getAllKeys(allKeys).length;
	}

	return selection.size;
}
