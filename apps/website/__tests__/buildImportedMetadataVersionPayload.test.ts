import { describe, expect, it } from 'vitest';
import { buildImportedMetadataVersionPayload } from '@/util/buildImportedMetadataVersionPayload';

describe('buildImportedMetadataVersionPayload', () => {
	it('keeps template fields first and appends imported metadata with sequential order', () => {
		const result = buildImportedMetadataVersionPayload({
			existingMetadata: [
				{
					custom_key: 'Template A',
					field_type: 'TEXT',
					value: 'template-a',
					config: { from: 'template-a' },
					metadata_template_field: 'template-field-a',
				},
				{
					custom_key: 'Current custom',
					field_type: 'TEXT',
					value: 'stale-custom-value',
					config: { from: 'custom' },
					metadata_template_field: null,
				},
				{
					custom_key: 'Template B',
					field_type: 'TAG',
					value: ['x'],
					config: { options: ['x'] },
					metadata_template_field: 'template-field-b',
				},
			],
			importedMetadata: [
				{
					custom_key: 'Template A',
					field_type: 'TEXT',
					value: 'import-duplicate-key',
					config: {},
				},
				{
					custom_key: 'Imported custom',
					field_type: 'MULTI_SELECTION',
					value: ['a', 'b'],
					config: { options: ['a', 'b'] },
				},
			],
		});

		expect(result).toEqual([
			{
				custom_key: 'Template A',
				field_type: 'TEXT',
				value: 'template-a',
				config: { from: 'template-a' },
				metadata_template_field: 'template-field-a',
				order: 0,
			},
			{
				custom_key: 'Template B',
				field_type: 'TAG',
				value: ['x'],
				config: { options: ['x'] },
				metadata_template_field: 'template-field-b',
				order: 1,
			},
			{
				custom_key: 'Template A',
				field_type: 'TEXT',
				value: 'import-duplicate-key',
				config: {},
				order: 2,
			},
			{
				custom_key: 'Imported custom',
				field_type: 'MULTI_SELECTION',
				value: ['a', 'b'],
				config: { options: ['a', 'b'] },
				order: 3,
			},
		]);
	});

	it('never includes pk or previous_version_field in outgoing payload', () => {
		const result = buildImportedMetadataVersionPayload({
			existingMetadata: [
				{
					custom_key: 'Template A',
					field_type: 'TEXT',
					value: 'template-a',
					config: { from: 'template-a' },
					metadata_template_field: 'template-field-a',
				},
			],
			importedMetadata: [
				{
					custom_key: 'Imported custom',
					field_type: 'TEXT',
					value: 'value',
					config: {},
				},
			],
		});

		for (const field of result) {
			expect('pk' in field).toBe(false);
			expect('previous_version_field' in field).toBe(false);
		}
	});
});
