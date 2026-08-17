export function StackedSubtitle(props: { readonly lines: readonly string[] }) {
	return props.lines.map((line, index) => (
		<span
			className="block truncate text-base-xs text-base-neutral-600 dark:text-base-neutral-300"
			key={index}
			title={line}
		>
			{line}
		</span>
	));
}
