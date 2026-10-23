// Shared between the server prefetch and the client view, so both build identical query keys.
// While searching, the whole folder is searched instead of only the current subfolder level.
export function getSubfolderDatasetQuery(subfolder: string | null | undefined, search: string | null | undefined) {
	if (search) {
		return {};
	}

	return subfolder ? { subfolder } : { subfolder__isnull: true };
}
