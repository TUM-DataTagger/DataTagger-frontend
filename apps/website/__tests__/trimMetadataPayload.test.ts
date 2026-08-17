import { describe, expect, it } from 'vitest';
import { trimMetadataPayload } from '@/util/trimMetadataPayload';

describe('trimMetadataPayload', () => {
	it('trims nested metadata strings recursively', () => {
		const input = {
			custom_key: '  Field name  ',
			value: ['  A  ', 'B ', ' C'],
			config: {
				options: ['  Option A', 'Option B  '],
				description: '  Useful guidance  ',
				nested: {
					label: '  Nested label  ',
				},
			},
		};

		const result = trimMetadataPayload(input);

		expect(result).toEqual({
			custom_key: 'Field name',
			value: ['A', 'B', 'C'],
			config: {
				options: ['Option A', 'Option B'],
				description: 'Useful guidance',
				nested: {
					label: 'Nested label',
				},
			},
		});
	});

	it('does not mutate the original payload', () => {
		const input = {
			custom_key: '  Keep original  ',
			config: {
				options: ['  A  '],
			},
		};

		void trimMetadataPayload(input);

		expect(input).toEqual({
			custom_key: '  Keep original  ',
			config: {
				options: ['  A  '],
			},
		});
	});
});
