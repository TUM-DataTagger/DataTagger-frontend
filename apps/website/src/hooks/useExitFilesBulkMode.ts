import { parseAsArrayOf, parseAsBoolean, parseAsString, useQueryStates } from 'nuqs';

export function useExitFilesBulkMode(): () => Promise<void> {
	const [, setQueryStates] = useQueryStates({
		bulk_edit: parseAsBoolean.withDefault(false),
		selected: parseAsArrayOf(parseAsString).withDefault([]),
	});

	return async () => {
		await setQueryStates({ bulk_edit: false, selected: [] });
	};
}
