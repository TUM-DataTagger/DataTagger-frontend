import { describe, expect, it, vi } from 'vitest';
import { render, type RenderResult } from 'vitest-browser-react';
import { Metadata } from '@/components/Metadata';

vi.mock('@/hooks/useFeatureFlags', () => ({
	useFeatureFlags: () => ({
		data: {
			definitions: {},
			values: {},
		},
	}),
	isFeatureFlagEnabled: vi.fn(() => false),
}));

const WYSIWYG_JSON_VALUE = {
	type: 'doc',
	content: [
		{
			type: 'paragraph',
			content: [{ type: 'text', text: 'Prefilled from JSON value' }],
		},
	],
} as const;

async function renderWysiwygMetadata(value: unknown): Promise<RenderResult> {
	return render(
		<Metadata
			errorMessage={undefined}
			fieldType="WYSIWYG"
			isDisabled={false}
			label="Value"
			onBlur={() => {}}
			onChange={() => {}}
			value={value}
		/>,
	);
}

async function getEditorContentNode(screen: RenderResult): Promise<HTMLElement> {
	await expect.poll(() => screen.baseElement.querySelector('.ProseMirror')).not.toBeNull();

	const proseMirror = screen.baseElement.querySelector('.ProseMirror');
	if (!(proseMirror instanceof HTMLElement)) {
		throw new Error('Expected a ProseMirror root element.');
	}

	return proseMirror;
}

describe('Metadata WYSIWYG editor prefill', () => {
	it('prefills from TipTap JSON content', async () => {
		const screen = await renderWysiwygMetadata(WYSIWYG_JSON_VALUE);
		const editorContentNode = await getEditorContentNode(screen);

		await expect.poll(() => editorContentNode.textContent?.trim() ?? '').toContain('Prefilled from JSON value');
	});

	it('prefills from legacy string content', async () => {
		const screen = await renderWysiwygMetadata('Legacy WYSIWYG value');
		const editorContentNode = await getEditorContentNode(screen);

		await expect.poll(() => editorContentNode.textContent?.trim() ?? '').toContain('Legacy WYSIWYG value');
	});

	it('falls back to empty content for null values', async () => {
		const screen = await renderWysiwygMetadata(null);
		const editorContentNode = await getEditorContentNode(screen);

		await expect.poll(() => editorContentNode.textContent?.trim() ?? '').toBe('');
	});

	it('falls back to empty content for number values', async () => {
		const screen = await renderWysiwygMetadata(42);
		const editorContentNode = await getEditorContentNode(screen);

		await expect.poll(() => editorContentNode.textContent?.trim() ?? '').toBe('');
	});

	it('falls back to empty content for boolean values', async () => {
		const screen = await renderWysiwygMetadata(true);
		const editorContentNode = await getEditorContentNode(screen);

		await expect.poll(() => editorContentNode.textContent?.trim() ?? '').toBe('');
	});
});
