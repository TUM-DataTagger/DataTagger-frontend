import highlightWords from 'highlight-words';

export function HighlightedText({ text, query }: { readonly query: string; readonly text: string }) {
	const chunks = highlightWords({
		text,
		query,
	});

	return (
		<span aria-hidden>
			{chunks.map(({ text: chunkText, match, key }) => (
				<span className={match ? 'rounded-px bg-base-green-lime-300 dark:bg-base-green-lime-700' : ''} key={key}>
					{chunkText}
				</span>
			))}
		</span>
	);
}
