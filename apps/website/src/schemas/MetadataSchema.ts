import {
	array,
	nonEmpty,
	object,
	record,
	union,
	pipe,
	string,
	nullable,
	exactOptional,
	literal,
	fallback,
	boolean,
	nullish,
	number,
	maxLength,
	unknown,
	checkItems,
	check,
	forward,
} from 'valibot';
import {
	getMetadataChoiceValueValidationMessage,
	isUniqueMetadataOptionValue,
	isValidMetadataOptionValue,
	METADATA_CHOICE_EMPTY_VALUE_MESSAGE,
	METADATA_CHOICE_SELECTED_VALUE_MESSAGE,
	METADATA_CHOICE_VALUE_COLLISION_MESSAGE,
	METADATA_OPTION_DUPLICATE_VALUE_MESSAGE,
	METADATA_OPTION_INVALID_VALUE_MESSAGE,
} from '@/util/metadataOptionValidation';

/**
 * Metadata values can be various types depending on field_type:
 * - TEXT/WYSIWYG: string
 * - INTEGER/DECIMAL: number (or string representation)
 * - DATE/TIME/DATETIME: string (ISO format)
 * - SELECTION: string
 * - MULTI_SELECTION: array of strings
 * - TAG: array of strings
 * - Complex nested values for special cases
 */
const MetadataValueSchema = union([string(), number(), boolean(), array(string())]);

export const MetadataSchema = object({
	metadata: array(
		pipe(
			object({
				previous_version_field: nullish(string()),
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
								literal('MULTI_SELECTION'),
								literal('TAG'),
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
						literal('MULTI_SELECTION'),
						literal('TAG'),
					]),
				),
				metadata_template: nullish(
					object({
						pk: string(),
						name: nullable(string()),
						metadata_template_container: object({
							pk: string(),
							name: string(),
						}),
					}),
				),
				metadata_template_field: exactOptional(nullable(string())),
				value: fallback(
					nullable(
						union([
							pipe(string(), nonEmpty()),
							array(string()),
							record(string(), union([MetadataValueSchema, unknown()])),
						]),
					),
					null,
				),
				mandatory: exactOptional(boolean()),
				config: exactOptional(
					object({
						options: exactOptional(
							pipe(
								array(string()),
								checkItems(
									(optionValue) => isValidMetadataOptionValue(optionValue),
									METADATA_OPTION_INVALID_VALUE_MESSAGE,
								),
								checkItems(
									(optionValue, optionIndex, optionValues) =>
										isUniqueMetadataOptionValue(optionValue, optionIndex, optionValues),
									METADATA_OPTION_DUPLICATE_VALUE_MESSAGE,
								),
							),
						),
						description: exactOptional(pipe(string(), maxLength(500, 'Please enter no more than 500 characters'))),
					}),
				),
			}),
			forward(
				check(
					(entry) =>
						getMetadataChoiceValueValidationMessage({
							config: entry.config,
							fieldType: entry.field_type ?? entry.field?.field_type,
							value: entry.value,
						}) !== METADATA_CHOICE_EMPTY_VALUE_MESSAGE,
					METADATA_CHOICE_EMPTY_VALUE_MESSAGE,
				),
				['value'],
			),
			forward(
				check(
					(entry) =>
						getMetadataChoiceValueValidationMessage({
							config: entry.config,
							fieldType: entry.field_type ?? entry.field?.field_type,
							value: entry.value,
						}) !== METADATA_CHOICE_VALUE_COLLISION_MESSAGE,
					METADATA_CHOICE_VALUE_COLLISION_MESSAGE,
				),
				['value'],
			),
			forward(
				check(
					(entry) =>
						getMetadataChoiceValueValidationMessage({
							config: entry.config,
							fieldType: entry.field_type ?? entry.field?.field_type,
							value: entry.value,
						}) !== METADATA_CHOICE_SELECTED_VALUE_MESSAGE,
					METADATA_CHOICE_SELECTED_VALUE_MESSAGE,
				),
				['value'],
			),
		),
	),
});
