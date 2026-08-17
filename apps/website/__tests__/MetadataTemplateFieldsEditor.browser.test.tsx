import { useForm } from 'react-hook-form';
import type { InferInput } from 'valibot';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { MetadataTemplateFieldsEditor } from '@/components/metadata-template/fields/MetadataTemplateFieldsEditor';
import type { MetadataTemplateSchema } from '@/schemas/MetadataTemplateSchema';

vi.mock('@/hooks/useFeatureFlags', () => ({
	useFeatureFlags: () => ({
		data: {
			definitions: {},
			values: {},
		},
	}),
	isFeatureFlagEnabled: vi.fn(() => true),
}));

type MetadataTemplateFormInput = InferInput<typeof MetadataTemplateSchema>;

function MetadataTemplateFieldsEditorHarness() {
	const form = useForm<MetadataTemplateFormInput>({
		defaultValues: {
			name: 'Template',
			assigned_to_content_type: null,
			assigned_to_object_id: null,
			metadata_template_fields: [
				{
					custom_key: 'Field A',
					value: '',
					mandatory: false,
					field_type: 'TEXT',
					config: {},
				},
				{
					custom_key: 'Field B',
					value: '',
					mandatory: false,
					field_type: 'TEXT',
					config: {},
				},
				{
					custom_key: 'Field C',
					value: '',
					mandatory: false,
					field_type: 'TEXT',
					config: { description: 'Saved guidance' },
				},
			],
		},
	});

	return (
		<MetadataTemplateFieldsEditor
			control={form.control}
			errors={form.formState.errors}
			getValues={form.getValues}
			setValue={form.setValue}
		/>
	);
}

async function openAddGuidanceDialog(screen: Awaited<ReturnType<typeof render>>, index: number) {
	await screen.getByRole('button', { name: 'Add fill-in guidance' }).nth(index).click();
	return screen.getByRole('textbox', { name: 'Fill-in guidance' });
}

async function openEditGuidanceDialog(screen: Awaited<ReturnType<typeof render>>, index: number) {
	await screen.getByRole('button', { name: 'Edit fill-in guidance' }).nth(index).click();
	return screen.getByRole('textbox', { name: 'Fill-in guidance' });
}

describe('MetadataTemplateFieldsEditor guidance dialog', () => {
	it('clears an unsaved draft when the same empty field is reopened', async () => {
		const screen = await render(<MetadataTemplateFieldsEditorHarness />);

		const textarea = await openAddGuidanceDialog(screen, 0);
		await textarea.fill('Draft guidance');
		await screen.getByRole('button', { name: 'Cancel' }).click();

		const reopenedTextarea = await openAddGuidanceDialog(screen, 0);
		await expect.element(reopenedTextarea).toHaveValue('');
	});

	it('does not carry an unsaved draft from one empty field into another', async () => {
		const screen = await render(<MetadataTemplateFieldsEditorHarness />);

		const firstTextarea = await openAddGuidanceDialog(screen, 0);
		await firstTextarea.fill('Draft guidance');
		await screen.getByRole('button', { name: 'Cancel' }).click();

		const secondTextarea = await openAddGuidanceDialog(screen, 1);
		await expect.element(secondTextarea).toHaveValue('');
	});

	it('restores the saved guidance after canceling edits to an existing field', async () => {
		const screen = await render(<MetadataTemplateFieldsEditorHarness />);

		const textarea = await openEditGuidanceDialog(screen, 0);
		await expect.element(textarea).toHaveValue('Saved guidance');
		await textarea.fill('Updated guidance');
		await screen.getByRole('button', { name: 'Cancel' }).click();

		const reopenedTextarea = await openEditGuidanceDialog(screen, 0);
		await expect.element(reopenedTextarea).toHaveValue('Saved guidance');
	});

	it('reopens with the applied guidance after saving a new value', async () => {
		const screen = await render(<MetadataTemplateFieldsEditorHarness />);

		const textarea = await openAddGuidanceDialog(screen, 0);
		await textarea.fill('Applied guidance');
		await screen.getByRole('button', { name: 'Apply' }).click();

		const reopenedTextarea = await openEditGuidanceDialog(screen, 0);
		await expect.element(reopenedTextarea).toHaveValue('Applied guidance');
	});
});
