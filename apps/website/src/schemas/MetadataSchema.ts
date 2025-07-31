import {
	array,
	nonEmpty,
	object,
	record,
	union,
	pipe,
	string,
	any,
	nullable,
	exactOptional,
	literal,
	fallback,
	boolean,
} from 'valibot';

export const MetadataSchema = object({
	metadata: array(
		object({
			field: exactOptional(
				object({
					key: string(),
					field_type: exactOptional(
						union([
							literal('TEXT'),
							literal('INTEGER'),
							literal('DECIMAL'),
							literal('DATE'),
							literal('TIME'),
							literal('DATETIME'),
							literal('WYSIWYG'),
							literal('SELECTION'),
						]),
					),
					read_only: exactOptional(boolean()),
				}),
			),
			custom_key: exactOptional(pipe(string(), nonEmpty('Please enter a valid field name'))),
			field_type: exactOptional(
				union([
					literal('TEXT'),
					literal('INTEGER'),
					literal('DECIMAL'),
					literal('DATE'),
					literal('TIME'),
					literal('DATETIME'),
					literal('WYSIWYG'),
					literal('SELECTION'),
				]),
			),
			metadata_template_field: exactOptional(nullable(string())),
			value: fallback(nullable(union([pipe(string(), nonEmpty()), record(string(), any())])), null),
			mandatory: exactOptional(boolean()),
			config: exactOptional(
				object({
					options: exactOptional(array(pipe(string(), nonEmpty('Please enter a valid option value')))),
				}),
			),
		}),
	),
});
