import { safeParse } from 'valibot';
import { describe, expect, it } from 'vitest';
import { MetadataSchema } from '@/schemas/MetadataSchema';
import {
	METADATA_CHOICE_EMPTY_VALUE_MESSAGE,
	METADATA_CHOICE_SELECTED_VALUE_MESSAGE,
	METADATA_CHOICE_VALUE_COLLISION_MESSAGE,
	METADATA_OPTION_DUPLICATE_VALUE_MESSAGE,
	METADATA_OPTION_INVALID_VALUE_MESSAGE,
} from '@/util/metadataOptionValidation';

function buildSelectionMetadataInput(options: string[]) {
	return {
		metadata: [
			{
				custom_key: 'Status',
				field_type: 'SELECTION',
				value: 'Open',
				config: {
					options,
				},
			},
		],
	};
}

describe('MetadataSchema option validation', () => {
	it('rejects duplicate option values after trimming', () => {
		const result = safeParse(MetadataSchema, buildSelectionMetadataInput(['Open', ' Open ']));

		expect(result.success).toBe(false);
		expect(result.issues?.some((issue) => issue.message === METADATA_OPTION_DUPLICATE_VALUE_MESSAGE)).toBe(true);
	});

	it('rejects whitespace-only option values', () => {
		const result = safeParse(MetadataSchema, buildSelectionMetadataInput(['Open', '   ']));

		expect(result.success).toBe(false);
		expect(result.issues?.some((issue) => issue.message === METADATA_OPTION_INVALID_VALUE_MESSAGE)).toBe(true);
	});

	it('accepts case-variant option values', () => {
		const result = safeParse(MetadataSchema, buildSelectionMetadataInput(['Open', 'open']));

		expect(result.success).toBe(true);
	});

	it('rejects a selection value that becomes empty after trimming', () => {
		const input = buildSelectionMetadataInput(['Open']);
		input.metadata[0]!.value = '   ';
		const result = safeParse(MetadataSchema, input);
		expect(result.issues?.some((issue) => issue.message === METADATA_CHOICE_EMPTY_VALUE_MESSAGE)).toBe(true);
	});

	it('rejects trim-created collisions in multi-selection values', () => {
		const result = safeParse(MetadataSchema, {
			metadata: [
				{
					custom_key: 'Status',
					field_type: 'MULTI_SELECTION',
					value: ['Open', ' Open '],
					config: { options: ['Open', 'Closed'] },
				},
			],
		});
		expect(result.issues?.some((issue) => issue.message === METADATA_CHOICE_VALUE_COLLISION_MESSAGE)).toBe(true);
	});

	it('rejects canonical selected values missing from configured options', () => {
		const result = safeParse(MetadataSchema, buildSelectionMetadataInput(['Closed']));
		expect(result.issues?.some((issue) => issue.message === METADATA_CHOICE_SELECTED_VALUE_MESSAGE)).toBe(true);
	});

	it('preserves case by accepting case variants as separate options and selected values', () => {
		const input = buildSelectionMetadataInput(['Open', 'open']);
		input.metadata[0]!.value = 'open';
		expect(safeParse(MetadataSchema, input).success).toBe(true);
	});
});
