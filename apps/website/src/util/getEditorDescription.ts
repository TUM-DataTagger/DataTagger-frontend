import type { EditorOptions } from '@tiptap/react';

export function getEditorDescription(value: unknown): EditorOptions['content'] | null {
	if (!value || typeof value !== 'object') {
		return null;
	}

	const content = (value as { content?: unknown }).content;

	if (!Array.isArray(content) || content.length === 0) {
		return null;
	}

	const firstBlock = content[0];

	if (!firstBlock || typeof firstBlock !== 'object') {
		return null;
	}

	const firstBlockContent = (firstBlock as { content?: unknown }).content;

	if (!Array.isArray(firstBlockContent) || firstBlockContent.length === 0) {
		return null;
	}

	return value as EditorOptions['content'];
}
