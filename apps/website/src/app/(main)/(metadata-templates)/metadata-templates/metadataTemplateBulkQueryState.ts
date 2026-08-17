import { parseAsArrayOf, parseAsBoolean, parseAsString } from 'nuqs';

export const metadataTemplateBulkQueryState = {
	bulk_edit: parseAsBoolean.withDefault(false),
	selected: parseAsArrayOf(parseAsString).withDefault([]),
};
