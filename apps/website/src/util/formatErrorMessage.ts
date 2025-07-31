export function formatErrorMessage(error: Record<string, any>, response?: Response): string {
	if (response?.status === 500) {
		return 'An unexpected error occurred. Please try again later.';
	}

	return Object.entries(error)
		.filter(([key]) => key !== 'status_code' && key !== 'success')
		.map(([_, value]) => (Array.isArray(value) ? value.join('\n') : value))
		.join('\n');
}
