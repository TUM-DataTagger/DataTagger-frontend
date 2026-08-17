import { parseAsBoolean, useQueryStates } from 'nuqs';

export function useExitTemplateBulkMode(): () => Promise<void> {
	const [, setQueryStates] = useQueryStates({
		template_bulk_edit: parseAsBoolean.withDefault(false),
	});

	return async () => {
		await setQueryStates({ template_bulk_edit: false });
	};
}
