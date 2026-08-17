import { describe, expect, it } from 'vitest';
import { parseMetadataImportPayload } from '@/util/parseMetadataImportPayload';

describe('parseMetadataImportPayload', () => {
	it('accepts top-level array payload', () => {
		const result = parseMetadataImportPayload(
			JSON.stringify([
				{
					custom_key: 'Project Name',
					field_type: 'TEXT',
					value: 'A',
					config: { placeholder: 'Name' },
				},
			]),
		);

		expect(result).toEqual([
			{
				custom_key: 'Project Name',
				field_type: 'TEXT',
				value: 'A',
				config: { placeholder: 'Name' },
			},
		]);
	});

	it('accepts object payload with top-level metadata array', () => {
		const result = parseMetadataImportPayload(
			JSON.stringify({
				metadata: [
					{
						custom_key: 'Status',
						field_type: 'SELECTION',
						value: 'Open',
					},
				],
			}),
		);

		expect(result).toEqual([
			{
				custom_key: 'Status',
				field_type: 'SELECTION',
				value: 'Open',
				config: {},
			},
		]);
	});

	it('accepts MULTI_SELECTION values as string arrays', () => {
		const result = parseMetadataImportPayload(
			JSON.stringify({
				metadata: [
					{
						custom_key: 'Tags',
						field_type: 'MULTI_SELECTION',
						value: ['A', 'B'],
					},
				],
			}),
		);

		expect(result).toEqual([
			{
				custom_key: 'Tags',
				field_type: 'MULTI_SELECTION',
				value: ['A', 'B'],
				config: {},
			},
		]);
	});

	it('accepts TAG values as string arrays', () => {
		const result = parseMetadataImportPayload(
			JSON.stringify({
				metadata: [
					{
						custom_key: 'Keywords',
						field_type: 'TAG',
						value: ['A', 'B'],
					},
				],
			}),
		);

		expect(result).toEqual([
			{
				custom_key: 'Keywords',
				field_type: 'TAG',
				value: ['A', 'B'],
				config: {},
			},
		]);
	});

	it('uses field.key fallback for custom_key and defaults field_type to TEXT', () => {
		const result = parseMetadataImportPayload(
			JSON.stringify([
				{
					field: { key: 'Fallback key' },
					value: 'value',
				},
			]),
		);

		expect(result).toEqual([
			{
				custom_key: 'Fallback key',
				field_type: 'TEXT',
				value: 'value',
				config: {},
			},
		]);
	});

	it('normalizes missing or invalid config to an empty object', () => {
		const result = parseMetadataImportPayload(
			JSON.stringify([
				{
					custom_key: 'One',
					config: null,
				},
				{
					custom_key: 'Two',
					config: 'bad',
				},
			]),
		);

		expect(result).toEqual([
			{
				custom_key: 'One',
				field_type: 'TEXT',
				value: '',
				config: {},
			},
			{
				custom_key: 'Two',
				field_type: 'TEXT',
				value: '',
				config: {},
			},
		]);
	});

	it('strips lineage and template relationship properties from imported entries', () => {
		const result = parseMetadataImportPayload(
			JSON.stringify([
				{
					custom_key: 'Template candidate',
					field_type: 'TEXT',
					value: 'foo',
					config: { max: 1 },
					previous_version_field: 'prev-uuid',
					pk: 'field-uuid',
					metadata_template_field: 'template-field-uuid',
					metadata_template: { pk: 'template-uuid' },
					order: 99,
				},
			]),
		);

		expect(result).toEqual([
			{
				custom_key: 'Template candidate',
				field_type: 'TEXT',
				value: 'foo',
				config: { max: 1 },
			},
		]);
	});

	it('throws clear errors for invalid payloads', () => {
		expect(() => parseMetadataImportPayload('{bad json')).toThrow('Unable to parse JSON:');
		expect(() => parseMetadataImportPayload(JSON.stringify({ metadata: 'bad' }))).toThrow(
			'Provide a JSON array or an object containing a top-level "metadata" array.',
		);
		expect(() => parseMetadataImportPayload(JSON.stringify([1]))).toThrow('Metadata entry #1 must be an object.');
		expect(() => parseMetadataImportPayload(JSON.stringify([{}]))).toThrow(
			'Metadata entry #1 is missing "custom_key".',
		);
	});

	it('rejects duplicate selection options using trimmed, case-sensitive comparison', () => {
		expect(() =>
			parseMetadataImportPayload(
				JSON.stringify([
					{
						custom_key: 'Status',
						field_type: 'SELECTION',
						value: 'Open',
						config: { options: ['Open', ' Open '] },
					},
				]),
			),
		).toThrow('Metadata entry #1 has an invalid option #1: Option values must be unique.');
	});

	it('rejects whitespace-only selection options', () => {
		expect(() =>
			parseMetadataImportPayload(
				JSON.stringify([
					{
						custom_key: 'Status',
						field_type: 'MULTI_SELECTION',
						value: ['Open'],
						config: { options: ['Open', '   '] },
					},
				]),
			),
		).toThrow('Metadata entry #1 has an invalid option #2: Please enter a valid option value.');
	});

	it('accepts case-variant selection options', () => {
		const result = parseMetadataImportPayload(
			JSON.stringify([
				{
					custom_key: 'Status',
					field_type: 'TAG',
					value: ['Open'],
					config: { options: ['Open', 'open'] },
				},
			]),
		);

		expect(result).toEqual([
			{
				custom_key: 'Status',
				field_type: 'TAG',
				value: ['Open'],
				config: { options: ['Open', 'open'] },
			},
		]);
	});

	it('rejects whitespace-only selected choice values', () => {
		expect(() =>
			parseMetadataImportPayload(
				JSON.stringify([
					{
						custom_key: 'Status',
						field_type: 'SELECTION',
						value: '   ',
						config: { options: ['Open'] },
					},
				]),
			),
		).toThrow('Metadata entry #1 has an invalid "value": Choice values must not be empty after trimming.');
	});

	it('rejects trim-created collisions in selected choice values', () => {
		expect(() =>
			parseMetadataImportPayload(
				JSON.stringify([
					{
						custom_key: 'Status',
						field_type: 'MULTI_SELECTION',
						value: ['Open', ' Open '],
						config: { options: ['Open'] },
					},
				]),
			),
		).toThrow('Metadata entry #1 has an invalid "value": Selected choice values must remain unique after trimming.');
	});

	it('rejects selected values outside configured options but preserves case-sensitive variants', () => {
		expect(() =>
			parseMetadataImportPayload(
				JSON.stringify([
					{
						custom_key: 'Status',
						field_type: 'TAG',
						value: ['Closed'],
						config: { options: ['Open', 'open'] },
					},
				]),
			),
		).toThrow(
			'Metadata entry #1 has an invalid "value": Selected choice values must be included in the configured options.',
		);

		expect(
			parseMetadataImportPayload(
				JSON.stringify([
					{
						custom_key: 'Status',
						field_type: 'TAG',
						value: ['open'],
						config: { options: ['Open', 'open'] },
					},
				]),
			),
		).toEqual([{ custom_key: 'Status', field_type: 'TAG', value: ['open'], config: { options: ['Open', 'open'] } }]);
	});
});
