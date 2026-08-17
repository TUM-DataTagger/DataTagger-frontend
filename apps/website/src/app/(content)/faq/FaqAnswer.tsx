type FaqAnswerProps = {
	readonly html: string;
};

export function FaqAnswer({ html }: FaqAnswerProps) {
	return (
		// eslint-disable-next-line react/no-danger
		<div dangerouslySetInnerHTML={{ __html: html }} />
	);
}
