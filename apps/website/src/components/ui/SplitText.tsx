'use client';

import { motion } from 'motion/react';
import type { CSSProperties, ElementType } from 'react';

type SplitTextProps = {
	readonly text: string;
	readonly className?: string;
	readonly style?: CSSProperties;
	readonly delay?: number;
	readonly duration?: number;
	readonly ease?: [number, number, number, number];
	readonly splitBy?: 'chars' | 'words';
	readonly as?: ElementType;
	readonly from?: { opacity?: number; y?: number };
	readonly to?: { opacity?: number; y?: number };
};

function buildCharSegments(words: string[]) {
	const segments: { chars: { char: string; index: number }[] }[] = [];
	let index = 0;
	for (const word of words) {
		const chars: { char: string; index: number }[] = [];
		for (const char of word) {
			chars.push({ char, index: index++ });
		}
		segments.push({ chars });
		index++; // account for space between words in delay timing
	}
	return segments;
}

export function SplitText({
	text,
	className,
	style,
	delay = 50,
	duration = 0.8,
	ease = [0.25, 1, 0.5, 1],
	splitBy = 'chars',
	as: Tag = 'span',
	from = { opacity: 0, y: 40 },
	to = { opacity: 1, y: 0 },
}: SplitTextProps) {
	const words = text.split(' ');

	if (splitBy === 'words') {
		return (
			<Tag className={className} style={style}>
				{words.map((word, wordIndex) => (
					<span key={wordIndex} style={{ display: 'inline-flex', overflow: 'hidden' }}>
						<motion.span
							initial={from}
							animate={to}
							transition={{ duration, delay: (wordIndex * delay) / 1_000, ease }}
							style={{ display: 'inline-block', willChange: 'transform, opacity' }}
						>
							{word}
						</motion.span>
						{wordIndex < words.length - 1 && <span>&nbsp;</span>}
					</span>
				))}
			</Tag>
		);
	}

	const segments = buildCharSegments(words);

	return (
		<Tag className={className} style={style}>
			{segments.map((segment, wordIdx) => (
				<span key={wordIdx} style={{ display: 'inline-flex', overflow: 'hidden' }}>
					{segment.chars.map(({ char, index }) => (
						<motion.span
							key={index}
							initial={from}
							animate={to}
							transition={{ duration, delay: (index * delay) / 1_000, ease }}
							style={{ display: 'inline-block', willChange: 'transform, opacity' }}
						>
							{char}
						</motion.span>
					))}
					{wordIdx < segments.length - 1 && <span>&nbsp;</span>}
				</span>
			))}
		</Tag>
	);
}
